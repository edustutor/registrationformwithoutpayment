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
import { withRetry } from "./retry";

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
    await withRetry("loadInfo", () => doc.loadInfo());
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
 * Tabs whose headers have already been verified by this instance.
 *
 * ensureHeaders used to run loadHeaderRow on every single sheet operation,
 * which is a read against the Google quota. That made a full student journey
 * cost 8 reads, so 8 students at once blew past the 60 reads per minute limit
 * and the last step of the funnel started failing.
 *
 * Headers do not change during an event, so verifying once per instance is
 * enough. Any later failure clears this, and withRefreshRetry re-verifies.
 */
const verifiedSheets = new Set<number>();

/**
 * Confirms a tab is ready to write to. Adds headers to a genuinely empty tab,
 * accepts a tab that already carries every header we need (extra columns are
 * fine), and refuses anything else.
 */
async function ensureHeaders(
  sheet: GoogleSpreadsheetWorksheet,
  headers: readonly string[],
): Promise<void> {
  if (verifiedSheets.has(sheet.sheetId)) return;

  let existing: string[] = [];
  try {
    await withRetry("loadHeaderRow", () => sheet.loadHeaderRow());
    existing = sheet.headerValues.filter(Boolean);
  } catch {
    existing = [];
  }

  if (existing.length === 0) {
    await withRetry("setHeaderRow", () => sheet.setHeaderRow([...headers]));
    verifiedSheets.add(sheet.sheetId);
    return;
  }

  const missing = headers.filter((header) => !existing.includes(header));
  if (missing.length === 0) {
    verifiedSheets.add(sheet.sheetId);
    return;
  }

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
 * again before giving up. This is separate from withRetry, which handles rate
 * limits; this one handles a tab that moved underneath us.
 */
async function withRefreshRetry<T>(
  resolve: (doc: GoogleSpreadsheet) => Promise<T>,
): Promise<T> {
  try {
    return await resolve(await loadDoc());
  } catch (firstError) {
    console.warn("[sheets] retrying after refreshing spreadsheet metadata", firstError);
    // The tab may have been deleted, renamed or emptied, so anything we
    // previously verified about it can no longer be trusted.
    verifiedSheets.clear();
    const doc = await loadDoc();
    await withRetry("loadInfo(refresh)", () => doc.loadInfo());
    return resolve(doc);
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
    return withRetry("addSheet", () =>
      doc.addSheet({
        title,
        headerValues: [...QUIZ_ATTEMPT_HEADERS],
        gridProperties: { rowCount: 10000, columnCount: QUIZ_ATTEMPT_HEADERS.length },
      }),
    );
  });
}

/**
 * google-spreadsheet appends with insertDataOption OVERWRITE by default, which
 * writes into the cells after the last row it finds. Two tablets appending at
 * the same moment can both resolve the same position, and one silently
 * overwrites the other. A burst of 8 concurrent students on 2026-08-20 lost 15
 * of 40 answer rows that way, with every request still reporting success.
 *
 * INSERT_ROWS makes the API insert new rows instead, so concurrent appends
 * cannot land on top of each other. Every append in this file uses it.
 */
const APPEND_INSERT = { insert: true } as const;

export type RegistrationRow = Partial<Record<(typeof REGISTRATION_HEADERS)[number], string | number>>;
export type QuizAttemptRow = Partial<Record<(typeof QUIZ_ATTEMPT_HEADERS)[number], string | number>>;

/**
 * Creates the participant row without reading the sheet first.
 *
 * The lead screen is always the first write for a session, so there is nothing
 * to look up. Skipping the read saves one API call per student, which is real
 * headroom when the quota is 60 reads per minute and a queue is forming.
 */
export async function createRegistrationRow(
  sessionId: string,
  values: RegistrationRow,
): Promise<void> {
  const sheet = await getRegistrationsSheet();
  await withRetry("addRow(registration)", async () => {
    await sheet.addRow({ "Session Id": sessionId, ...values }, APPEND_INSERT);
  });
}

/**
 * Updates the participant row, creating it if the earlier write never landed.
 * Later steps re-send what they know, so one failed write is repaired by the
 * next step rather than lost.
 */
export async function upsertRegistrationRow(
  sessionId: string,
  values: RegistrationRow,
): Promise<Record<string, string>> {
  const sheet = await getRegistrationsSheet();
  const rows = await withRetry("getRows(registration)", () => sheet.getRows());
  const existing = rows.find((row) => row.get("Session Id") === sessionId);

  if (existing) {
    existing.assign(values);
    await withRetry("saveRow(registration)", () => existing.save());
    return existing.toObject() as Record<string, string>;
  }

  const created = await withRetry("addRow(registration)", () =>
    sheet.addRow({ "Session Id": sessionId, ...values }, APPEND_INSERT),
  );
  return created.toObject() as Record<string, string>;
}

export async function appendQuizAttemptRows(rows: QuizAttemptRow[]): Promise<void> {
  if (rows.length === 0) return;
  const sheet = await getQuizAttemptsSheet();
  await withRetry("addRows(attempts)", async () => {
    await sheet.addRows(rows as Record<string, string | number>[], APPEND_INSERT);
  });
}

export type RankResult = { rank: number; rankOutOf: number };

/**
 * Ranks an attempt and saves it in a single pass over the sheet.
 *
 * Ranking and updating both need every row in the grade, so doing them
 * together costs one read instead of two. At a busy booth that halves the read
 * pressure of a submission.
 *
 * Grades are never ranked against each other, because a Grade 3 paper is not a
 * Grade 11 paper. Tamil and English medium share a partition, since both sit
 * identical underlying questions.
 */
export async function rankAndSaveResult(
  sessionId: string,
  grade: string,
  alTrack: string,
  attempt: RankableAttempt,
  buildValues: (rank: number) => RegistrationRow,
): Promise<RankResult> {
  const sheet = await getRegistrationsSheet();
  const rows = await withRetry("getRows(rank)", () => sheet.getRows());

  let ahead = 0;
  let total = 1; // this attempt
  let own: (typeof rows)[number] | undefined;

  for (const row of rows) {
    if (row.get("Session Id") === sessionId) {
      own = row;
      // A retake in the same session replaces its own earlier row, so that row
      // must not be counted as a competitor.
      continue;
    }

    if (row.get("Grade") !== grade) continue;
    if ((row.get("A/L Track") ?? "") !== alTrack) continue;

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

  const rank = ahead + 1;
  const values = buildValues(rank);

  if (own) {
    own.assign(values);
    await withRetry("saveRow(result)", () => own.save());
  } else {
    await withRetry("addRow(result)", async () => {
      await sheet.addRow({ "Session Id": sessionId, ...values }, APPEND_INSERT);
    });
  }

  return { rank, rankOutOf: total };
}
