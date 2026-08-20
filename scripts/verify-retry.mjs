// ---------------------------------------------------------------------------
// Exercises the Sheets retry logic without touching Google.
//
//   node scripts/verify-retry.mjs
//
// This covers the path that cannot be induced safely on production: what
// happens when Google rate limits the app during a festival queue.
// ---------------------------------------------------------------------------

import { withRetry, isTransient, backoffFor, RETRY_ATTEMPTS } from "../src/server/retry.ts";

let pass = 0;
let fail = 0;
const check = (ok, label, extra = "") => {
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label.padEnd(52)} ${extra}`);
};

const err = (status, message = "boom") => Object.assign(new Error(message), { status });
const noSleep = async () => {};

console.log("=== which failures are worth retrying ===");
check(isTransient(err(429)), "429 rate limit is transient");
check(isTransient(err(500)), "500 is transient");
check(isTransient(err(503)), "503 is transient");
check(isTransient(new Error("socket hang up")), "socket hang up is transient");
check(isTransient(new Error("ECONNRESET")), "ECONNRESET is transient");
check(!isTransient(err(400)), "400 bad request is NOT retried");
check(!isTransient(err(401)), "401 bad credential is NOT retried");
check(!isTransient(err(404)), "404 missing tab is NOT retried");

console.log("\n=== backoff grows and is jittered ===");
const noJitter = () => 0;
const delays = [1, 2, 3].map((a) => backoffFor(a, noJitter));
check(delays[0] === 400 && delays[1] === 800 && delays[2] === 1600, "doubles each attempt", delays.join("ms, ") + "ms");
const jittered = new Set(Array.from({ length: 20 }, () => backoffFor(1)));
check(jittered.size > 1, "jitter spreads simultaneous retries", `${jittered.size} distinct delays in 20 draws`);

console.log("\n=== retry behaviour ===");
let calls = 0;
const recovered = await withRetry("test", async () => {
  calls++;
  if (calls < 3) throw err(429);
  return "stored";
}, { sleep: noSleep });
check(recovered === "stored" && calls === 3, "recovers after two rate limits", `${calls} attempts`);

calls = 0;
try {
  await withRetry("test", async () => { calls++; throw err(429); }, { sleep: noSleep });
  check(false, "gives up after the attempt limit");
} catch {
  check(calls === RETRY_ATTEMPTS, "gives up after the attempt limit", `${calls} attempts`);
}

calls = 0;
try {
  await withRetry("test", async () => { calls++; throw err(400); }, { sleep: noSleep });
  check(false, "fails fast on a non transient error");
} catch {
  check(calls === 1, "fails fast on a non transient error", `${calls} attempt`);
}

calls = 0;
const first = await withRetry("test", async () => { calls++; return "ok"; }, { sleep: noSleep });
check(first === "ok" && calls === 1, "no retry when the call succeeds", `${calls} attempt`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
