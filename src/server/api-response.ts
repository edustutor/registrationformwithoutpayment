// ---------------------------------------------------------------------------
// One shape for every API error, so the browser can branch on `code` instead
// of matching on prose that changes with translation.
// ---------------------------------------------------------------------------

import "server-only";

import { NextResponse } from "next/server";

import type { ApiErrorResponse } from "@/lib/types";

export function apiError(
  code: ApiErrorResponse["code"],
  error: string,
  status: number,
  details?: string[],
) {
  return NextResponse.json<ApiErrorResponse>({ code, error, details }, { status });
}

/** Flattens a Zod error into plain messages for logging and debugging. */
export function issuesToMessages(issues: { path: PropertyKey[]; message: string }[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.map(String).join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}
