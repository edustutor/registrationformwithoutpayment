// ---------------------------------------------------------------------------
// Google Sheets storage.
//
// The target spreadsheet is live EDUS production data (Leads, Payment,
// FeesCollection). This module touches exactly two tabs and never any other:
//   - the registrations tab, addressed by GID, one row per participant
//   - the quiz attempts tab, addressed by title, one row per question answered
//
// Nothing here clears or rewrites an existing populated tab. If the headers do
// not match, it fails loudly and tells the operator to run `npm run setup:sheets`
// rather than guessing and destroying data mid-festival.
// ---------------------------------------------------------------------------

import "server-only";

import { GoogleSpreadsheet, type GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

import { compareForRank, type RankableAttempt } from "@/lib/scoring";
import { getServerEnv } from "./env";

export const REGISTRATION_HEADERS = [
  "Session Id",
  "Attempt Id",
  "Captured At",
  "Started At",
  "Submitted At",
  "Registered At",
  "Status",
  "Language",
  "Grade",
  "A/L Track",
  "Medium",
  "Correct Count",
  "Hard Correct",
  "Total Questions",
  "Score",
  "Time Taken (s)",
  "Tier",
  "Badges",
  "Grade Rank",
  "Student Name",
  "Student Phone",
  "Contact Owner",
  "Consent",
  "School",
  "District",
  "Subjects",
  "Class Type",
  "Start Intent",
  "Source",
  "Campaign",
] as const;

export const QUIZ_ATTEMPT_HEADERS = [
  "Submitted At",
  "Session Id",
  "Attempt Id",
  "Grade",
  "A/L Track",
  "Medium",
  "Language",
  "Question No",
  "Question Id",
  "Subject",
  "Topic",
  "Difficulty",
  "Question (EN)",
  "Selected Option",
  "Selected Answer (EN)",
  "Correct Option",
  "Is Correct",
  "Response Time (ms)",
  "Points",
] as const;

export const LEAD_SOURCE = "YGCIF_2026_EDUS_60S_CHALLENGE";
export const CAMPAIGN_CODE = "YGCIF26";

export class SheetSetupError extends Error {}

let docPromise: Promise<GoogleSpreadsheet> | null = null;

function loadDoc(): Promise<GoogleSpreadsheet> {
  if (docPromise) return docPromise;

  docPromise = (async () => {
    const env = getServerEnv();
    const auth = new JWT({
      email: env.googleServiceAccountEmail,
      key: env.googlePrivateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const doc = new GoogleSpreadsheet(env.googleSheetId, auth);
    await doc.loadInfo();
    return doc;
  })();

  // A failed connection must not be cached, or every later request in this
  // instance would reuse the rejection.
  docPromise.catch(() => {
    docPromise = null;
  });

  return docPromise;
}

/**
 * Confirms a tab is ready to write to. Adds headers to a genuinely empty tab,
 * accepts a tab that already carries every header we need (extra columns are
 * fine), and refuses anything else.
 *
 * A long-lived server instance caches the spreadsheet's grid metadata, so a
 * tab widened after that instance connected still looks narrow to it. Rather
 * than fail a real submission over stale metadata, a mismatch triggers one
 * refresh and a re-check before giving up.
 */
async function ensureHeaders(
  sheet: GoogleSpreadsheetWorksheet,
  headers: readonly string[],
): Promise<void> {
  async function currentHeaders(): Promise<string[]> {
    try {
      await sheet.loadHeaderRow();
      return sheet.headerValues.filter(Boolean);
    } catch {
      return [];
    }
  }

  let existing = await currentHeaders();

  if (existing.length === 0) {
    await sheet.setHeaderRow([...headers]);
    return;
  }

  let missing = headers.filter((header) => !existing.includes(header));
  if (missing.length === 0) return;

  const doc = await loadDoc();
  await doc.loadInfo();
  existing = await currentHeaders();
  missing = headers.filter((header) => !existing.includes(header));
  if (missing.length === 0) return;

  throw new SheetSetupError(
    `Sheet "${sheet.title}" is missing columns: ${missing.join(", ")}. ` +
      `Run "npm run setup:sheets" once to prepare the tabs.`,
  );
}

/**
 * A long-lived serverless instance caches the spreadsheet's tab list. If a tab
 * is deleted, renamed or recreated in the Sheets UI after this instance
 * connected, the cached handle points at a tab that no longer exists and every
 * write through it fails. That happened in production on 2026-08-20 when the
 * quiz attempts tab was removed by hand.
 *
 * So every accessor gets one retry: refresh the spreadsheet metadata and look
 * again before giving up.
 */
async function withRefreshRetry<T>(
  resolve: (doc: GoogleSpreadsheet, isRetry: boolean) => Promise<T>,
): Promise<T> {
  try {
    return await resolve(await loadDoc(), false);
  } catch (firstError) {
    console.warn("[sheets] retrying after refreshing spreadsheet metadata", firstError);
    const doc = await loadDoc();
    await doc.loadInfo();
    return resolve(doc, true);
  }
}

export async function getRegistrationsSheet(): Promise<GoogleSpreadsheetWorksheet> {
  const env = getServerEnv();

  return withRefreshRetry(async (doc) => {
    const sheet = doc.sheetsById[env.registrationsSheetGid];
    if (!sheet) {
      throw new SheetSetupError(
        `No tab with GID ${env.registrationsSheetGid} in the spreadsheet. Check REGISTRATIONS_SHEET_GID.`,
      );
    }

    await ensureHeaders(sheet, REGISTRATION_HEADERS);
    return sheet;
  });
}

export async function getQuizAttemptsSheet(): Promise<GoogleSpreadsheetWorksheet> {
  const env = getServerEnv();
  const title = env.quizAttemptsSheetTitle;

  return withRefreshRetry(async (doc) => {
    const existing = doc.sheetsByTitle[title];
    if (existing) {
      await ensureHeaders(existing, QUIZ_ATTEMPT_HEADERS);
      return existing;
    }

    // Creating a tab is additive, so it is safe to do automatically. This is
    // what puts the tab back if someone deletes it mid-event.
    return doc.addSheet({
      title,
      headerValues: [...QUIZ_ATTEMPT_HEADERS],
      gridProperties: { rowCount: 10000, columnCount: QUIZ_ATTEMPT_HEADERS.length },
    });
  });
}

export type RegistrationRow = Partial<Record<(typeof REGISTRATION_HEADERS)[number], string | number>>;
export type QuizAttemptRow = Partial<Record<(typeof QUIZ_ATTEMPT_HEADERS)[number], string | number>>;

/**
 * Writes the participant row. Creates it on first write and updates it in
 * place afterwards, so one student is always exactly one row whether they
 * finish the quiz, the registration, or both. Returns the row's values after
 * the save, so a caller can read fields written by an earlier step.
 */
export async function upsertRegistrationRow(
  sessionId: string,
  values: RegistrationRow,
): Promise<Record<string, string>> {
  const sheet = await getRegistrationsSheet();
  const rows = await sheet.getRows();
  const existing = rows.find((row) => row.get("Session Id") === sessionId);

  if (existing) {
    existing.assign(values);
    await existing.save();
    return existing.toObject() as Record<string, string>;
  }

  const created = await sheet.addRow({ "Session Id": sessionId, ...values });
  return created.toObject() as Record<string, string>;
}

export async function appendQuizAttemptRows(rows: QuizAttemptRow[]): Promise<void> {
  if (rows.length === 0) return;
  const sheet = await getQuizAttemptsSheet();
  await sheet.addRows(rows as Record<string, string | number>[]);
}

export type RankResult = { rank: number; rankOutOf: number };

/**
 * Ranks an attempt inside its own grade or A/L track, before that attempt has
 * been written. Counting how many stored attempts beat this one is exact and
 * saves a second write, which matters when a whole festival queue submits at
 * once and the Sheets write quota is the limit.
 *
 * Grades are never ranked against each other, because a Grade 3 paper is not a
 * Grade 11 paper. Tamil and English medium share a partition, since both sit
 * identical underlying questions.
 */
export async function rankAgainstPeers(
  grade: string,
  alTrack: string,
  sessionId: string,
  attempt: RankableAttempt,
): Promise<RankResult> {
  const sheet = await getRegistrationsSheet();
  const rows = await sheet.getRows();

  let ahead = 0;
  let total = 1; // this attempt

  for (const row of rows) {
    if (row.get("Grade") !== grade) continue;
    if ((row.get("A/L Track") ?? "") !== alTrack) continue;
    // A retake in the same session replaces its own earlier row, so that row
    // must not be counted as a competitor.
    if (row.get("Session Id") === sessionId) continue;

    const correctCount = Number(row.get("Correct Count"));
    if (!Number.isFinite(correctCount) || row.get("Correct Count") === "") continue;

    const peer: RankableAttempt = {
      correctCount,
      normalisedScore: Number(row.get("Score")) || 0,
      hardCorrect: Number(row.get("Hard Correct")) || 0,
      elapsedMs: Math.round((Number(row.get("Time Taken (s)")) || 0) * 1000),
      submittedAt: Date.parse(row.get("Submitted At") ?? "") || 0,
    };

    total++;
    if (compareForRank(peer, attempt) < 0) ahead++;
  }

  return { rank: ahead + 1, rankOutOf: total };
}
