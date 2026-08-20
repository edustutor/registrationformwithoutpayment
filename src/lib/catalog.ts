// ---------------------------------------------------------------------------
// EDUS 60-Second Challenge - academic catalogue.
// Single source of truth for grades, mediums, A/L tracks, subjects and
// districts. Every screen and every API route reads from here, so adding a
// grade or a subject is a one-file change.
// ---------------------------------------------------------------------------

export type LanguageCode = "en" | "ta";

/** A piece of text that exists in both interface languages. */
export type Bilingual = { en: string; ta: string };

export type MediumId = "TAMIL" | "ENGLISH";

/** Grade the student picks on screen. "AL" then asks for a stream. */
export type GradeId =
  | "G3" | "G4" | "G5" | "G6" | "G7"
  | "G8" | "G9" | "G10" | "G11" | "AL";

/** A/L streams, matching the question bank partition keys exactly. */
export type AlTrackId =
  | "AL_PHYSICAL_SCIENCE"
  | "AL_BIOLOGICAL_SCIENCE"
  | "AL_COMMERCE"
  | "AL_TECHNOLOGY"
  | "AL_ARTS_HUMANITIES";

/**
 * The key the question bank is partitioned by. For grades 3-11 it is the
 * grade itself; for A/L it is the chosen stream. Questions are always drawn
 * from exactly one track, so a Grade 7 student can never see Grade 8 items.
 */
export type TrackId = Exclude<GradeId, "AL"> | AlTrackId;

export type Grade = {
  id: GradeId;
  label: Bilingual;
  /** Mediums EDUS actually teaches this grade in. */
  mediums: MediumId[];
  /** Subjects offered per medium, used by the registration screen. */
  subjects: Partial<Record<MediumId, string[]>>;
};

export const MEDIUMS: { id: MediumId; label: Bilingual }[] = [
  { id: "TAMIL", label: { en: "Tamil Medium", ta: "தமிழ் மொழிமூலம்" } },
  { id: "ENGLISH", label: { en: "English Medium", ta: "ஆங்கில மொழிமூலம்" } },
];

const PRIMARY_SUBJECTS = ["Maths", "Science", "Tamil", "IQ", "English"];
const SECONDARY_SUBJECTS = ["Maths", "Science", "Tamil", "English", "History", "ICT"];

export const GRADES: Grade[] = [
  {
    id: "G3",
    label: { en: "Grade 3", ta: "தரம் 3" },
    mediums: ["TAMIL"],
    subjects: { TAMIL: PRIMARY_SUBJECTS },
  },
  {
    id: "G4",
    label: { en: "Grade 4", ta: "தரம் 4" },
    mediums: ["TAMIL"],
    subjects: { TAMIL: PRIMARY_SUBJECTS },
  },
  {
    id: "G5",
    label: { en: "Grade 5", ta: "தரம் 5" },
    mediums: ["TAMIL"],
    subjects: { TAMIL: [...PRIMARY_SUBJECTS, "Spoken English"] },
  },
  {
    id: "G6",
    label: { en: "Grade 6", ta: "தரம் 6" },
    mediums: ["TAMIL", "ENGLISH"],
    subjects: { TAMIL: SECONDARY_SUBJECTS, ENGLISH: SECONDARY_SUBJECTS },
  },
  {
    id: "G7",
    label: { en: "Grade 7", ta: "தரம் 7" },
    mediums: ["TAMIL", "ENGLISH"],
    subjects: { TAMIL: SECONDARY_SUBJECTS, ENGLISH: SECONDARY_SUBJECTS },
  },
  {
    id: "G8",
    label: { en: "Grade 8", ta: "தரம் 8" },
    mediums: ["TAMIL", "ENGLISH"],
    subjects: { TAMIL: SECONDARY_SUBJECTS, ENGLISH: SECONDARY_SUBJECTS },
  },
  {
    id: "G9",
    label: { en: "Grade 9", ta: "தரம் 9" },
    mediums: ["TAMIL", "ENGLISH"],
    subjects: { TAMIL: SECONDARY_SUBJECTS, ENGLISH: SECONDARY_SUBJECTS },
  },
  {
    id: "G10",
    label: { en: "Grade 10", ta: "தரம் 10" },
    mediums: ["TAMIL", "ENGLISH"],
    subjects: { TAMIL: SECONDARY_SUBJECTS, ENGLISH: SECONDARY_SUBJECTS },
  },
  {
    id: "G11",
    label: { en: "Grade 11", ta: "தரம் 11" },
    mediums: ["TAMIL", "ENGLISH"],
    subjects: { TAMIL: SECONDARY_SUBJECTS, ENGLISH: SECONDARY_SUBJECTS },
  },
  {
    id: "AL",
    label: { en: "Grade A/L", ta: "உயர்தரம்" },
    mediums: ["TAMIL"],
    subjects: { TAMIL: ["Physics", "Combined Maths"] },
  },
];

export const AL_TRACKS: { id: AlTrackId; label: Bilingual }[] = [
  {
    id: "AL_PHYSICAL_SCIENCE",
    label: { en: "Physical Science / Maths", ta: "பௌதிக விஞ்ஞானம் / கணிதம்" },
  },
  {
    id: "AL_BIOLOGICAL_SCIENCE",
    label: { en: "Biological Science", ta: "உயிரியல் விஞ்ஞானம்" },
  },
  {
    id: "AL_COMMERCE",
    label: { en: "Commerce", ta: "வணிகம்" },
  },
  {
    id: "AL_TECHNOLOGY",
    label: { en: "Technology", ta: "தொழினுட்பம்" },
  },
  {
    id: "AL_ARTS_HUMANITIES",
    label: { en: "Arts / Humanities", ta: "கலை / மனிதவியல்" },
  },
];

/** Tamil names for the subjects shown on the registration screen. */
export const SUBJECT_LABELS: Record<string, Bilingual> = {
  Maths: { en: "Maths", ta: "கணிதம்" },
  Science: { en: "Science", ta: "விஞ்ஞானம்" },
  Tamil: { en: "Tamil", ta: "தமிழ்" },
  English: { en: "English", ta: "ஆங்கிலம்" },
  IQ: { en: "IQ", ta: "அறிவுத்திறன் (IQ)" },
  "Spoken English": { en: "Spoken English", ta: "பேச்சு ஆங்கிலம்" },
  History: { en: "History", ta: "வரலாறு" },
  ICT: { en: "ICT", ta: "தகவல் தொழினுட்பம் (ICT)" },
  Physics: { en: "Physics", ta: "பௌதிகவியல்" },
  "Combined Maths": { en: "Combined Maths", ta: "இணைந்த கணிதம்" },
};

export const CLASS_TYPES: { id: string; label: Bilingual; description: Bilingual }[] = [
  {
    id: "GROUP",
    label: { en: "Group Classes", ta: "குழு வகுப்புகள்" },
    description: { en: "Learn with peers", ta: "நண்பர்களுடன் கற்கலாம்" },
  },
  {
    id: "ONE_TO_ONE",
    label: { en: "1-to-1 Tutoring", ta: "தனிப்பட்ட வகுப்பு" },
    description: { en: "Personalised focus", ta: "தனிப்பட்ட கவனம்" },
  },
  {
    id: "NOT_SURE",
    label: { en: "Not sure yet", ta: "இன்னும் முடிவு செய்யவில்லை" },
    description: { en: "Help me choose", ta: "தெரிவு செய்ய உதவுங்கள்" },
  },
];

export const START_INTENTS: { id: string; label: Bilingual }[] = [
  { id: "START_NOW", label: { en: "Start now", ta: "இப்போதே தொடங்க" } },
  { id: "THIS_MONTH", label: { en: "This month", ta: "இந்த மாதம்" } },
  { id: "JUST_EXPLORING", label: { en: "Just exploring", ta: "பார்வையிடுகிறேன்" } },
];

export const CONTACT_OWNERS: { id: string; label: Bilingual }[] = [
  { id: "STUDENT", label: { en: "Student", ta: "மாணவர்" } },
  { id: "PARENT_GUARDIAN", label: { en: "Parent / Guardian", ta: "பெற்றோர் / பாதுகாவலர்" } },
];

/** All 25 Sri Lankan districts. Jaffna first because the festival is there. */
export const DISTRICTS: Bilingual[] = [
  { en: "Jaffna", ta: "யாழ்ப்பாணம்" },
  { en: "Kilinochchi", ta: "கிளிநொச்சி" },
  { en: "Mannar", ta: "மன்னார்" },
  { en: "Mullaitivu", ta: "முல்லைத்தீவு" },
  { en: "Vavuniya", ta: "வவுனியா" },
  { en: "Ampara", ta: "அம்பாறை" },
  { en: "Batticaloa", ta: "மட்டக்களப்பு" },
  { en: "Trincomalee", ta: "திருகோணமலை" },
  { en: "Anuradhapura", ta: "அநுராதபுரம்" },
  { en: "Polonnaruwa", ta: "பொலன்னறுவை" },
  { en: "Badulla", ta: "பதுளை" },
  { en: "Monaragala", ta: "மொணராகலை" },
  { en: "Colombo", ta: "கொழும்பு" },
  { en: "Gampaha", ta: "கம்பஹா" },
  { en: "Kalutara", ta: "களுத்துறை" },
  { en: "Kandy", ta: "கண்டி" },
  { en: "Matale", ta: "மாத்தளை" },
  { en: "Nuwara Eliya", ta: "நுவரெலியா" },
  { en: "Galle", ta: "காலி" },
  { en: "Matara", ta: "மாத்தறை" },
  { en: "Hambantota", ta: "அம்பாந்தோட்டை" },
  { en: "Kegalle", ta: "கேகாலை" },
  { en: "Ratnapura", ta: "இரத்தினபுரி" },
  { en: "Kurunegala", ta: "குருணாகல்" },
  { en: "Puttalam", ta: "புத்தளம்" },
];

export function findGrade(gradeId: string): Grade | undefined {
  return GRADES.find((grade) => grade.id === gradeId);
}

export function findAlTrack(trackId: string) {
  return AL_TRACKS.find((track) => track.id === trackId);
}

/**
 * Resolves the question-bank partition for a student. A/L students must have
 * chosen a stream first, which the API validates before calling this.
 */
export function resolveTrackId(gradeId: GradeId, alTrack?: AlTrackId | null): TrackId | null {
  if (gradeId !== "AL") return gradeId;
  return alTrack ?? null;
}

/** Subjects offered for the registration screen. */
export function subjectsFor(gradeId: string, medium: string): string[] {
  const grade = findGrade(gradeId);
  if (!grade) return [];
  return grade.subjects[medium as MediumId] ?? [];
}

export function subjectLabel(subject: string, language: LanguageCode): string {
  return SUBJECT_LABELS[subject]?.[language] ?? subject;
}

/** Human-readable grade name used in the sheet, the CRM and the share card. */
export function gradeLabel(gradeId: string, language: LanguageCode = "en"): string {
  return findGrade(gradeId)?.label[language] ?? gradeId;
}

export function trackLabel(trackId: string, language: LanguageCode = "en"): string {
  return findAlTrack(trackId)?.label[language] ?? "";
}
