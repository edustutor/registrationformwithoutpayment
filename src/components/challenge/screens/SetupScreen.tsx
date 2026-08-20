"use client";

import { useMemo } from "react";
import { GraduationCap } from "@phosphor-icons/react";

import {
  AL_TRACKS,
  GRADES,
  MEDIUMS,
  findGrade,
  type AlTrackId,
  type GradeId,
  type LanguageCode,
  type MediumId,
} from "@/lib/catalog";
import type { Dictionary } from "@/lib/dictionary";
import { Field, OptionCard, PrimaryButton, ScreenShell } from "../ui";

export type SetupValue = {
  grade: GradeId | "";
  medium: MediumId | "";
  alTrack: AlTrackId | "";
};

export function SetupScreen({
  t,
  language,
  value,
  onChange,
  onContinue,
  onBack,
}: {
  t: Dictionary;
  language: LanguageCode;
  value: SetupValue;
  onChange: (next: SetupValue) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const grade = value.grade ? findGrade(value.grade) : undefined;
  const availableMediums = useMemo(
    () => MEDIUMS.filter((medium) => grade?.mediums.includes(medium.id)),
    [grade],
  );

  const needsTrack = value.grade === "AL";
  const canContinue =
    Boolean(value.grade) && Boolean(value.medium) && (!needsTrack || Boolean(value.alTrack));

  /**
   * Changing grade can invalidate the chosen medium, because EDUS does not
   * teach every grade in both mediums. Selecting the only option outright
   * saves the student a tap and removes an impossible state.
   */
  function selectGrade(gradeId: GradeId) {
    const next = findGrade(gradeId);
    const mediums = next?.mediums ?? [];
    const keepMedium = value.medium && mediums.includes(value.medium as MediumId);

    onChange({
      grade: gradeId,
      medium: keepMedium ? value.medium : mediums.length === 1 ? mediums[0] : "",
      alTrack: gradeId === "AL" ? value.alTrack : "",
    });
  }

  return (
    <ScreenShell onBack={onBack} progress={3 / 7} className="p-6 md:p-12">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <GraduationCap size={28} weight="duotone" className="text-blue-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-blue-900 md:text-3xl">
            {t.setup.title}
          </h1>
          <p className="text-base font-medium text-slate-500">{t.setup.subtitle}</p>
        </div>

        <div className="space-y-7">
          <Field label={t.setup.gradeLabel} required>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {GRADES.map((option) => (
                <OptionCard
                  key={option.id}
                  name="grade"
                  value={option.id}
                  checked={value.grade === option.id}
                  onChange={() => selectGrade(option.id)}
                  className="justify-center px-3 py-4 text-center"
                >
                  <span className="text-sm font-bold text-slate-700">{option.label[language]}</span>
                </OptionCard>
              ))}
            </div>
          </Field>

          {grade && (
            <Field
              label={t.setup.mediumLabel}
              required
              hint={availableMediums.length === 1 ? t.setup.mediumSingleNote : undefined}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {availableMediums.map((medium) => (
                  <OptionCard
                    key={medium.id}
                    name="medium"
                    value={medium.id}
                    checked={value.medium === medium.id}
                    onChange={() => onChange({ ...value, medium: medium.id })}
                    className="justify-center py-4 text-center"
                  >
                    <span className="text-sm font-bold text-slate-700">{medium.label[language]}</span>
                  </OptionCard>
                ))}
              </div>
            </Field>
          )}

          {needsTrack && (
            <Field label={t.setup.trackLabel} required hint={t.setup.trackHint}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {AL_TRACKS.map((track) => (
                  <OptionCard
                    key={track.id}
                    name="alTrack"
                    value={track.id}
                    checked={value.alTrack === track.id}
                    onChange={() => onChange({ ...value, alTrack: track.id })}
                    className="py-4"
                  >
                    <span className="text-sm font-bold text-slate-700">{track.label[language]}</span>
                  </OptionCard>
                ))}
              </div>
            </Field>
          )}
        </div>

        <div className="mt-10 pt-2">
          <PrimaryButton onClick={onContinue} disabled={!canContinue}>
            {t.setup.cta} &rarr;
          </PrimaryButton>
        </div>
      </div>
    </ScreenShell>
  );
}
