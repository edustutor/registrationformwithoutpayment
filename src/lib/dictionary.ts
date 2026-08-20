// ---------------------------------------------------------------------------
// EDUS 60-Second Challenge - interface copy in English and Tamil.
// The language the student picks on screen 2 drives BOTH this copy and the
// language the questions are shown in. Every user-facing string lives here so
// no screen can ship half-translated.
// ---------------------------------------------------------------------------

import type { LanguageCode } from "./catalog";

export type Dictionary = typeof en;

const en = {
  common: {
    back: "Back",
    next: "Next",
    continue: "Continue",
    loading: "Loading...",
    select: "Select",
    required: "Required",
    of: "of",
    seconds: "seconds",
  },

  welcome: {
    badge: "Fast-Paced Learning",
    title: "Can You Beat the EDUS 60-Second Challenge?",
    subtitle: "5 questions. 60 seconds. One place on the leaderboard.",
    cta: "Start Challenge",
    event: "YGC Innovation Festival 2026",
  },

  language: {
    title: "Choose your language",
    subtitle: "காட்சிமொழியைத் தெரிவுசெய்யுங்கள்",
    note: "This sets both the app language and the language your questions appear in.",
  },

  profile: {
    title: "First, who is taking the challenge?",
    subtitle: "We save your result to this number so you never lose it.",
    cta: "Continue",
    saving: "Saving...",
    reassurance:
      "We only use this to send your result and to talk to you about EDUS classes. We never show your number on the leaderboard.",
  },

  setup: {
    title: "Set up your challenge",
    subtitle: "Pick your grade so we can give you the right questions.",
    gradeLabel: "Your grade",
    mediumLabel: "Your medium",
    mediumSingleNote: "This grade is offered in Tamil Medium at EDUS.",
    trackLabel: "Your A/L stream",
    trackHint: "Your stream decides which subjects you are asked about.",
    cta: "Continue",
    pickGradeFirst: "Please choose your grade first.",
  },

  ready: {
    title: "Ready?",
    timerBadge: "60 Seconds",
    message: "Your 60 seconds start when you tap GO.",
    rulesTitle: "How it works",
    rules: [
      "5 questions, one at a time.",
      "One 60-second timer for the whole challenge.",
      "Answering faster earns you more points.",
      "You cannot go back to a previous question.",
    ],
    consent:
      "I agree that EDUS may use these details to run the challenge, show a privacy-safe leaderboard name, and contact me or my parent or guardian about suitable EDUS classes and this event enquiry.",
    consentRequired: "Please tick the box above to start.",
    cta: "GO!",
    starting: "Starting...",
  },

  quiz: {
    progress: "Question {n} of {total}",
    secLabel: "SEC",
    encouragement: "You got this. Stay focused.",
    warning20: "20 seconds. Stay sharp!",
    warning10: "Final 10!",
    next: "Next Question",
    submit: "Submit Challenge",
    pickAnswer: "Choose an answer to continue.",
    submitting: "Locked in! Calculating your rank...",
  },

  result: {
    yourScore: "Your score",
    correctLabel: "Correct answers",
    points: "Points",
    timeTaken: "Time taken",
    gradeRank: "Grade rank",
    rankOf: "You are #{rank} of {total} in your grade so far.",
    badgesTitle: "Badges earned",
    answersHiddenTitle: "Answers stay hidden",
    answersHidden:
      "We do not show the correct answers during the festival so nobody can pass them around. EDUS will publish them after the leaderboard closes.",
    download: "Download your result",
    downloading: "Preparing...",
    downloadFailed: "Could not create the image. Please screenshot this screen instead.",
    share: "Share your result",
    captionCopied: "Caption copied. Paste it with the image when you share.",
    savedAndCopied: "Image saved and caption copied. Paste the caption when you post.",
    // {badge} is the tier emoji, so a perfect score leads with a trophy and a
    // tough round leads with a flexed arm. Laid out as short lines because
    // WhatsApp and Facebook truncate long paragraphs in the preview.
    shareCaption:
      "{badge} {name}{school} took on the EDUS 60-Second Challenge at YGC Innovation Festival 2026!\n\n⚡ Score: {correct}/{total}\n🎯 Points: {score}\n⏱️ Time: {seconds}s\n🎓 {grade}\n\n🔥 Think you can beat that?\n\n📚 Learn with EDUS: {website}\n📞 Hotline: {hotline}\n\n{hashtags}",
    shareTitle: "EDUS 60-Second Challenge",
    // Injected as {school} only when a school was given.
    shareCaptionSchool: " from {school}",
    continueCta: "Continue to Registration",
    tiers: {
      CHAMPION: "EDUS Champion!",
      EXCELLENT: "Excellent!",
      GREAT_START: "Great Start!",
      CHALLENGE_ACCEPTED: "Challenge Accepted!",
    },
    messages: {
      CHAMPION: "Amazing! You hit a perfect score. Can anyone in your grade beat your time?",
      EXCELLENT: "Excellent! You were one answer away from a perfect score.",
      GREAT_START: "Great start! You have strong potential. Let's build on it.",
      CHALLENGE_ACCEPTED:
        "Challenge accepted! Every strong learner starts somewhere. Your next step can start with EDUS.",
    },
    badges: {
      LIGHTNING_START: "Lightning Start",
      THREE_STREAK: "3-in-a-Row",
      PERFECT_5: "Perfect 5",
      FAST_FINISH: "Fast Finisher",
    },
  },

  registration: {
    title: "What would you like to improve next?",
    subtitle: "Tell us where to send your result and we will help you pick the right class.",
    sectionInterest: "Your learning plan",
    nameLabel: "Student full name",
    namePlaceholder: "e.g. A. Nimal",
    phoneLabel: "WhatsApp number",
    phonePlaceholder: "77 123 4567",
    phoneHint: "We send your result and class details to this number.",
    contactOwnerLabel: "Whose number is this?",
    schoolLabel: "School",
    schoolPlaceholder: "Your school name",
    districtLabel: "District",
    subjectsLabel: "Which subjects do you want help with?",
    subjectsHint: "Select all that apply.",
    classTypeLabel: "Preferred class type",
    startLabel: "When would you like to start?",
    yourChallenge: "Your challenge",
    submit: "Complete Registration",
    submitting: "Submitting...",
    errors: {
      name: "Please enter the student's full name.",
      phone: "Enter a valid Sri Lankan mobile number, for example 0771234567.",
      contactOwner: "Please tell us whose number this is.",
      subjects: "Please choose at least one subject.",
      classType: "Please choose a class type.",
      startIntent: "Please choose when you want to start.",
    },
  },

  success: {
    title: "You are registered!",
    subtitle:
      "Thanks for taking the EDUS 60-Second Challenge. An EDUS Student Consultant will contact you soon about the right class for you.",
    boothNote: "Show this screen to the EDUS team to unlock your next learning step.",
    recap: "You scored {correct}/{total} in {seconds} seconds.",
    linksTitle: "Continue your EDUS journey",
    downloadAgain: "Download your result",
  },

  errors: {
    network: "We could not reach EDUS. Check your connection and try again.",
    generic: "Something went wrong. Please try again.",
    quizExpired: "This challenge session has expired. Please start again.",
    retry: "Try again",
    startOver: "Start over",
  },

  disclaimer:
    "This is a short festival learning challenge aligned broadly to Sri Lankan school-level concepts. It is not an official examination or a placement test.",
};

const ta: Dictionary = {
  common: {
    back: "பின்செல்",
    next: "அடுத்து",
    continue: "தொடர்க",
    loading: "ஏற்றுகிறது...",
    select: "தெரிவுசெய்க",
    required: "கட்டாயம்",
    of: "இல்",
    seconds: "விநாடிகள்",
  },

  welcome: {
    badge: "வேகமான கற்றல்",
    title: "EDUS 60-விநாடி சவாலை வெல்ல முடியுமா?",
    subtitle: "5 கேள்விகள். 60 விநாடிகள். Leaderboard-ல் உங்கள் இடம்.",
    cta: "சவாலைத் தொடங்கு",
    event: "YGC Innovation Festival 2026",
  },

  language: {
    title: "உங்கள் மொழியைத் தெரிவுசெய்யுங்கள்",
    subtitle: "Choose your display language",
    note: "இது செயலியின் மொழியையும் கேள்விகளின் மொழியையும் ஒரே நேரத்தில் தீர்மானிக்கும்.",
  },

  profile: {
    title: "முதலில், சவாலில் பங்கேற்பவர் யார்?",
    subtitle: "உங்கள் முடிவு இந்த இலக்கத்திற்குச் சேமிக்கப்படும், அது தொலைந்து போகாது.",
    cta: "தொடர்க",
    saving: "சேமிக்கிறது...",
    reassurance:
      "உங்கள் முடிவை அனுப்பவும், EDUS வகுப்புகள் பற்றிப் பேசவும் மட்டுமே இதைப் பயன்படுத்துகிறோம். உங்கள் இலக்கம் leaderboard-ல் ஒருபோதும் காட்டப்படாது.",
  },

  setup: {
    title: "உங்கள் சவாலை அமைக்கவும்",
    subtitle: "சரியான கேள்விகளை வழங்க உங்கள் தரத்தைத் தெரிவுசெய்யுங்கள்.",
    gradeLabel: "உங்கள் தரம்",
    mediumLabel: "உங்கள் மொழிமூலம்",
    mediumSingleNote: "இந்தத் தரம் EDUS இல் தமிழ் மொழிமூலத்தில் வழங்கப்படுகிறது.",
    trackLabel: "உங்கள் உயர்தரப் பிரிவு",
    trackHint: "உங்கள் பிரிவு எந்தப் பாடங்களில் கேள்விகள் வரும் என்பதைத் தீர்மானிக்கும்.",
    cta: "தொடர்க",
    pickGradeFirst: "முதலில் உங்கள் தரத்தைத் தெரிவுசெய்யுங்கள்.",
  },

  ready: {
    title: "தயாரா?",
    timerBadge: "60 விநாடிகள்",
    message: "GO அழுத்தியவுடன் உங்கள் 60 விநாடிகள் தொடங்கும்.",
    rulesTitle: "இது எப்படி நடக்கும்",
    rules: [
      "5 கேள்விகள், ஒவ்வொன்றாக.",
      "முழுச் சவாலுக்கும் ஒரே 60 விநாடி நேரம்.",
      "வேகமாகப் பதிலளித்தால் அதிக புள்ளிகள்.",
      "முந்தைய கேள்விக்குத் திரும்பிச் செல்ல முடியாது.",
    ],
    consent:
      "இந்த சவாலை நடத்தவும், தனியுரிமை பாதுகாக்கப்பட்ட பெயரை leaderboard-ல் காட்டவும், பொருத்தமான EDUS வகுப்புகள் மற்றும் இந்நிகழ்வு தொடர்பாக என்னையோ என் பெற்றோர் அல்லது பாதுகாவலரையோ தொடர்புகொள்ளவும் EDUS இந்த விவரங்களைப் பயன்படுத்த சம்மதிக்கிறேன்.",
    consentRequired: "தொடங்க மேலுள்ள பெட்டியில் அடையாளமிடுங்கள்.",
    cta: "GO!",
    starting: "தொடங்குகிறது...",
  },

  quiz: {
    progress: "கேள்வி {n} / {total}",
    secLabel: "வி",
    encouragement: "உங்களால் முடியும். கவனமாக இருங்கள்.",
    warning20: "20 விநாடிகள். கவனம்!",
    warning10: "கடைசி 10!",
    next: "அடுத்த கேள்வி",
    submit: "சவாலைச் சமர்ப்பிக்க",
    pickAnswer: "தொடர ஒரு பதிலைத் தெரிவுசெய்யுங்கள்.",
    submitting: "பதிவு செய்யப்பட்டது! உங்கள் rank கணக்கிடப்படுகிறது...",
  },

  result: {
    yourScore: "உங்கள் மதிப்பெண்",
    correctLabel: "சரியான பதில்கள்",
    points: "புள்ளிகள்",
    timeTaken: "எடுத்த நேரம்",
    gradeRank: "தர வரிசை",
    rankOf: "உங்கள் தரத்தில் இதுவரை நீங்கள் #{rank} / {total}.",
    badgesTitle: "பெற்ற பதக்கங்கள்",
    answersHiddenTitle: "பதில்கள் மறைக்கப்பட்டுள்ளன",
    answersHidden:
      "விழாவின் போது சரியான பதில்களைக் காட்டுவதில்லை, ஏனெனில் அவை பரவிவிடும். Leaderboard முடிந்த பின் EDUS அவற்றை வெளியிடும்.",
    download: "உங்கள் முடிவைப் பதிவிறக்குக",
    downloading: "தயாராகிறது...",
    downloadFailed: "படத்தை உருவாக்க முடியவில்லை. இந்தத் திரையை screenshot எடுங்கள்.",
    share: "உங்கள் முடிவைப் பகிரவும்",
    captionCopied: "எழுத்து நகலெடுக்கப்பட்டது. படத்துடன் சேர்த்து ஒட்டுங்கள்.",
    savedAndCopied: "படம் சேமிக்கப்பட்டது, எழுத்து நகலெடுக்கப்பட்டது. பகிரும்போது ஒட்டுங்கள்.",
    shareCaption:
      "{badge} {name}{school} YGC Innovation Festival 2026 இல் EDUS 60-விநாடி சவாலில் பங்கேற்றார்!\n\n⚡ மதிப்பெண்: {correct}/{total}\n🎯 புள்ளிகள்: {score}\n⏱️ நேரம்: {seconds}s\n🎓 {grade}\n\n🔥 உங்களால் இதை முறியடிக்க முடியுமா?\n\n📚 EDUS உடன் கற்கவும்: {website}\n📞 Hotline: {hotline}\n\n{hashtags}",
    shareTitle: "EDUS 60-விநாடி சவால்",
    shareCaptionSchool: " ({school})",
    continueCta: "பதிவுக்குத் தொடர்க",
    tiers: {
      CHAMPION: "EDUS சாம்பியன்!",
      EXCELLENT: "மிகச் சிறப்பு!",
      GREAT_START: "சிறந்த தொடக்கம்!",
      CHALLENGE_ACCEPTED: "சவால் ஏற்றுக்கொள்ளப்பட்டது!",
    },
    messages: {
      CHAMPION: "அசத்தல்! முழு மதிப்பெண். உங்கள் தரத்தில் யாராவது உங்கள் நேரத்தை முறியடிக்க முடியுமா?",
      EXCELLENT: "மிகச் சிறப்பு! முழு மதிப்பெண்ணுக்கு இன்னும் ஒரு பதில் மட்டுமே.",
      GREAT_START: "சிறந்த தொடக்கம்! நல்ல திறன் உள்ளது. அதை இன்னும் வளர்ப்போம்.",
      CHALLENGE_ACCEPTED:
        "சவால் ஏற்றுக்கொள்ளப்பட்டது! ஒவ்வொரு சிறந்த மாணவரும் ஓர் இடத்தில் இருந்தே தொடங்குகிறார்கள். உங்கள் அடுத்த படி EDUS உடன் தொடங்கலாம்.",
    },
    badges: {
      LIGHTNING_START: "மின்னல் தொடக்கம்",
      THREE_STREAK: "3 தொடர்ச்சியான வெற்றி",
      PERFECT_5: "Perfect 5",
      FAST_FINISH: "வேக வெற்றியாளர்",
    },
  },

  registration: {
    title: "அடுத்ததாக எந்தப் பாடத்தில் முன்னேற விரும்புகிறீர்கள்?",
    subtitle: "உங்கள் முடிவை எங்கே அனுப்புவது எனச் சொல்லுங்கள். சரியான வகுப்பைத் தெரிவுசெய்ய உதவுவோம்.",
    sectionInterest: "உங்கள் கற்றல் திட்டம்",
    nameLabel: "மாணவர் முழுப் பெயர்",
    namePlaceholder: "உதாரணம்: அ. நிமல்",
    phoneLabel: "WhatsApp இலக்கம்",
    phonePlaceholder: "77 123 4567",
    phoneHint: "உங்கள் முடிவும் வகுப்பு விவரங்களும் இந்த இலக்கத்திற்கு அனுப்பப்படும்.",
    contactOwnerLabel: "இந்த இலக்கம் யாருடையது?",
    schoolLabel: "பாடசாலை",
    schoolPlaceholder: "உங்கள் பாடசாலையின் பெயர்",
    districtLabel: "மாவட்டம்",
    subjectsLabel: "எந்தப் பாடங்களில் உதவி வேண்டும்?",
    subjectsHint: "பொருந்தும் அனைத்தையும் தெரிவுசெய்யுங்கள்.",
    classTypeLabel: "விரும்பும் வகுப்பு வகை",
    startLabel: "எப்போது தொடங்க விரும்புகிறீர்கள்?",
    yourChallenge: "உங்கள் சவால்",
    submit: "பதிவை நிறைவு செய்க",
    submitting: "சமர்ப்பிக்கிறது...",
    errors: {
      name: "மாணவரின் முழுப் பெயரை உள்ளிடுங்கள்.",
      phone: "சரியான இலங்கை கைபேசி இலக்கத்தை உள்ளிடுங்கள். உதாரணம்: 0771234567.",
      contactOwner: "இந்த இலக்கம் யாருடையது எனத் தெரிவுசெய்யுங்கள்.",
      subjects: "குறைந்தது ஒரு பாடத்தையாவது தெரிவுசெய்யுங்கள்.",
      classType: "வகுப்பு வகையைத் தெரிவுசெய்யுங்கள்.",
      startIntent: "எப்போது தொடங்க விரும்புகிறீர்கள் எனத் தெரிவுசெய்யுங்கள்.",
    },
  },

  success: {
    title: "உங்கள் பதிவு நிறைவடைந்தது!",
    subtitle:
      "EDUS 60-விநாடி சவாலில் பங்கேற்றமைக்கு நன்றி. உங்களுக்குப் பொருத்தமான வகுப்பு குறித்து EDUS Student Consultant விரைவில் தொடர்புகொள்வார்.",
    boothNote: "உங்கள் அடுத்த கற்றல் படியைத் தொடங்க இந்தத் திரையை EDUS குழுவிடம் காட்டுங்கள்.",
    recap: "நீங்கள் {seconds} விநாடிகளில் {correct}/{total} பெற்றீர்கள்.",
    linksTitle: "உங்கள் EDUS பயணத்தைத் தொடருங்கள்",
    downloadAgain: "உங்கள் முடிவைப் பதிவிறக்குக",
  },

  errors: {
    network: "EDUS உடன் தொடர்புகொள்ள முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
    generic: "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.",
    quizExpired: "இந்த சவால் அமர்வின் காலம் முடிந்தது. மீண்டும் தொடங்குங்கள்.",
    retry: "மீண்டும் முயற்சிக்க",
    startOver: "மீண்டும் தொடங்கு",
  },

  disclaimer:
    "இது இலங்கைப் பாடசாலை நிலைக் கருத்துகளுடன் பொதுவாகப் பொருந்தும் குறுகிய விழா கற்றல் சவால். இது அதிகாரப்பூர்வ பரீட்சையோ இடநிலைத் தேர்வோ அல்ல.",
};

export const DICTIONARIES: Record<LanguageCode, Dictionary> = { en, ta };

export function getDictionary(language: LanguageCode): Dictionary {
  return DICTIONARIES[language] ?? DICTIONARIES.en;
}

/** Fills {name} style placeholders. Keeps the copy files free of logic. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
