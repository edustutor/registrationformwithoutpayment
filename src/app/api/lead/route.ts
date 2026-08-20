import { NextResponse } from "next/server";

import { leadSchema } from "@/lib/schemas";
import { apiError, issuesToMessages } from "@/server/api-response";
import { CAMPAIGN_CODE, LEAD_SOURCE, createRegistrationRow } from "@/server/sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Captures the lead before the challenge begins.
 *
 * Lead collection is the point of the whole funnel, so the student's name and
 * number are written the moment they are given. This is always the first write
 * for a session, so it creates the row directly rather than reading the sheet
 * to look for one, which saves an API call per student.
 *
 * If the write fails even after retries, the student is NOT blocked. They are
 * let through and the browser re-sends the same details when the quiz starts,
 * which recreates the row. Blocking a student at the first screen because
 * Google is rate limiting would cost the very lead this screen exists to
 * capture. `stored` tells the browser which happened.
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
    await createRegistrationRow(input.sessionId, {
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
    return NextResponse.json({ success: true, stored: true });
  } catch (error) {
    console.error("[lead] sheet write failed, letting the student continue", error);
    return NextResponse.json({ success: true, stored: false });
  }
}
