"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lightning } from "@phosphor-icons/react";

import type { LanguageCode } from "@/lib/catalog";
import type { Dictionary } from "@/lib/dictionary";
import { fillTemplate } from "@/lib/dictionary";
import type { ClientQuestion, SubmittedAnswer } from "@/lib/types";
import { PrimaryButton } from "../ui";

const LETTERS = ["A", "B", "C", "D", "E"];

export function QuizScreen({
  t,
  language,
  questions,
  durationSeconds,
  onComplete,
  submitting,
}: {
  t: Dictionary;
  language: LanguageCode;
  questions: ClientQuestion[];
  durationSeconds: number;
  onComplete: (answers: SubmittedAnswer[]) => void;
  submitting: boolean;
}) {
  const totalMs = durationSeconds * 1000;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [msLeft, setMsLeft] = useState(totalMs);

  const answered = useRef<SubmittedAnswer[]>([]);
  // Both clocks are stamped in the mount effect rather than during render,
  // because reading the clock while rendering is impure and React 19 rejects it.
  const questionShownAt = useRef(0);
  // An absolute deadline, not a counter. A counter drifts and stops ticking
  // when a booth tablet backgrounds the tab; comparing against a fixed instant
  // stays correct however the browser throttles the interval.
  const deadline = useRef(0);
  const finished = useRef(false);

  const current = questions[index];
  const isLastQuestion = index === questions.length - 1;

  const finish = useCallback(
    (explicitAnswer?: SubmittedAnswer) => {
      if (finished.current) return;
      finished.current = true;

      const collected = [...answered.current];

      // Count whatever is selected but not yet confirmed, so a student who is
      // mid-tap when the timer runs out still gets credit for that choice.
      const pending =
        explicitAnswer ??
        (selected !== null && current
          ? {
              questionId: current.id,
              selectedOptionId: selected,
              responseMs: Date.now() - questionShownAt.current,
            }
          : null);
      if (pending) collected.push(pending);

      const seen = new Set(collected.map((answer) => answer.questionId));
      for (const question of questions) {
        if (!seen.has(question.id)) {
          collected.push({ questionId: question.id, selectedOptionId: null, responseMs: 0 });
        }
      }

      onComplete(collected);
    },
    [current, onComplete, questions, selected],
  );

  // Keep the interval pointed at the newest closure without restarting it,
  // so the countdown never resets when the student picks an option.
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  useEffect(() => {
    // Start the clock the moment the first question is on screen. Setting the
    // deadline before the interval matters: a zero deadline would read as
    // "time is already up" on the very first tick.
    const startedAt = Date.now();
    deadline.current = startedAt + totalMs;
    questionShownAt.current = startedAt;

    const id = window.setInterval(() => {
      const remaining = Math.max(0, deadline.current - Date.now());
      setMsLeft(remaining);
      if (remaining <= 0) finishRef.current();
    }, 200);
    return () => window.clearInterval(id);
  }, [totalMs]);

  function handleNext() {
    if (selected === null || finished.current) return;

    const answer: SubmittedAnswer = {
      questionId: current.id,
      selectedOptionId: selected,
      responseMs: Date.now() - questionShownAt.current,
    };

    if (isLastQuestion) {
      finish(answer);
      return;
    }

    answered.current.push(answer);
    setSelected(null);
    setIndex((value) => value + 1);
    questionShownAt.current = Date.now();
  }

  const secondsLeft = Math.ceil(msLeft / 1000);
  const fraction = totalMs > 0 ? msLeft / totalMs : 0;
  const urgent = secondsLeft <= 10;
  const warning = secondsLeft <= 20;

  if (!current) return null;

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-white p-6 md:min-h-[46rem] md:p-12">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div className="mb-8 flex items-center justify-between">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            {fillTemplate(t.quiz.progress, { n: index + 1, total: questions.length })}
          </span>

          <div className="flex items-center gap-2.5">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 40 40" aria-hidden>
                <circle cx="20" cy="20" r="18" fill="none" strokeWidth="3" className="stroke-slate-100" />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={2 * Math.PI * 18 * (1 - fraction)}
                  className={urgent ? "stroke-red-500" : warning ? "stroke-amber-500" : "stroke-blue-500"}
                />
              </svg>
              <span
                role="timer"
                aria-live="off"
                className={`text-lg font-bold leading-none ${urgent ? "text-red-600" : "text-slate-900"}`}
              >
                {secondsLeft}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-400">{t.quiz.secLabel}</span>
          </div>
        </div>

        <div
          className={`mb-8 flex w-fit max-w-full items-start gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${
            urgent
              ? "border-red-100 bg-red-50 text-red-700"
              : warning
                ? "border-amber-100 bg-amber-50 text-amber-700"
                : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}
        >
          <Lightning size={16} weight="fill" className="mt-0.5 shrink-0" />
          {urgent ? t.quiz.warning10 : warning ? t.quiz.warning20 : t.quiz.encouragement}
        </div>

        <h1 className="mb-8 text-2xl font-bold leading-relaxed text-slate-900 md:mb-10 md:text-3xl">
          {current.prompt[language]}
        </h1>

        <div
          role="radiogroup"
          aria-label={current.prompt[language]}
          className="mt-auto grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
        >
          {current.options.map((option, position) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={submitting}
                onClick={() => setSelected(option.id)}
                className={`flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left text-lg font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:shadow-sm"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors ${
                    isSelected ? "bg-blue-200 text-blue-900" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {LETTERS[position]}
                </span>
                {option.text[language]}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <PrimaryButton onClick={handleNext} disabled={selected === null || submitting}>
            {submitting
              ? t.quiz.submitting
              : `${isLastQuestion ? t.quiz.submit : t.quiz.next} →`}
          </PrimaryButton>
          {selected === null && !submitting && (
            <p className="mt-3 text-center text-xs font-semibold text-slate-400">{t.quiz.pickAnswer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
