"use client";

// ---------------------------------------------------------------------------
// Small shared pieces for the challenge screens.
//
// Sized for a festival booth: every tappable target is at least 48px tall,
// labels are always visible rather than placeholder-only, and errors sit next
// to the field they belong to.
// ---------------------------------------------------------------------------

import type { ReactNode } from "react";
import { ArrowLeft, WarningCircle } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export function ScreenShell({
  children,
  onBack,
  title,
  progress,
  className,
}: {
  children: ReactNode;
  onBack?: () => void;
  title?: string;
  /** 0 to 1. Omit on screens that are not part of the linear flow. */
  progress?: number;
  className?: string;
}) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-white md:min-h-[46rem]">
      {(onBack || title) && (
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="relative flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="-ml-2 rounded-full p-2 text-blue-700 transition-colors hover:bg-blue-50 active:bg-blue-100"
              >
                <ArrowLeft size={22} weight="bold" />
              </button>
            ) : (
              <span className="h-10 w-10" aria-hidden />
            )}

            <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold tracking-tight text-blue-900">
              {title ?? "EDUS Challenge"}
            </span>

            <span className="h-10 w-10" aria-hidden />
          </div>

          {progress !== undefined && (
            <div className="h-1 w-full bg-slate-100">
              <div
                className="h-full rounded-r-full bg-blue-600 transition-all duration-500"
                style={{ width: `${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%` }}
              />
            </div>
          )}
        </header>
      )}

      <div className={cn("flex flex-1 flex-col", className)}>{children}</div>
    </div>
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "w-full rounded-full bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/25",
        "transition-all hover:bg-blue-700 active:scale-[0.98]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        "disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "w-full rounded-full border-2 border-slate-200 bg-white px-6 py-3.5 text-base font-bold text-slate-700",
        "transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="ml-1 text-blue-600">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs font-medium text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-600">
          <WarningCircle size={14} weight="fill" />
          {error}
        </p>
      )}
    </div>
  );
}

const CONTROL_CLASS =
  "w-full rounded-xl border bg-slate-50/60 px-4 py-3.5 font-medium text-slate-900 transition-all " +
  "placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function TextInput({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_CLASS, invalid ? "border-red-400" : "border-slate-200", className)}
    />
  );
}

export function SelectInput({
  invalid,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_CLASS,
        "cursor-pointer",
        invalid ? "border-red-400" : "border-slate-200",
        className,
      )}
    >
      {children}
    </select>
  );
}

/**
 * A large tappable card used for every single-choice and multi-choice answer.
 * Rendered as a real input plus label so keyboard and screen readers work.
 */
export function OptionCard({
  name,
  value,
  checked,
  onChange,
  multiple,
  disabled,
  children,
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string, checked: boolean) => void;
  multiple?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-600",
        checked
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40",
        disabled && "cursor-not-allowed opacity-50 hover:border-slate-200 hover:bg-white",
        className,
      )}
    >
      <input
        type={multiple ? "checkbox" : "radio"}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(value, event.target.checked)}
        className="sr-only"
      />
      {children}
    </label>
  );
}

export function ErrorBanner({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4">
      <p className="flex items-start gap-2 text-sm font-semibold text-red-700">
        <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          {retryLabel ?? "Try again"}
        </button>
      )}
    </div>
  );
}
