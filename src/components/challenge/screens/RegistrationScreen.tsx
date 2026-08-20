"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { BookOpen, CheckCircle } from "@phosphor-icons/react";

import {
  CLASS_TYPES,
  CONTACT_OWNERS,
  DISTRICTS,
  START_INTENTS,
  gradeLabel,
  subjectLabel,
  subjectsFor,
  trackLabel,
  type LanguageCode,
} from "@/lib/catalog";
import type { Dictionary } from "@/lib/dictionary";
import { normalisePhone } from "@/lib/schemas";
import type { ChallengeResult } from "@/lib/types";
import { ErrorBanner, Field, OptionCard, PrimaryButton, ScreenShell, SelectInput, TextInput } from "../ui";

export type RegistrationValue = {
  fullName: string;
  phone: string;
  contactOwner: string;
  school: string;
  district: string;
  subjects: string[];
  classType: string;
  startIntent: string;
};

export const EMPTY_REGISTRATION: RegistrationValue = {
  fullName: "",
  phone: "",
  contactOwner: "STUDENT",
  school: "",
  district: "Jaffna",
  subjects: [],
  classType: "",
  startIntent: "",
};

type Errors = Partial<Record<keyof RegistrationValue, string>>;

export function RegistrationScreen({
  t,
  language,
  result,
  value,
  onChange,
  onSubmit,
  submitting,
  submitError,
  onBack,
}: {
  t: Dictionary;
  language: LanguageCode;
  result: ChallengeResult;
  value: RegistrationValue;
  onChange: (next: RegistrationValue) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement | null>(null);

  const availableSubjects = useMemo(
    () => subjectsFor(result.grade, result.medium),
    [result.grade, result.medium],
  );

  function validate(): Errors {
    const found: Errors = {};
    if (value.fullName.trim().length < 2) found.fullName = t.registration.errors.name;
    if (!normalisePhone(value.phone)) found.phone = t.registration.errors.phone;
    if (!value.contactOwner) found.contactOwner = t.registration.errors.contactOwner;
    if (value.subjects.length === 0) found.subjects = t.registration.errors.subjects;
    if (!value.classType) found.classType = t.registration.errors.classType;
    if (!value.startIntent) found.startIntent = t.registration.errors.startIntent;
    return found;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);

    if (Object.keys(found).length > 0) {
      // Put the student on the first problem rather than making them hunt.
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onSubmit();
  }

  /** Clears a field's error as soon as the student starts fixing it. */
  function update(patch: Partial<RegistrationValue>) {
    const key = Object.keys(patch)[0] as keyof RegistrationValue;
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
    onChange({ ...value, ...patch });
  }

  function toggleSubject(subject: string, checked: boolean) {
    const next = checked
      ? [...value.subjects, subject]
      : value.subjects.filter((item) => item !== subject);
    update({ subjects: next });
  }

  const seconds = Math.round(result.elapsedMs / 100) / 10;
  const trackName = result.alTrack ? trackLabel(result.alTrack, language) : "";

  return (
    <ScreenShell onBack={onBack} progress={6 / 7} className="p-0">
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="hidden w-2/5 flex-col justify-center bg-emerald-50 p-10 md:flex lg:w-1/3">
          <Image
            src="/success_avatar.jpg"
            alt=""
            width={400}
            height={400}
            className="mb-8 w-full max-w-xs rounded-3xl object-contain mix-blend-multiply"
          />
          <ChallengeSummary
            t={t}
            language={language}
            result={result}
            seconds={seconds}
            trackName={trackName}
          />
        </aside>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="flex w-full flex-col p-6 md:w-3/5 md:p-10 lg:w-2/3 lg:p-12"
        >
          <header className="mb-8">
            <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-blue-900 md:text-3xl">
              {t.registration.title}
            </h1>
            <p className="text-base font-medium text-slate-500">{t.registration.subtitle}</p>
          </header>

          <div className="mb-8 md:hidden">
            <ChallengeSummary
              t={t}
              language={language}
              result={result}
              seconds={seconds}
              trackName={trackName}
            />
          </div>

          <SectionTitle>{t.registration.sectionContact}</SectionTitle>

          <div className="space-y-6">
            <Field label={t.registration.nameLabel} htmlFor="fullName" required error={errors.fullName}>
              <TextInput
                id="fullName"
                name="fullName"
                autoComplete="name"
                maxLength={100}
                placeholder={t.registration.namePlaceholder}
                value={value.fullName}
                invalid={Boolean(errors.fullName)}
                onChange={(event) => update({ fullName: event.target.value })}
              />
            </Field>

            <Field
              label={t.registration.phoneLabel}
              htmlFor="phone"
              required
              error={errors.phone}
              hint={t.registration.phoneHint}
            >
              <div className="flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-4 font-bold text-slate-600">
                  +94
                </span>
                <TextInput
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder={t.registration.phonePlaceholder}
                  value={value.phone}
                  invalid={Boolean(errors.phone)}
                  onChange={(event) => update({ phone: event.target.value })}
                  className="rounded-l-none"
                />
              </div>
            </Field>

            <Field label={t.registration.contactOwnerLabel} required error={errors.contactOwner}>
              <div className="grid grid-cols-2 gap-3" data-invalid={Boolean(errors.contactOwner)}>
                {CONTACT_OWNERS.map((owner) => (
                  <OptionCard
                    key={owner.id}
                    name="contactOwner"
                    value={owner.id}
                    checked={value.contactOwner === owner.id}
                    onChange={() => update({ contactOwner: owner.id })}
                    className="justify-center py-3.5 text-center"
                  >
                    <span className="text-sm font-bold text-slate-700">{owner.label[language]}</span>
                  </OptionCard>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field label={t.registration.schoolLabel} htmlFor="school">
                <TextInput
                  id="school"
                  name="school"
                  maxLength={150}
                  placeholder={t.registration.schoolPlaceholder}
                  value={value.school}
                  onChange={(event) => update({ school: event.target.value })}
                />
              </Field>

              <Field label={t.registration.districtLabel} htmlFor="district" required>
                <SelectInput
                  id="district"
                  name="district"
                  value={value.district}
                  onChange={(event) => update({ district: event.target.value })}
                >
                  {DISTRICTS.map((district) => (
                    <option key={district.en} value={district.en}>
                      {language === "ta" ? `${district.ta} (${district.en})` : district.en}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </div>

          <SectionTitle className="mt-10">{t.registration.sectionInterest}</SectionTitle>

          <div className="space-y-6">
            <Field
              label={t.registration.subjectsLabel}
              required
              error={errors.subjects}
              hint={t.registration.subjectsHint}
            >
              <div
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                data-invalid={Boolean(errors.subjects)}
              >
                {availableSubjects.map((subject) => {
                  const checked = value.subjects.includes(subject);
                  return (
                    <OptionCard
                      key={subject}
                      name="subjects"
                      value={subject}
                      multiple
                      checked={checked}
                      onChange={(_, isChecked) => toggleSubject(subject, isChecked)}
                      className="flex-col justify-center gap-2 py-4 text-center"
                    >
                      {checked ? (
                        <CheckCircle size={24} weight="fill" className="text-blue-500" />
                      ) : (
                        <BookOpen size={24} weight="duotone" className="text-slate-400" />
                      )}
                      <span className="text-sm font-bold leading-tight text-slate-700">
                        {subjectLabel(subject, language)}
                      </span>
                    </OptionCard>
                  );
                })}
              </div>
            </Field>

            <Field label={t.registration.classTypeLabel} required error={errors.classType}>
              <div className="grid grid-cols-1 gap-3" data-invalid={Boolean(errors.classType)}>
                {CLASS_TYPES.map((type) => (
                  <OptionCard
                    key={type.id}
                    name="classType"
                    value={type.id}
                    checked={value.classType === type.id}
                    onChange={() => update({ classType: type.id })}
                  >
                    <div>
                      <div className="text-base font-bold text-slate-900">{type.label[language]}</div>
                      <div className="text-sm font-medium text-slate-500">
                        {type.description[language]}
                      </div>
                    </div>
                  </OptionCard>
                ))}
              </div>
            </Field>

            <Field label={t.registration.startLabel} required error={errors.startIntent}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-invalid={Boolean(errors.startIntent)}>
                {START_INTENTS.map((intent) => (
                  <OptionCard
                    key={intent.id}
                    name="startIntent"
                    value={intent.id}
                    checked={value.startIntent === intent.id}
                    onChange={() => update({ startIntent: intent.id })}
                    className="justify-center py-3.5 text-center"
                  >
                    <span className="text-sm font-bold text-slate-700">{intent.label[language]}</span>
                  </OptionCard>
                ))}
              </div>
            </Field>
          </div>

          {submitError && (
            <div className="mt-8">
              <ErrorBanner message={submitError} />
            </div>
          )}

          <div className="mt-8">
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? t.registration.submitting : `${t.registration.submit} →`}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </ScreenShell>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`mb-5 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400 ${className ?? ""}`}
    >
      {children}
    </h2>
  );
}

function ChallengeSummary({
  t,
  language,
  result,
  seconds,
  trackName,
}: {
  t: Dictionary;
  language: LanguageCode;
  result: ChallengeResult;
  seconds: number;
  trackName: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-600">
        {t.registration.yourChallenge}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black leading-none text-emerald-600">{result.correctCount}</span>
        <span className="text-xl font-black text-slate-300">/{result.totalQuestions}</span>
        <span className="ml-3 text-sm font-bold text-slate-500">
          {result.normalisedScore} {t.result.points} · {seconds}s · #{result.rank}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        {gradeLabel(result.grade, language)}
        {trackName ? ` · ${trackName}` : ""}
      </p>
    </div>
  );
}
