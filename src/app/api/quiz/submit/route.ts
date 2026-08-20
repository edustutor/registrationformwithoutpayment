import { NextResponse } from "next/server";

import { gradeLabel, trackLabel } from "@/lib/catalog";
import { quizSubmitSchema } from "@/lib/schemas";
import {
  QUESTION_COUNT,
  TIMER_SECONDS,
  badgesFor,
  scoreAttempt,
  tierFor,
  type GradedAnswer,
} from "@/lib/scoring";
import type { ChallengeResult, QuizSubmitResponse, SubmittedAnswer } from "@/lib/types";
import { apiError, issuesToMessages } from "@/server/api-response";
import { QuestionBankError, gradeAnswers, type GradedQuestion } from "@/server/question-bank";
import { readQuizToken, type QuizTokenPayload } from "@/server/quiz-token";
import {
  CAMPAIGN_CODE,
  LEAD_SOURCE,
  appendQuizAttemptRows,
  rankAgainstPeers,
  upsertRegistrationRow,
  type QuizAttemptRow,
} from "@/server/sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A token older than this is treated as abandoned rather than submitted late. */
const SESSION_MAX_AGE_MS = 30 * 60 * 1000;

const TIMER_MS = TIMER_SECONDS * 1000;

/**
 * Per-question timings come from the browser, so they can be understated to
 * farm the speed bonus. The server knows how long the whole attempt really
 * took, so the reported timings are rescaled to add up to exactly that.
 *
 * A student who answers honestly is unaffected, because their timings already
 * sum to roughly the elapsed time. A client claiming every answer took zero
 * milliseconds gets the real elapsed time spread across its answers instead of
 * a free speed bonus. Shifting time between questions is still possible but is
 * worth at most a few points, and accuracy dominates the score by design.
 */
function reconcileResponseTimes(answers: SubmittedAnswer[], elapsedMs: number): SubmittedAnswer[] {
  const clamped = answers.map((answer) => ({
    ...answer,
    responseMs: Math.min(Math.max(Math.round(answer.responseMs), 0), elapsedMs),
  }));

  if (elapsedMs <= 0 || clamped.length === 0) return clamped;

  const claimed = clamped.reduce((total, answer) => total + answer.responseMs, 0);

  // Nothing usable was reported, so share the real elapsed time out evenly.
  if (claimed === 0) {
    const share = Math.round(elapsedMs / clamped.length);
    return clamped.map((answer) => ({ ...answer, responseMs: share }));
  }

  const scale = elapsedMs / claimed;
  return clamped.map((answer) => ({
    ...answer,
    responseMs: Math.min(Math.round(answer.responseMs * scale), elapsedMs),
  }));
}

/** Rejects a submission that answers anything other than the assigned set. */
function answersMatchAssignment(assigned: string[], answers: SubmittedAnswer[]): boolean {
  if (answers.length !== assigned.length) return false;
  const assignedSet = new Set(assigned);
  const seen = new Set<string>();

  for (const answer of answers) {
    if (!assignedSet.has(answer.questionId)) return false;
    if (seen.has(answer.questionId)) return false;
    seen.add(answer.questionId);
  }
  return true;
}

function toAttemptRows(
  payload: QuizTokenPayload,
  graded: GradedQuestion[],
  submittedAtIso: string,
): QuizAttemptRow[] {
  return graded.map((answer, index) => ({
    "Submitted At": submittedAtIso,
    "Session Id": payload.sessionId,
    "Attempt Id": payload.attemptId,
    Grade: gradeLabel(payload.grade),
    "A/L Track": payload.alTrack ? trackLabel(payload.alTrack) : "",
    Medium: payload.medium,
    Language: payload.language,
    "Question No": index + 1,
    "Question Id": answer.questionId,
    Subject: answer.subject,
    Topic: answer.topic,
    Difficulty: answer.difficulty,
    "Question (EN)": answer.promptEn,
    "Selected Option": answer.selectedOptionId ?? "No answer",
    "Selected Answer (EN)": answer.selectedTextEn,
    "Correct Option": answer.correctOptionId,
    "Is Correct": answer.isCorrect ? "Yes" : "No",
    "Response Time (ms)": answer.responseMs,
    Points: answer.points,
  }));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_FAILED", "Request body must be JSON.", 400);
  }

  const parsed = quizSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_FAILED",
      "That submission was not in the expected format.",
      400,
      issuesToMessages(parsed.error.issues),
    );
  }

  const token = readQuizToken(parsed.data.token);
  if (!token.ok) {
    return apiError("SESSION_INVALID", "This challenge session could not be verified.", 401);
  }

  const payload = token.payload;
  const now = Date.now();
  const realElapsedMs = now - payload.startedAt;

  if (realElapsedMs < 0 || realElapsedMs > SESSION_MAX_AGE_MS) {
    return apiError("SESSION_EXPIRED", "This challenge session has expired.", 410);
  }

  if (!answersMatchAssignment(payload.questionIds, parsed.data.answers)) {
    return apiError("SESSION_INVALID", "Those answers do not match this challenge.", 400);
  }

  // The clock stops at 60 seconds even when the network delivered the submit
  // a little later, so a slow connection never costs a student points.
  const elapsedMs = Math.min(realElapsedMs, TIMER_MS);
  const answers = reconcileResponseTimes(parsed.data.answers, elapsedMs);

  let graded: GradedQuestion[];
  try {
    graded = gradeAnswers(payload.questionIds, answers);
  } catch (error) {
    if (error instanceof QuestionBankError) {
      console.error("[quiz/submit] question bank", error.message);
      return apiError("SESSION_INVALID", "This challenge refers to questions we cannot find.", 400);
    }
    throw error;
  }

  const breakdown = scoreAttempt(graded as GradedAnswer[]);
  const tier = tierFor(breakdown.correctCount);
  const badges = badgesFor(graded as GradedAnswer[], elapsedMs);
  const elapsedSeconds = Math.round(elapsedMs / 100) / 10;
  const submittedAtIso = new Date(now).toISOString();

  const gradeName = gradeLabel(payload.grade);
  const trackName = payload.alTrack ? trackLabel(payload.alTrack) : "";

  // Rank first, then write. Reading peers before the row exists avoids
  // counting this attempt against itself and saves a second write.
  let rank = 1;
  let rankOutOf = 1;
  let storageFailed = false;

  try {
    const ranking = await rankAgainstPeers(gradeName, trackName, payload.sessionId, {
      correctCount: breakdown.correctCount,
      normalisedScore: breakdown.normalisedScore,
      hardCorrect: breakdown.hardCorrect,
      elapsedMs,
      submittedAt: now,
    });
    rank = ranking.rank;
    rankOutOf = ranking.rankOutOf;

    await upsertRegistrationRow(payload.sessionId, {
      "Attempt Id": payload.attemptId,
      "Started At": new Date(payload.startedAt).toISOString(),
      "Submitted At": submittedAtIso,
      Status: "CHALLENGE_COMPLETED",
      Language: payload.language,
      Grade: gradeName,
      "A/L Track": trackName,
      Medium: payload.medium,
      "Correct Count": breakdown.correctCount,
      "Hard Correct": breakdown.hardCorrect,
      "Total Questions": QUESTION_COUNT,
      Score: breakdown.normalisedScore,
      "Time Taken (s)": elapsedSeconds,
      Tier: tier,
      Badges: badges.join(", "),
      "Grade Rank": rank,
      Source: LEAD_SOURCE,
      Campaign: CAMPAIGN_CODE,
    });

    await appendQuizAttemptRows(toAttemptRows(payload, graded, submittedAtIso));
  } catch (error) {
    // The student already earned this score. Show it, flag it, and let booth
    // staff record it by hand rather than losing their attempt to an outage.
    console.error("[quiz/submit] storage failed", error);
    storageFailed = true;
  }

  const result: ChallengeResult = {
    attemptId: payload.attemptId,
    sessionId: payload.sessionId,
    grade: payload.grade,
    alTrack: payload.alTrack,
    medium: payload.medium,
    trackId: payload.trackId,
    correctCount: breakdown.correctCount,
    totalQuestions: QUESTION_COUNT,
    normalisedScore: breakdown.normalisedScore,
    rawScore: breakdown.rawScore,
    elapsedMs,
    tier,
    badges,
    rank,
    rankOutOf,
    questions: graded.map((answer) => ({
      questionId: answer.questionId,
      subject: answer.subject,
      topic: answer.topic,
      difficulty: answer.difficulty,
      isCorrect: answer.isCorrect,
      responseMs: answer.responseMs,
      points: answer.points,
    })),
  };

  return NextResponse.json<QuizSubmitResponse>({ result, storageFailed });
}
