// ---------------------------------------------------------------------------
// Perfex CRM lead push.
//
// Fire and forget by design. A CRM outage during the festival must never stop
// a student completing their registration, so every failure here is logged and
// swallowed. The Google Sheet remains the record of truth.
// ---------------------------------------------------------------------------

import "server-only";

import { getServerEnv } from "./env";
import { CAMPAIGN_CODE, LEAD_SOURCE } from "./sheets";

const PERFEX_LEADS_URL = "https://crm.edustutor.com/api/leads";

/** Perfex numeric ids for the EDUS pipeline. Unchanged from the previous build. */
const ASSIGNED_STAFF_ID = "48";
const LEAD_STATUS_ID = "12";
const LEAD_SOURCE_ID = "16";

export type CrmLead = {
  fullName: string;
  phone: string;
  school: string;
  district: string;
  grade: string;
  alTrack: string;
  medium: string;
  language: string;
  subjects: string[];
  classType: string;
  startIntent: string;
  contactOwner: string;
  correctCount: number;
  totalQuestions: number;
  score: number;
  elapsedSeconds: number;
  rank: number;
};

function buildDescription(lead: CrmLead): string {
  const lines = [
    `Source: ${LEAD_SOURCE}`,
    `Campaign: ${CAMPAIGN_CODE}`,
    "",
    `Student Name: ${lead.fullName}`,
    `WhatsApp: ${lead.phone} (${lead.contactOwner})`,
    `School: ${lead.school || "Not provided"}`,
    `District: ${lead.district}`,
    `Grade: ${lead.grade}${lead.alTrack ? ` (${lead.alTrack})` : ""}`,
    `Medium: ${lead.medium}`,
    `App Language: ${lead.language}`,
    "",
    `Subjects of Interest: ${lead.subjects.join(", ")}`,
    `Class Type: ${lead.classType}`,
    `Start Intent: ${lead.startIntent}`,
    "",
    `Challenge Score: ${lead.correctCount}/${lead.totalQuestions}`,
    `Points: ${lead.score}`,
    `Time Taken: ${lead.elapsedSeconds}s`,
    `Grade Rank: ${lead.rank}`,
  ];
  return lines.join("\n");
}

export async function pushLeadToCrm(lead: CrmLead): Promise<boolean> {
  const { perfexApiToken } = getServerEnv();
  if (!perfexApiToken) {
    console.warn("[crm] PERFEX_API_TOKEN is not set, skipping lead push");
    return false;
  }

  const body = new URLSearchParams({
    name: lead.fullName,
    phonenumber: lead.phone,
    assigned: ASSIGNED_STAFF_ID,
    status: LEAD_STATUS_ID,
    source: LEAD_SOURCE_ID,
    description: buildDescription(lead),
  });

  try {
    const response = await fetch(PERFEX_LEADS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        authtoken: perfexApiToken,
      },
      body: body.toString(),
      // A slow CRM must not hold the student on the submit button.
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      console.error("[crm] lead push failed", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[crm] lead push threw", error);
    return false;
  }
}
