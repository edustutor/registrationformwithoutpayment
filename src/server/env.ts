// ---------------------------------------------------------------------------
// Server environment. Read once, validated once, so a missing variable fails
// with a clear message instead of a confusing Google API error at the booth.
// This module is server-only. Importing it from a client component is a bug.
// ---------------------------------------------------------------------------

import "server-only";

import crypto from "crypto";

export type ServerEnv = {
  googleServiceAccountEmail: string;
  googlePrivateKey: string;
  googleSheetId: string;
  registrationsSheetGid: number;
  quizAttemptsSheetTitle: string;
  perfexApiToken: string | null;
  quizTokenSecret: string;
};

/**
 * Values in .env.local are sometimes wrapped in quotes. Next.js strips them,
 * but a stray pair still slips through when a value is pasted with quotes into
 * a hosting dashboard, so strip them here too.
 */
function clean(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^"|"$/g, "");
}

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const googleServiceAccountEmail = clean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  const rawPrivateKey = clean(process.env.GOOGLE_PRIVATE_KEY);
  const googleSheetId = clean(process.env.GOOGLE_SHEET_ID);

  const missing: string[] = [];
  if (!googleServiceAccountEmail) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!rawPrivateKey) missing.push("GOOGLE_PRIVATE_KEY");
  if (!googleSheetId) missing.push("GOOGLE_SHEET_ID");
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  // Hosting dashboards store the key with literal \n rather than real newlines.
  const googlePrivateKey = rawPrivateKey.replace(/\\n/g, "\n");

  const gidValue = clean(process.env.REGISTRATIONS_SHEET_GID);
  const registrationsSheetGid = gidValue ? Number(gidValue) : 300772715;
  if (!Number.isInteger(registrationsSheetGid)) {
    throw new Error("REGISTRATIONS_SHEET_GID must be a whole number.");
  }

  cached = {
    googleServiceAccountEmail,
    googlePrivateKey,
    googleSheetId,
    registrationsSheetGid,
    quizAttemptsSheetTitle: clean(process.env.QUIZ_ATTEMPTS_SHEET_TITLE) || "YGC Quiz Attempts",
    perfexApiToken: clean(process.env.PERFEX_API_TOKEN) || null,
    // Deriving from the service-account key means there is no extra secret to
    // configure before the festival, and the value stays stable across the
    // serverless instances that must verify each other's tokens.
    quizTokenSecret:
      clean(process.env.QUIZ_TOKEN_SECRET) ||
      crypto.createHash("sha256").update(`edus-ygc-2026:${googlePrivateKey}`).digest("hex"),
  };

  return cached;
}
