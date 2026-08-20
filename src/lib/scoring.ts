// ---------------------------------------------------------------------------
// EDUS 60-Second Challenge - scoring rules.
//
// Straight from the campaign config: accuracy dominates, speed only breaks
// close ties. Every function here is pure so the server can grade an attempt
// and the result screen can display it without the two ever disagreeing.
//
// Grading itself runs on the server only. The client never sees an answer key.
// ---------------------------------------------------------------------------

export type Difficulty = "easy" | "medium" | "hard";

export const QUESTION_COUNT = 5;
export const TIMER_SECONDS = 60;

/** Grace window so a submit that lands slightly late is still accepted. */
export const SUBMIT_GRACE_MS = 5_000;

export const BASE_POINTS: Record<Difficulty, number> = {
  easy: 900,
  medium: 1000,
  hard: 1100,
};

export const SPEED_BONUS_MAX = 100;
/** Answering within this window earns part of the speed bonus. */
export const SPEED_BONUS_WINDOW_MS = 12_000;

export const STREAK_POINTS_PER_EXTRA_CORRECT = 50;
export const STREAK_BONUS_MAX = 200;

export const PERFECT_BONUS = 250;
export const NORMALISED_SCALE = 10_000;

export type TierId = "CHAMPION" | "EXCELLENT" | "GREAT_START" | "CHALLENGE_ACCEPTED";
export type BadgeId = "LIGHTNING_START" | "THREE_STREAK" | "PERFECT_5" | "FAST_FINISH";

/** One graded question. Built on the server after checking the answer key. */
export type GradedAnswer = {
  questionId: string;
  difficulty: Difficulty;
  selectedOptionId: string | null;
  isCorrect: boolean;
  responseMs: number;
  points: number;
};

export type ScoreBreakdown = {
  correctCount: number;
  questionPoints: number;
  streakBonus: number;
  perfectBonus: number;
  rawScore: number;
  maxRawScore: number;
  normalisedScore: number;
  longestStreak: number;
  hardCorrect: number;
};

/**
 * Speed bonus for one correct answer. Wrong answers always score zero so a
 * student cannot gain anything by rushing through and guessing.
 */
export function speedBonus(responseMs: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  const clamped = Math.min(Math.max(responseMs, 0), SPEED_BONUS_WINDOW_MS);
  return Math.round(SPEED_BONUS_MAX * (1 - clamped / SPEED_BONUS_WINDOW_MS));
}

export function pointsForAnswer(difficulty: Difficulty, responseMs: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  return BASE_POINTS[difficulty] + speedBonus(responseMs, isCorrect);
}

/** Longest run of consecutive correct answers, used for the streak bonus. */
export function longestCorrectStreak(answers: Pick<GradedAnswer, "isCorrect">[]): number {
  let longest = 0;
  let current = 0;
  for (const answer of answers) {
    current = answer.isCorrect ? current + 1 : 0;
    if (current > longest) longest = current;
  }
  return longest;
}

export function streakBonusFor(longestStreak: number): number {
  if (longestStreak < 2) return 0;
  const earned = (longestStreak - 1) * STREAK_POINTS_PER_EXTRA_CORRECT;
  return Math.min(earned, STREAK_BONUS_MAX);
}

/**
 * Best score reachable on the exact question set this student was given.
 * A student who drew three hard questions is not penalised against one who
 * drew three easy ones, because we normalise against their own maximum.
 */
export function maxRawScoreFor(difficulties: Difficulty[]): number {
  const perQuestion = difficulties.reduce(
    (total, difficulty) => total + BASE_POINTS[difficulty] + SPEED_BONUS_MAX,
    0,
  );
  const bestStreak = streakBonusFor(difficulties.length);
  const perfect = difficulties.length === QUESTION_COUNT ? PERFECT_BONUS : 0;
  return perQuestion + bestStreak + perfect;
}

export function scoreAttempt(answers: GradedAnswer[]): ScoreBreakdown {
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const questionPoints = answers.reduce((total, answer) => total + answer.points, 0);
  const longestStreak = longestCorrectStreak(answers);
  const streakBonus = streakBonusFor(longestStreak);
  const perfectBonus = correctCount === QUESTION_COUNT ? PERFECT_BONUS : 0;
  const rawScore = questionPoints + streakBonus + perfectBonus;

  const maxRawScore = maxRawScoreFor(answers.map((answer) => answer.difficulty));
  const normalisedScore =
    maxRawScore > 0
      ? Math.min(NORMALISED_SCALE, Math.max(0, Math.round((rawScore / maxRawScore) * NORMALISED_SCALE)))
      : 0;

  const hardCorrect = answers.filter(
    (answer) => answer.isCorrect && answer.difficulty === "hard",
  ).length;

  return {
    correctCount,
    questionPoints,
    streakBonus,
    perfectBonus,
    rawScore,
    maxRawScore,
    normalisedScore,
    longestStreak,
    hardCorrect,
  };
}

export function tierFor(correctCount: number): TierId {
  if (correctCount >= 5) return "CHAMPION";
  if (correctCount === 4) return "EXCELLENT";
  if (correctCount === 3) return "GREAT_START";
  return "CHALLENGE_ACCEPTED";
}

export function badgesFor(answers: GradedAnswer[], elapsedMs: number): BadgeId[] {
  const badges: BadgeId[] = [];
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const first = answers[0];

  if (first?.isCorrect && first.responseMs <= 5_000) badges.push("LIGHTNING_START");
  if (longestCorrectStreak(answers) >= 3) badges.push("THREE_STREAK");
  if (correctCount === QUESTION_COUNT) badges.push("PERFECT_5");
  if (elapsedMs <= 35_000 && correctCount >= 4) badges.push("FAST_FINISH");

  return badges;
}

/**
 * Leaderboard order from the config: accuracy, then normalised score, then
 * hard questions answered correctly, then speed, then who submitted first.
 */
export type RankableAttempt = {
  correctCount: number;
  normalisedScore: number;
  hardCorrect: number;
  elapsedMs: number;
  submittedAt: number;
};

export function compareForRank(a: RankableAttempt, b: RankableAttempt): number {
  if (a.correctCount !== b.correctCount) return b.correctCount - a.correctCount;
  if (a.normalisedScore !== b.normalisedScore) return b.normalisedScore - a.normalisedScore;
  if (a.hardCorrect !== b.hardCorrect) return b.hardCorrect - a.hardCorrect;
  if (a.elapsedMs !== b.elapsedMs) return a.elapsedMs - b.elapsedMs;
  return a.submittedAt - b.submittedAt;
}
