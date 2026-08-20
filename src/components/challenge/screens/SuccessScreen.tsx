"use client";

import Image from "next/image";
import { ArrowSquareOut, CheckCircle } from "@phosphor-icons/react";

import type { LanguageCode } from "@/lib/catalog";
import type { Dictionary } from "@/lib/dictionary";
import { fillTemplate } from "@/lib/dictionary";
import { EDUS_LINKS } from "@/lib/links";
import type { ChallengeResult } from "@/lib/types";

export function SuccessScreen({
  t,
  language,
  result,
}: {
  t: Dictionary;
  language: LanguageCode;
  result: ChallengeResult;
}) {
  const seconds = Math.round(result.elapsedMs / 100) / 10;

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-white md:min-h-[46rem]">
      <div className="mx-auto w-full max-w-lg flex-1 px-6 py-10 md:py-14">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle size={44} weight="fill" className="text-emerald-500" />
          </div>

          <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-blue-900 md:text-3xl">
            {t.success.title}
          </h1>
          <p className="mb-5 text-base font-medium leading-relaxed text-slate-500">
            {t.success.subtitle}
          </p>

          <p className="rounded-full bg-blue-50 px-5 py-2 text-sm font-bold text-blue-700">
            {fillTemplate(t.success.recap, {
              correct: result.correctCount,
              total: result.totalQuestions,
              seconds,
            })}
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center">
          <p className="text-sm font-semibold leading-relaxed text-amber-800">{t.success.boothNote}</p>
        </div>

        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          {t.success.linksTitle}
        </h2>

        <ul className="space-y-2.5">
          {EDUS_LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target={link.url.startsWith("tel:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  link.primary
                    ? "border-blue-500 bg-blue-50 text-blue-800 hover:bg-blue-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40"
                }`}
              >
                <span className="text-sm">{link.label[language]}</span>
                <ArrowSquareOut size={17} weight="bold" className="shrink-0 opacity-60" />
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Image src="/edus_logo_blue.webp" alt="EDUS" width={100} height={40} className="opacity-60" />
        </div>
      </div>
    </div>
  );
}
