// ---------------------------------------------------------------------------
// Request validation. Every route handler validates its body here, once, at
// the edge. Nothing downstream re-checks shape, type or presence.
// ---------------------------------------------------------------------------

import * as z from "zod";

import { AL_TRACKS, DISTRICTS, GRADES, CLASS_TYPES, CONTACT_OWNERS, START_INTENTS } from "./catalog";
import { QUESTION_COUNT, TIMER_SECONDS, SUBMIT_GRACE_MS } from "./scoring";

const gradeIds = GRADES.map((grade) => grade.id) as [string, ...string[]];
const alTrackIds = AL_TRACKS.map((track) => track.id) as [string, ...string[]];
const districtNames = DISTRICTS.map((district) => district.en) as [string, ...string[]];
const classTypeIds = CLASS_TYPES.map((type) => type.id) as [string, ...string[]];
const startIntentIds = START_INTENTS.map((intent) => intent.id) as [string, ...string[]];
const contactOwnerIds = CONTACT_OWNERS.map((owner) => owner.id) as [string, ...string[]];

/**
 * Turns anything a Sri Lankan student might type into E.164 digits (94XXXXXXXXX).
 * Accepts 0771234567, 771234567, +94 77 123 4567 and 0094771234567.
 * Returns null when the result is not a valid Sri Lankan mobile number.
 */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  let local = digits;
  if (local.startsWith("0094")) local = local.slice(4);
  else if (local.startsWith("94")) local = local.slice(2);
  else if (local.startsWith("0")) local = local.slice(1);

  // Sri Lankan mobile numbers are nine digits and always start with 7.
  if (!/^7\d{8}$/.test(local)) return null;
  return `94${local}`;
}

const sessionId = z.string().uuid();

/** Accepts what a student types and stores E.164 digits. Used by both the
 *  early lead capture and the final registration, so the two can never
 *  disagree about what a valid number is. */
const phoneField = z.string().trim().transform((value, ctx) => {
  const normalised = normalisePhone(value);
  if (!normalised) {
    ctx.addIssue({ code: "custom", message: "Enter a valid Sri Lankan mobile number." });
    return z.NEVER;
  }
  return normalised;
});

/**
 * Captured on the first screen and written to the sheet straight away, so a
 * student who closes the tab mid-quiz is still a usable lead.
 *
 * Consent must be true. We do not store a contact number, often a minor's,
 * before the student has agreed to be contacted.
 */
export const leadSchema = z.object({
  sessionId,
  language: z.enum(["en", "ta"]),
  fullName: z.string().trim().min(2).max(100),
  phone: phoneField,
  contactOwner: z.enum(contactOwnerIds),
  // Optional: plenty of festival visitors will not want to give a school.
  school: z.string().trim().max(150).default(""),
  consent: z.literal(true),
});


export const quizStartSchema = z
  .object({
    sessionId,
    language: z.enum(["en", "ta"]),
    grade: z.enum(gradeIds),
    medium: z.enum(["TAMIL", "ENGLISH"]),
    alTrack: z.enum(alTrackIds).nullish(),
    // The browser re-sends the profile it already captured. If the lead write
    // failed, this repairs it; if it succeeded, it is written again harmlessly.
    // Never trust it without consent, same rule as the lead screen.
    profile: z
      .object({
        fullName: z.string().trim().min(2).max(100),
        phone: phoneField,
        contactOwner: z.enum(contactOwnerIds),
        school: z.string().trim().max(150).default(""),
        consent: z.literal(true),
      })
      .optional(),
  })
  .refine((value) => value.grade !== "AL" || Boolean(value.alTrack), {
    message: "A/L students must choose a stream before starting.",
    path: ["alTrack"],
  })
  .refine(
    (value) => {
      const grade = GRADES.find((item) => item.id === value.grade);
      return Boolean(grade?.mediums.includes(value.medium as "TAMIL" | "ENGLISH"));
    },
    { message: "That medium is not offered for this grade.", path: ["medium"] },
  );

/**
 * The timer is 60 seconds, so no single answer can legitimately take longer
 * than the whole challenge plus the submit grace window.
 */
const maxResponseMs = TIMER_SECONDS * 1000 + SUBMIT_GRACE_MS;

export const quizSubmitSchema = z.object({
  token: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedOptionId: z.string().min(1).max(4).nullable(),
        responseMs: z.number().int().min(0).max(maxResponseMs),
      }),
    )
    .length(QUESTION_COUNT),
});

/**
 * Only what the last screen actually asks. Name, phone, contact owner and
 * school were captured on the first screen and are read back from the stored
 * row, so a student is never asked for the same thing twice.
 */
export const registrationSchema = z.object({
  sessionId,
  attemptId: z.string().uuid(),
  language: z.enum(["en", "ta"]),
  district: z.enum(districtNames),
  subjects: z.array(z.string().trim().min(1)).min(1).max(12),
  classType: z.enum(classTypeIds),
  startIntent: z.enum(startIntentIds),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type QuizStartInput = z.infer<typeof quizStartSchema>;
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
