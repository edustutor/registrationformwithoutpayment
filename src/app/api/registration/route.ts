import { NextResponse } from "next/server";

import { registrationSchema } from "@/lib/schemas";
import type { RegistrationResponse } from "@/lib/types";
import { apiError, issuesToMessages } from "@/server/api-response";
import { pushLeadToCrm } from "@/server/crm";
import { CAMPAIGN_CODE, LEAD_SOURCE, upsertRegistrationRow } from "@/server/sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Completes a registration after the challenge.
 *
 * The quiz result was already written against this session id, so this handler
 * only adds the contact and interest details and reads the stored score back
 * for the CRM. It never trusts a score sent by the browser.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_FAILED", "Request body must be JSON.", 400);
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_FAILED",
      "Please check the details you entered.",
      400,
      issuesToMessages(parsed.error.issues),
    );
  }

  const input = parsed.data;

  let stored: Record<string, string>;
  try {
    // Name, phone, contact owner and school were captured on the first screen
    // and are already on this row, so they are not rewritten here.
    stored = await upsertRegistrationRow(input.sessionId, {
      "Attempt Id": input.attemptId,
      "Registered At": new Date().toISOString(),
      Status: "REGISTERED",
      Language: input.language,
      District: input.district,
      Subjects: input.subjects.join(", "),
      "Class Type": input.classType,
      "Start Intent": input.startIntent,
      Source: LEAD_SOURCE,
      Campaign: CAMPAIGN_CODE,
    });
  } catch (error) {
    console.error("[registration] sheet write failed", error);
    return apiError("STORAGE_ERROR", "We could not save your registration. Please try again.", 502);
  }

  // Awaited so the push finishes before the serverless function freezes.
  // pushLeadToCrm never throws, so a CRM outage cannot fail a registration
  // that is already safely stored in the sheet.
  // The CRM payload reads the contact details back from the stored row rather
  // than trusting anything the browser sent on this request.
  await pushLeadToCrm({
    fullName: stored["Student Name"] ?? "",
    phone: stored["Student Phone"] ?? "",
    school: stored["School"] ?? "",
    district: input.district,
    grade: stored["Grade"] ?? "",
    alTrack: stored["A/L Track"] ?? "",
    medium: stored["Medium"] ?? "",
    language: input.language,
    subjects: input.subjects,
    classType: input.classType,
    startIntent: input.startIntent,
    contactOwner: stored["Contact Owner"] ?? "",
    correctCount: Number(stored["Correct Count"]) || 0,
    totalQuestions: Number(stored["Total Questions"]) || 0,
    score: Number(stored["Score"]) || 0,
    elapsedSeconds: Number(stored["Time Taken (s)"]) || 0,
    rank: Number(stored["Grade Rank"]) || 0,
  });

  return NextResponse.json<RegistrationResponse>({ success: true });
}
