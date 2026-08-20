// ---------------------------------------------------------------------------
// Shared API contracts between the browser and the route handlers.
// Anything the client is allowed to see lives here. The answer key does not.
// ---------------------------------------------------------------------------

import type { AlTrackId, Bilingual, GradeId, LanguageCode, MediumId, TrackId } from "./catalog";
import type { BadgeId, Difficulty, TierId } from "./scoring";

/** A question as the browser receives it: no correct_option_id, ever. */
export type ClientQuestion = {
  id: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  prompt: Bilingual;
  options: { id: string; text: Bilingual }[];
};

export type QuizStartRequest = {
  sessionId: string;
  language: LanguageCode;
  grade: GradeId;
  medium: MediumId;
  alTrack?: AlTrackId | null;
};

export type QuizStartResponse = {
  attemptId: string;
  /** Signed by the server. Sent back on submit so answers cannot be forged. */
  token: string;
  questions: ClientQuestion[];
  durationSeconds: number;
};

export type SubmittedAnswer = {
  questionId: string;
  /** null means the student ran out of time on this question. */
  selectedOptionId: string | null;
  responseMs: number;
};

export type QuizSubmitRequest = {
  token: string;
  answers: SubmittedAnswer[];
};

/** Per-question outcome sent back to the browser. Deliberately withholds the
 *  correct option, because the festival leaderboard would not survive students
 *  passing answers around the hall. */
export type ResultQuestion = {
  questionId: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  isCorrect: boolean;
  responseMs: number;
  points: number;
};

export type ChallengeResult = {
  attemptId: string;
  sessionId: string;
  grade: GradeId;
  alTrack: AlTrackId | null;
  medium: MediumId;
  trackId: TrackId;
  correctCount: number;
  totalQuestions: number;
  normalisedScore: number;
  rawScore: number;
  elapsedMs: number;
  tier: TierId;
  badges: BadgeId[];
  rank: number;
  rankOutOf: number;
  questions: ResultQuestion[];
};

export type QuizSubmitResponse = {
  result: ChallengeResult;
  /** True when the score could not be persisted. The student still sees a
   *  result; booth staff are told to record it manually. */
  storageFailed?: boolean;
};

export type RegistrationRequest = {
  sessionId: string;
  attemptId: string;
  language: LanguageCode;
  fullName: string;
  phone: string;
  contactOwner: string;
  school: string;
  district: string;
  subjects: string[];
  classType: string;
  startIntent: string;
};

export type RegistrationResponse = {
  success: true;
};

export type ApiErrorResponse = {
  error: string;
  /** Machine-readable so the browser can react without matching on prose. */
  code:
    | "VALIDATION_FAILED"
    | "SESSION_INVALID"
    | "SESSION_EXPIRED"
    | "CONFIG_ERROR"
    | "STORAGE_ERROR"
    | "INTERNAL_ERROR";
  details?: string[];
};
