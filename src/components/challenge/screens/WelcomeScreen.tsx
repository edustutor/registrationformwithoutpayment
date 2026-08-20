"use client";

import Image from "next/image";
import { Clock } from "@phosphor-icons/react";

import type { Dictionary } from "@/lib/dictionary";
import { PrimaryButton } from "../ui";

export function WelcomeScreen({ t, onStart }: { t: Dictionary; onStart: () => void }) {
  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[46rem] md:flex-row">
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-blue-50 p-8 md:w-1/2 md:p-12">
        <div className="absolute left-6 top-6 z-10">
          <Image src="/edus_logo_blue.webp" alt="EDUS" width={110} height={44} priority />
        </div>
        <Image
          src="/hero_avatar.jpg"
          alt=""
          width={500}
          height={500}
          priority
          className="z-10 w-full max-w-xs rounded-3xl object-contain mix-blend-multiply md:max-w-sm"
        />
      </div>

      <div className="flex w-full flex-col items-center justify-center p-8 md:w-1/2 md:p-12">
        <span className="mb-6 flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
          <Clock size={15} weight="bold" />
          {t.welcome.badge}
        </span>

        <h1 className="mb-4 text-center text-3xl font-extrabold leading-tight tracking-tight text-blue-900 md:text-4xl">
          {t.welcome.title}
        </h1>

        <p className="mb-8 max-w-md text-center text-base font-medium leading-relaxed text-slate-500">
          {t.welcome.subtitle}
        </p>

        <div className="w-full max-w-sm">
          <PrimaryButton onClick={onStart}>{t.welcome.cta} &rarr;</PrimaryButton>
        </div>

        <p className="mt-8 max-w-sm text-center text-xs font-medium leading-relaxed text-slate-400">
          {t.welcome.event}
        </p>
      </div>
    </div>
  );
}
