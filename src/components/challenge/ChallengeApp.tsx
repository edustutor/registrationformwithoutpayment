"use client";

// ---------------------------------------------------------------------------
// The challenge flow.
//
//   WELCOME -> LANGUAGE -> PROFILE -> SETUP -> READY -> QUIZ -> RESULT
//           -> REGISTRATION -> SUCCESS
//
// Language is chosen before anything else and drives both the interface copy
// and the language the questions are shown in.
//
// PROFILE comes early on purpose: lead collection is the point of the funnel,
// so the name and number are stored the moment they are given. A student who
// closes the tab mid-quiz is still a lead EDUS can call. Grade and medium are
// chosen next so the right questions can be served, and are reused on the
// registration screen to work out which subjects to offer.
// ---------------------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import type { AlTrackId, GradeId, LanguageCode, MediumId } from "@/lib/catalog";
import { getDictionary } from "@/lib/dictionary";
import type {
  ApiErrorResponse,
  ChallengeResult,
  QuizStartResponse,
  QuizSubmitResponse,
  SubmittedAnswer,
} from "@/lib/types";
import { LanguageScreen } from "./screens/LanguageScreen";
import { ProfileScreen, EMPTY_PROFILE, type ProfileValue } from "./screens/ProfileScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { ReadyScreen } from "./screens/ReadyScreen";
import { RegistrationScreen, EMPTY_REGISTRATION, type RegistrationValue } from "./screens/RegistrationScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { SetupScreen, type SetupValue } from "./screens/SetupScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";

type Step =
  | "WELCOME"
  | "LANGUAGE"
  | "PROFILE"
  | "SETUP"
  | "READY"
  | "QUIZ"
  | "RESULT"
  | "REGISTRATION"
  | "SUCCESS";

const EMPTY_SETUP: SetupValue = { grade: "", medium: "", alTrack: "" };

/** Reads our error envelope off a failed response, falling back to a generic
 *  message so the student never sees a raw status code. */
async function readApiError(response: Response): Promise<ApiErrorResponse> {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    if (body?.code) return body;
  } catch {
    // Body was not our JSON envelope, fall through.
  }
  return { code: "INTERNAL_ERROR", error: "Request failed" };
}

export default function ChallengeApp() {
  const [step, setStep] = useState<Step>("WELCOME");
  const [language, setLanguage] = useState<LanguageCode>("en");

  const [profile, setProfile] = useState<ProfileValue>(EMPTY_PROFILE);
  const [setup, setSetup] = useState<SetupValue>(EMPTY_SETUP);

  const [quiz, setQuiz] = useState<QuizStartResponse | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);

  const [registration, setRegistration] = useState<RegistrationValue>(EMPTY_REGISTRATION);

  const [savingProfile, setSavingProfile] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [submittingRegistration, setSubmittingRegistration] = useState(false);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const t = getDictionary(language);

  // Minted on first use inside an event handler, never during render. That
  // keeps the server and client markup identical and gives the quiz and the
  // registration the same id, which is how the two rows are matched up.
  const sessionIdRef = useRef("");
  function getSessionId() {
    if (!sessionIdRef.current) sessionIdRef.current = uuidv4();
    return sessionIdRef.current;
  }

  function goTo(next: Step) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  /**
   * Stores the lead before the challenge begins. The student only moves on
   * once this has been saved, because a lead that was never written is exactly
   * the loss this screen exists to prevent.
   */
  async function handleSaveProfile() {
    if (savingProfile) return;

    setSavingProfile(true);
    setProfileError(null);

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          language,
          fullName: profile.fullName,
          phone: profile.phone,
          contactOwner: profile.contactOwner,
          school: profile.school,
          consent: profile.consent,
        }),
      });

      if (!response.ok) {
        const error = await readApiError(response);
        setProfileError(error.code === "VALIDATION_FAILED" ? error.error : t.errors.generic);
        return;
      }

      goTo("SETUP");
    } catch (error) {
      console.error("[challenge] lead capture failed", error);
      setProfileError(t.errors.network);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleStartQuiz() {
    if (!setup.grade || !setup.medium) return;

    setStarting(true);
    setStartError(null);

    try {
      const response = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          language,
          grade: setup.grade as GradeId,
          medium: setup.medium as MediumId,
          alTrack: (setup.alTrack || null) as AlTrackId | null,
          // Re-sent so a lead write that failed on the previous screen is
          // repaired here rather than lost.
          profile: {
            fullName: profile.fullName,
            phone: profile.phone,
            contactOwner: profile.contactOwner,
            school: profile.school,
            consent: profile.consent,
          },
        }),
      });

      if (!response.ok) {
        const error = await readApiError(response);
        setStartError(error.code === "CONFIG_ERROR" ? error.error : t.errors.generic);
        return;
      }

      const data = (await response.json()) as QuizStartResponse;
      setQuiz(data);
      goTo("QUIZ");
    } catch (error) {
      console.error("[challenge] start failed", error);
      setStartError(t.errors.network);
    } finally {
      setStarting(false);
    }
  }

  const handleCompleteQuiz = useCallback(
    async (answers: SubmittedAnswer[]) => {
      if (!quiz || submittingQuiz) return;

      setSubmittingQuiz(true);
      try {
        const response = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: quiz.token, answers }),
        });

        if (!response.ok) {
          const error = await readApiError(response);
          // An expired or rejected session cannot be recovered by retrying the
          // submit, so send the student back to the start of the challenge.
          setQuiz(null);
          setStartError(
            error.code === "SESSION_EXPIRED" || error.code === "SESSION_INVALID"
              ? t.errors.quizExpired
              : t.errors.generic,
          );
          goTo("READY");
          return;
        }

        const data = (await response.json()) as QuizSubmitResponse;
        setResult(data.result);
        setStorageFailed(Boolean(data.storageFailed));
        goTo("RESULT");
      } catch (error) {
        console.error("[challenge] submit failed", error);
        setQuiz(null);
        setStartError(t.errors.network);
        goTo("READY");
      } finally {
        setSubmittingQuiz(false);
      }
    },
    [quiz, submittingQuiz, t],
  );

  async function handleSubmitRegistration() {
    if (!result || submittingRegistration) return;

    setSubmittingRegistration(true);
    setRegistrationError(null);

    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          attemptId: result.attemptId,
          language,
          ...registration,
        }),
      });

      if (!response.ok) {
        const error = await readApiError(response);
        setRegistrationError(error.code === "VALIDATION_FAILED" ? error.error : t.errors.generic);
        return;
      }

      goTo("SUCCESS");
    } catch (error) {
      console.error("[challenge] registration failed", error);
      setRegistrationError(t.errors.network);
    } finally {
      setSubmittingRegistration(false);
    }
  }

  return (
    <div className="mx-auto w-full bg-slate-100 md:flex md:min-h-[100dvh] md:items-center md:justify-center md:p-6">
      <div
        key={step}
        className="w-full overflow-hidden bg-white duration-300 animate-in fade-in md:max-w-5xl md:rounded-[2rem] md:shadow-xl"
      >
        {step === "WELCOME" && <WelcomeScreen t={t} onStart={() => goTo("LANGUAGE")} />}

        {step === "LANGUAGE" && (
          <LanguageScreen
            t={t}
            language={language}
            onBack={() => goTo("WELCOME")}
            onSelect={(next) => {
              setLanguage(next);
              goTo("PROFILE");
            }}
          />
        )}

        {step === "PROFILE" && (
          <ProfileScreen
            t={t}
            language={language}
            value={profile}
            onChange={setProfile}
            onContinue={handleSaveProfile}
            saving={savingProfile}
            submitError={profileError}
            onBack={() => goTo("LANGUAGE")}
          />
        )}

        {step === "SETUP" && (
          <SetupScreen
            t={t}
            language={language}
            value={setup}
            onChange={setSetup}
            onBack={() => goTo("PROFILE")}
            onContinue={() => goTo("READY")}
          />
        )}

        {step === "READY" && (
          <ReadyScreen
            t={t}
            onStart={handleStartQuiz}
            starting={starting}
            error={startError}
            onBack={() => goTo("SETUP")}
          />
        )}

        {step === "QUIZ" && quiz && (
          <QuizScreen
            t={t}
            language={language}
            questions={quiz.questions}
            durationSeconds={quiz.durationSeconds}
            onComplete={handleCompleteQuiz}
            submitting={submittingQuiz}
          />
        )}

        {step === "RESULT" && result && (
          <ResultScreen
            t={t}
            language={language}
            result={result}
            studentName={profile.fullName}
            school={profile.school}
            storageFailed={storageFailed}
            onContinue={() => goTo("REGISTRATION")}
          />
        )}

        {step === "REGISTRATION" && result && (
          <RegistrationScreen
            t={t}
            language={language}
            result={result}
            value={registration}
            onChange={setRegistration}
            onSubmit={handleSubmitRegistration}
            submitting={submittingRegistration}
            submitError={registrationError}
            onBack={() => goTo("RESULT")}
          />
        )}

        {step === "SUCCESS" && result && <SuccessScreen t={t} language={language} result={result} />}
      </div>
    </div>
  );
}
