"use client";

import { Translate } from "@phosphor-icons/react";

import type { LanguageCode } from "@/lib/catalog";
import type { Dictionary } from "@/lib/dictionary";
import { ScreenShell } from "../ui";

const CHOICES: { id: LanguageCode; label: string; sub: string }[] = [
  { id: "en", label: "English", sub: "Continue in English" },
  { id: "ta", label: "தமிழ்", sub: "தமிழில் தொடரவும்" },
];

export function LanguageScreen({
  t,
  language,
  onSelect,
  onBack,
}: {
  t: Dictionary;
  language: LanguageCode;
  onSelect: (language: LanguageCode) => void;
  onBack: () => void;
}) {
  return (
    <ScreenShell onBack={onBack} progress={1 / 7} className="items-center justify-center p-6 md:p-12">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <Translate size={30} weight="duotone" className="text-blue-600" />
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-blue-900 md:text-3xl">
          {t.language.title}
        </h1>
        <p className="mb-10 text-center text-lg font-semibold text-blue-800/70">{t.language.subtitle}</p>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => onSelect(choice.id)}
              aria-pressed={language === choice.id}
              className={`rounded-3xl border-2 p-8 text-center transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                language === choice.id
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              <span className="block text-2xl font-bold text-slate-800">{choice.label}</span>
              <span className="mt-1 block text-sm font-medium text-slate-500">{choice.sub}</span>
            </button>
          ))}
        </div>

        <p className="mt-10 rounded-2xl bg-slate-50 p-5 text-center text-sm font-medium leading-relaxed text-slate-500">
          {t.language.note}
        </p>
      </div>
    </ScreenShell>
  );
}
