import { NextResponse } from "next/server";

import { QUIZ_ATTEMPT_HEADERS, REGISTRATION_HEADERS, getQuizAttemptsSheet, getRegistrationsSheet } from "@/server/sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A check booth staff can run without opening the spreadsheet.
 *
 * Answers one question: can this app store a student right now? It confirms
 * the credentials load and that both tabs exist with the columns we write to.
 * It deliberately does not read any rows, so checking it repeatedly during the
 * event costs almost nothing against the Sheets quota.
 *
 * It reports no participant data, only whether storage is reachable.
 */
export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    const sheet = await getRegistrationsSheet();
    checks.registrationsTab = `ok (${sheet.title}, ${REGISTRATION_HEADERS.length} columns)`;
  } catch (error) {
    healthy = false;
    checks.registrationsTab = `FAILED: ${(error as Error).message}`;
  }

  try {
    const sheet = await getQuizAttemptsSheet();
    checks.quizAttemptsTab = `ok (${sheet.title}, ${QUIZ_ATTEMPT_HEADERS.length} columns)`;
  } catch (error) {
    healthy = false;
    checks.quizAttemptsTab = `FAILED: ${(error as Error).message}`;
  }

  checks.crm = process.env.PERFEX_API_TOKEN ? "token configured" : "token missing, lead push will be skipped";

  return NextResponse.json(
    { healthy, checkedAt: new Date().toISOString(), checks },
    { status: healthy ? 200 : 503 },
  );
}
