// ---------------------------------------------------------------------------
// Signed quiz sessions.
//
// The browser never learns which option is correct, so it also cannot be
// trusted to say which questions it was asked. The server issues a signed
// token at quiz start listing the exact question IDs, the track and the start
// time, and refuses any submission that does not match it.
// ---------------------------------------------------------------------------

import "server-only";

import crypto from "crypto";

import type { AlTrackId, GradeId, LanguageCode, MediumId, TrackId } from "@/lib/catalog";
import { getServerEnv } from "./env";

export type QuizTokenPayload = {
  attemptId: string;
  sessionId: string;
  grade: GradeId;
  alTrack: AlTrackId | null;
  medium: MediumId;
  trackId: TrackId;
  language: LanguageCode;
  questionIds: string[];
  /** Server clock at issue time. All timing is measured against this. */
  startedAt: number;
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(body: string): string {
  return crypto.createHmac("sha256", getServerEnv().quizTokenSecret).update(body).digest("base64url");
}

export function createQuizToken(payload: QuizTokenPayload): string {
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export type QuizTokenResult =
  | { ok: true; payload: QuizTokenPayload }
  | { ok: false; reason: "MALFORMED" | "BAD_SIGNATURE" };

export function readQuizToken(token: string): QuizTokenResult {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return { ok: false, reason: "MALFORMED" };

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(body);

  // Constant-time compare so the signature cannot be guessed byte by byte.
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) {
    return { ok: false, reason: "BAD_SIGNATURE" };
  }

  try {
    return { ok: true, payload: JSON.parse(Buffer.from(body, "base64url").toString("utf8")) };
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }
}
