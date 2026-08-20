// ---------------------------------------------------------------------------
// Retry with exponential backoff for Google Sheets calls.
//
// Kept free of imports so it can be exercised directly by
// scripts/verify-retry.mjs without standing up the whole app.
// ---------------------------------------------------------------------------

// 6 attempts with a 400ms doubling backoff waits about 12 seconds in total.
// Google's quota windows are per minute, so a short retry gives up while the
// window is still closed. Waiting longer at the last step of the funnel beats
// telling a student their registration failed.
export const RETRY_ATTEMPTS = 6;
export const RETRY_BASE_DELAY_MS = 400;

function statusOf(error: unknown): number | null {
  const candidate = error as { status?: number; code?: number; response?: { status?: number } };
  return candidate?.response?.status ?? candidate?.status ?? candidate?.code ?? null;
}

/**
 * Rate limits and transient server errors are worth another go. A bad
 * credential, a deleted tab or a malformed request is not: retrying those
 * just wastes the student's time at the booth.
 */
export function isTransient(error: unknown): boolean {
  const status = statusOf(error);
  if (status === 429) return true;
  if (status !== null && status >= 500) return true;

  // Socket level failures carry no HTTP status.
  const message = (error as Error)?.message ?? "";
  return /ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|network/i.test(message);
}

/** Exponential backoff with jitter, in milliseconds, for a given attempt. */
export function backoffFor(attempt: number, random: () => number = Math.random): number {
  const base = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
  // Jitter matters: several tablets throttled at the same instant would
  // otherwise all retry at the same instant and throttle each other again.
  return base + Math.floor(random() * RETRY_BASE_DELAY_MS);
}

export type RetryOptions = {
  attempts?: number;
  sleep?: (ms: number) => Promise<void>;
  onRetry?: (label: string, attempt: number, waitMs: number, error: unknown) => void;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Google Sheets allows about 60 reads and 60 writes per minute for one service
 * account. A festival queue can burst past that, and a throttled call comes
 * back as HTTP 429. Without a retry that surfaces as a hard failure to a
 * student standing at the booth, which is the worst possible moment.
 */
export async function withRetry<T>(
  label: string,
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? RETRY_ATTEMPTS;
  const sleep = options.sleep ?? defaultSleep;
  const onRetry =
    options.onRetry ??
    ((name, attempt, waitMs, error) =>
      console.warn(
        `[sheets] ${name} attempt ${attempt} failed with ${statusOf(error) ?? "network error"}, retrying in ${waitMs}ms`,
      ));

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransient(error) || attempt === attempts) throw error;

      const waitMs = backoffFor(attempt);
      onRetry(label, attempt, waitMs, error);
      await sleep(waitMs);
    }
  }

  throw lastError;
}
