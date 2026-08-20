import { NextResponse } from "next/server";

import { leadSchema } from "@/lib/schemas";
import { apiError, issuesToMessages } from "@/server/api-response";
import { CAMPAIGN_CODE, LEAD_SOURCE, upsertRegistrationRow } from "@/server/sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Captures the lead before the challenge begins.
 *
 * Lead collection is the point of the whole funnel, so the student's name and
 * number are written to the sheet the moment they are given. If the student
 * then closes the tab mid-quiz, EDUS still has someone to call. Everything
 * after this point updates the same row, keyed by session id.
 *
 * Unlike the quiz and registration handlers, a failure here is reported to the
 * browser: there is nothing else in flight to salvage, and the student can
 * simply press the button again.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_FAILED", "Request body must be JSON.", 400);
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_FAILED",
      "Please check your name and WhatsApp number.",
      400,
      issuesToMessages(parsed.error.issues),
    );
  }

  const input = parsed.data;

  try {
    await upsertRegistrationRow(input.sessionId, {
      "Captured At": new Date().toISOString(),
      Status: "PROFILE_CAPTURED",
      Language: input.language,
      "Student Name": input.fullName,
      "Student Phone": input.phone,
      "Contact Owner": input.contactOwner,
      Consent: "Yes",
      Source: LEAD_SOURCE,
      Campaign: CAMPAIGN_CODE,
    });
  } catch (error) {
    console.error("[lead] sheet write failed", error);
    return apiError("STORAGE_ERROR", "We could not save your details. Please try again.", 502);
  }

  return NextResponse.json({ success: true });
}
