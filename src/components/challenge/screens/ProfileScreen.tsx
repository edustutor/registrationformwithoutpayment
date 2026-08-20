"use client";

import { useRef, useState } from "react";
import { ShieldCheck, UserCircle } from "@phosphor-icons/react";

import { CONTACT_OWNERS, type LanguageCode } from "@/lib/catalog";
import type { Dictionary } from "@/lib/dictionary";
import { normalisePhone } from "@/lib/schemas";
import { ErrorBanner, Field, OptionCard, PrimaryButton, ScreenShell, TextInput } from "../ui";

export type ProfileValue = {
  fullName: string;
  phone: string;
  contactOwner: string;
  school: string;
  consent: boolean;
};

export const EMPTY_PROFILE: ProfileValue = {
  fullName: "",
  phone: "",
  contactOwner: "STUDENT",
  school: "",
  consent: false,
};

type Errors = Partial<Record<keyof ProfileValue, string>>;

/**
 * The first thing asked, and the point at which the lead is stored.
 *
 * Consent lives here rather than on the ready screen, because this is where
 * the contact number is saved and we do not store a student's number, often a
 * minor's, before they have agreed to be contacted.
 */
export function ProfileScreen({
  t,
  language,
  value,
  onChange,
  onContinue,
  saving,
  submitError,
  onBack,
}: {
  t: Dictionary;
  language: LanguageCode;
  value: ProfileValue;
  onChange: (next: ProfileValue) => void;
  onContinue: () => void;
  saving: boolean;
  submitError: string | null;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement | null>(null);

  function update(patch: Partial<ProfileValue>) {
    const key = Object.keys(patch)[0] as keyof ProfileValue;
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
    onChange({ ...value, ...patch });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const found: Errors = {};
    if (value.fullName.trim().length < 2) found.fullName = t.registration.errors.name;
    if (!normalisePhone(value.phone)) found.phone = t.registration.errors.phone;
    if (!value.consent) found.consent = t.ready.consentRequired;
    setErrors(found);

    if (Object.keys(found).length > 0) {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onContinue();
  }

  return (
    <ScreenShell onBack={onBack} progress={2 / 7} className="p-6 md:p-12">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto flex w-full max-w-lg flex-1 flex-col"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <UserCircle size={30} weight="duotone" className="text-blue-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-blue-900 md:text-3xl">
            {t.profile.title}
          </h1>
          <p className="text-base font-medium text-slate-500">{t.profile.subtitle}</p>
        </div>

        <div className="space-y-6">
          <Field
            label={t.registration.nameLabel}
            htmlFor="profileName"
            required
            error={errors.fullName}
          >
            <TextInput
              id="profileName"
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
            htmlFor="profilePhone"
            required
            error={errors.phone}
            hint={t.registration.phoneHint}
          >
            <div className="flex">
              <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-4 font-bold text-slate-600">
                +94
              </span>
              <TextInput
                id="profilePhone"
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

          <Field label={t.registration.schoolLabel} htmlFor="profileSchool">
            <TextInput
              id="profileSchool"
              name="school"
              maxLength={150}
              placeholder={t.registration.schoolPlaceholder}
              value={value.school}
              onChange={(event) => update({ school: event.target.value })}
            />
          </Field>

          <Field label={t.registration.contactOwnerLabel} required>
            <div className="grid grid-cols-2 gap-3">
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

          <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-4">
            <ShieldCheck size={18} weight="duotone" className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-xs font-medium leading-relaxed text-slate-500">
              {t.profile.reassurance}
            </p>
          </div>

          <div data-invalid={Boolean(errors.consent)}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-600 ${
                errors.consent ? "border-red-300 bg-red-50/40" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={value.consent}
                onChange={(event) => update({ consent: event.target.checked })}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium leading-relaxed text-slate-600">
                {t.ready.consent}
              </span>
            </label>
            {errors.consent && (
              <p role="alert" className="mt-1.5 text-xs font-bold text-red-600">
                {errors.consent}
              </p>
            )}
          </div>
        </div>

        {submitError && (
          <div className="mt-6">
            <ErrorBanner message={submitError} />
          </div>
        )}

        <div className="mt-8">
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? t.profile.saving : `${t.profile.cta} →`}
          </PrimaryButton>
        </div>
      </form>
    </ScreenShell>
  );
}
