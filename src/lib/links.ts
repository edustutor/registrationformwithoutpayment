// EDUS destinations shown on the final screen, from the campaign config.

import type { Bilingual } from "./catalog";

/** Shown on the share card and in the share caption, so a shared result
 *  promotes EDUS on its own. Keep these in step with EDUS_LINKS below. */
export const EDUS_WEBSITE = "www.edus.lk";
export const EDUS_HOTLINE = "+94 70 707 2072";
export const SHARE_HASHTAGS = "#edus #edus_classes #YGCIF26";

export type EdusLink = { id: string; label: Bilingual; url: string; primary?: boolean };

export const EDUS_LINKS: EdusLink[] = [
  {
    id: "WHATSAPP",
    label: { en: "WhatsApp EDUS", ta: "EDUS WhatsApp" },
    url: "https://wa.me/94707072072",
    primary: true,
  },
  {
    id: "HOTLINE",
    label: { en: "Hotline +94 70 707 2072", ta: "Hotline +94 70 707 2072" },
    url: "tel:+94707072072",
    primary: true,
  },
  {
    id: "QUICK_REGISTRATION",
    label: { en: "Quick Registration", ta: "விரைவு பதிவு" },
    url: "https://signup.edustutor.com/",
  },
  {
    id: "TIMETABLE",
    label: { en: "Class Timetable", ta: "வகுப்பு நேர அட்டவணை" },
    url: "https://www.edus.lk/sl/timetable",
  },
  {
    id: "WEBSITE",
    label: { en: "EDUS Website", ta: "EDUS இணையதளம்" },
    url: "https://www.edus.lk/",
  },
  {
    id: "LMS_WEB",
    label: { en: "EDUS Learning App", ta: "EDUS Learning App" },
    url: "https://lms.edustutor.com/",
  },
  {
    id: "ANDROID",
    label: { en: "Get it on Google Play", ta: "Google Play இல் பெறுக" },
    url: "https://play.google.com/store/apps/details?id=com.edus.edustutor",
  },
  {
    id: "IOS",
    label: { en: "Download on the App Store", ta: "App Store இல் பெறுக" },
    url: "https://apps.apple.com/lk/app/edus-tutor/id6742735384",
  },
  {
    id: "PRIVACY",
    label: { en: "Privacy Policy", ta: "தனியுரிமைக் கொள்கை" },
    url: "https://www.edus.lk/privacy",
  },
];
