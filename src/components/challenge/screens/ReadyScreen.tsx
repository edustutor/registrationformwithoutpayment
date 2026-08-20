"use client";

import { CheckCircle, Clock } from "@phosphor-icons/react";

import type { Dictionary } from "@/lib/dictionary";
import { ErrorBanner, PrimaryButton, ScreenShell } from "../ui";

export function ReadyScreen({
  t,
  onStart,
  starting,
  error,
  onBack,
}: {
  t: Dictionary;
  onStart: () => void;
  starting: boolean;
  error: string | null;
  onBack: () => void;
}) {
  return (
    <ScreenShell onBack={onBack} progress={4 / 7} className="p-6 md:p-12">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center">
        <div className="relative mb-8 flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[6px] border-slate-100" />
          <div className="absolute inset-0 animate-[spin_2.5s_linear_infinite] rounded-full border-[6px] border-blue-500 border-t-transparent" />
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-50">
            <Clock size={44} weight="fill" className="text-amber-500" />
          </div>
        </div>

        <span className="mb-6 rounded-full bg-blue-600 px-5 py-1.5 text-sm font-bold text-white">
          {t.ready.timerBadge}
        </span>

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-blue-900">{t.ready.title}</h1>
        <p className="mb-8 max-w-sm text-center text-lg font-medium leading-relaxed text-slate-500">
          {t.ready.message}
        </p>

        <div className="mb-6 w-full rounded-2xl bg-slate-50 p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            {t.ready.rulesTitle}
          </h2>
          <ul className="space-y-2">
            {t.ready.rules.map((rule) => (
              <li key={rule} className="flex items-start gap-2.5 text-sm font-medium text-slate-600">
                <CheckCircle size={17} weight="fill" className="mt-0.5 shrink-0 text-blue-500" />
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="mb-5 w-full">
            <ErrorBanner message={error} onRetry={onStart} retryLabel={t.errors.retry} />
          </div>
        )}

        <PrimaryButton onClick={onStart} disabled={starting} className="py-5 text-xl font-extrabold">
          {starting ? t.ready.starting : `${t.ready.cta} →`}
        </PrimaryButton>

        <p className="mt-8 text-center text-[11px] font-medium leading-relaxed text-slate-400">
          {t.disclaimer}
        </p>
      </div>
    </ScreenShell>
  );
}
