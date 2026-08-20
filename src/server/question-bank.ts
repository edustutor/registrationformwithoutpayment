// ---------------------------------------------------------------------------
// The question bank: loading, selecting and grading.
//
// This module holds the answer key, so it is server-only and must never be
// imported from a component. The browser only ever receives the output of
// toClientQuestion(), which strips correct_option_id.
// ---------------------------------------------------------------------------

import "server-only";

import rawQuestions from "../../EDUS_YGC_2026_Questions_Only.json";

import type { Bilingual, TrackId } from "@/lib/catalog";
import type { ClientQuestion } from "@/lib/types";
import { QUESTION_COUNT, pointsForAnswer, type Difficulty, type GradedAnswer } from "@/lib/scoring";

type BankQuestion = {
  id: string;
  grade_or_track: string;
  subject: string;
  difficulty: Difficulty;
  topic: string;
  type: string;
  prompt: Bilingual;
  options: { id: string; text: Bilingual }[];
  correct_option_id: string;
};

const QUESTIONS = rawQuestions as BankQuestion[];

/** grade_or_track -> questions, built once per server instance. */
const POOLS: Map<string, BankQuestion[]> = (() => {
  const pools = new Map<string, BankQuestion[]>();
  for (const question of QUESTIONS) {
    const pool = pools.get(question.grade_or_track);
    if (pool) pool.push(question);
    else pools.set(question.grade_or_track, [question]);
  }
  return pools;
})();

const BY_ID: Map<string, BankQuestion> = new Map(QUESTIONS.map((q) => [q.id, q]));

/** Difficulty mix per grade band, taken from the campaign config. */
type Blueprint = { easy: number; medium: number; hard: number; subjectSpreadMin: number };

const BLUEPRINTS: Record<string, Blueprint> = {
  G1_G3: { easy: 3, medium: 2, hard: 0, subjectSpreadMin: 3 },
  G4_G5: { easy: 2, medium: 3, hard: 0, subjectSpreadMin: 3 },
  G6_G9: { easy: 1, medium: 3, hard: 1, subjectSpreadMin: 3 },
  G10_G11: { easy: 1, medium: 2, hard: 2, subjectSpreadMin: 3 },
  AL: { easy: 1, medium: 3, hard: 1, subjectSpreadMin: 3 },
};

function blueprintFor(trackId: TrackId): Blueprint {
  if (trackId.startsWith("AL")) return BLUEPRINTS.AL;
  if (trackId === "G3") return BLUEPRINTS.G1_G3;
  if (trackId === "G4" || trackId === "G5") return BLUEPRINTS.G4_G5;
  if (trackId === "G10" || trackId === "G11") return BLUEPRINTS.G10_G11;
  return BLUEPRINTS.G6_G9;
}

/** Fisher-Yates. A sort() with a random comparator is biased, not shuffled. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Takes `count` questions, preferring subjects not already used so a student
 * gets a spread rather than five Maths questions. Falls back to any remaining
 * candidate when the pool cannot spread any further.
 */
function takeSpreadBySubject(
  candidates: BankQuestion[],
  count: number,
  usedSubjects: Set<string>,
): BankQuestion[] {
  const shuffled = shuffle(candidates);
  const picked: BankQuestion[] = [];

  for (const question of shuffled) {
    if (picked.length === count) break;
    if (!usedSubjects.has(question.subject)) {
      picked.push(question);
      usedSubjects.add(question.subject);
    }
  }

  for (const question of shuffled) {
    if (picked.length === count) break;
    if (!picked.includes(question)) picked.push(question);
  }

  return picked;
}

export class QuestionBankError extends Error {}

/**
 * Picks the five questions for one attempt: the right difficulty mix for the
 * grade, spread across subjects, shuffled, with the options shuffled too.
 */
export function selectQuestions(trackId: TrackId): BankQuestion[] {
  const pool = POOLS.get(trackId);
  if (!pool || pool.length < QUESTION_COUNT) {
    throw new QuestionBankError(`No question pool for track ${trackId}`);
  }

  const blueprint = blueprintFor(trackId);
  const usedSubjects = new Set<string>();
  const selected: BankQuestion[] = [];

  const wanted: [Difficulty, number][] = [
    ["hard", blueprint.hard],
    ["medium", blueprint.medium],
    ["easy", blueprint.easy],
  ];

  for (const [difficulty, count] of wanted) {
    if (count === 0) continue;
    const candidates = pool.filter(
      (question) => question.difficulty === difficulty && !selected.includes(question),
    );
    selected.push(...takeSpreadBySubject(candidates, count, usedSubjects));
  }

  // Top up if a difficulty bucket ran short, so a student is never given
  // fewer than five questions.
  if (selected.length < QUESTION_COUNT) {
    const remaining = pool.filter((question) => !selected.includes(question));
    selected.push(...takeSpreadBySubject(remaining, QUESTION_COUNT - selected.length, usedSubjects));
  }

  return shuffle(selected.slice(0, QUESTION_COUNT));
}

/** Strips the answer key and shuffles the options for display. */
export function toClientQuestion(question: BankQuestion): ClientQuestion {
  return {
    id: question.id,
    subject: question.subject,
    topic: question.topic,
    difficulty: question.difficulty,
    prompt: question.prompt,
    options: shuffle(question.options).map((option) => ({ id: option.id, text: option.text })),
  };
}

export function findQuestion(questionId: string): BankQuestion | undefined {
  return BY_ID.get(questionId);
}

export type GradedQuestion = GradedAnswer & {
  subject: string;
  topic: string;
  promptEn: string;
  correctOptionId: string;
  selectedTextEn: string;
};

/**
 * Grades one attempt against the assigned question IDs from the signed token.
 * An answer for a question the student was not assigned is rejected upstream,
 * so by this point every ID is known to be legitimate.
 */
export function gradeAnswers(
  assignedQuestionIds: string[],
  submitted: { questionId: string; selectedOptionId: string | null; responseMs: number }[],
): GradedQuestion[] {
  const byQuestionId = new Map(submitted.map((answer) => [answer.questionId, answer]));

  return assignedQuestionIds.map((questionId) => {
    const question = BY_ID.get(questionId);
    if (!question) throw new QuestionBankError(`Unknown question ${questionId}`);

    const answer = byQuestionId.get(questionId);
    const selectedOptionId = answer?.selectedOptionId ?? null;
    const responseMs = answer?.responseMs ?? 0;
    const isCorrect = selectedOptionId === question.correct_option_id;
    const selectedOption = question.options.find((option) => option.id === selectedOptionId);

    return {
      questionId,
      difficulty: question.difficulty,
      selectedOptionId,
      isCorrect,
      responseMs,
      points: pointsForAnswer(question.difficulty, responseMs, isCorrect),
      subject: question.subject,
      topic: question.topic,
      promptEn: question.prompt.en,
      correctOptionId: question.correct_option_id,
      selectedTextEn: selectedOption?.text.en ?? "",
    };
  });
}
