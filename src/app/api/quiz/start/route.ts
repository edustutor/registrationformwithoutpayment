import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { gradeLabel, resolveTrackId, trackLabel, type AlTrackId, type GradeId } from "@/lib/catalog";
import { quizStartSchema } from "@/lib/schemas";
import { TIMER_SECONDS } from "@/lib/scoring";
import type { QuizStartResponse } from "@/lib/types";
import { apiError, issuesToMessages } from "@/server/api-response";
import { createQuizToken } from "@/server/quiz-token";
import { QuestionBankError, selectQuestions, toClientQuestion } from "@/server/question-bank";
import { upsertRegistrationRow } from "@/server/sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts one challenge attempt.
 *
 * Picks the questions on the server, records which ones in a signed token, and
 * returns the questions with the answer key removed. The browser cannot learn
 * the answers, and cannot later claim it was asked different questions.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_FAILED", "Request body must be JSON.", 400);
  }

  const parsed = quizStartSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_FAILED",
      "Please check your grade and medium selection.",
      400,
      issuesToMessages(parsed.error.issues),
    );
  }

  const { sessionId, language, grade, medium, alTrack } = parsed.data;
  const trackId = resolveTrackId(grade as GradeId, (alTrack ?? null) as AlTrackId | null);
  if (!trackId) {
    return apiError("VALIDATION_FAILED", "A/L students must choose a stream.", 400);
  }

  try {
    const questions = selectQuestions(trackId);
    const attemptId = randomUUID();

    // Attach the grade to the lead captured on the first screen, so a student
    // who abandons mid-quiz is still a lead the sales team can act on rather
    // than just a name and a number. Written before the clock is stamped, so
    // the time this takes never comes out of the student's 60 seconds.
    try {
      await upsertRegistrationRow(sessionId, {
        "Attempt Id": attemptId,
        Status: "QUIZ_STARTED",
        Language: language,
        Grade: gradeLabel(grade),
        "A/L Track": alTrack ? trackLabel(alTrack) : "",
        Medium: medium,
      });
    } catch (error) {
      // Never block the challenge on storage. The submit handler writes the
      // full row again, so a failure here costs only the abandonment detail.
      console.error("[quiz/start] could not attach grade to lead", error);
    }

    const token = createQuizToken({
      attemptId,
      sessionId,
      grade: grade as GradeId,
      alTrack: (alTrack ?? null) as AlTrackId | null,
      medium,
      trackId,
      language,
      questionIds: questions.map((question) => question.id),
      startedAt: Date.now(),
    });

    return NextResponse.json<QuizStartResponse>({
      attemptId,
      token,
      questions: questions.map(toClientQuestion),
      durationSeconds: TIMER_SECONDS,
    });
  } catch (error) {
    if (error instanceof QuestionBankError) {
      console.error("[quiz/start] question bank", error.message);
      return apiError("CONFIG_ERROR", "No questions are available for that grade.", 500);
    }
    console.error("[quiz/start] unexpected", error);
    return apiError("INTERNAL_ERROR", "Could not start the challenge.", 500);
  }
}
