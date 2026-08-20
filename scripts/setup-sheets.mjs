// ---------------------------------------------------------------------------
// One-time preparation of the two tabs the challenge writes to.
//
//   node scripts/setup-sheets.mjs            report only, changes nothing
//   node scripts/setup-sheets.mjs --apply    write the headers and create the tab
//
// The target spreadsheet holds live EDUS production data. This script touches
// only the registrations tab (addressed by GID) and the quiz attempts tab
// (addressed by title). It never opens any other tab.
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import readline from "readline";

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const REGISTRATION_HEADERS = [
  "Session Id", "Attempt Id", "Captured At", "Started At", "Submitted At", "Registered At", "Status",
  "Language", "Grade", "A/L Track", "Medium",
  "Correct Count", "Hard Correct", "Total Questions", "Score", "Time Taken (s)",
  "Tier", "Badges", "Grade Rank",
  "Student Name", "Student Phone", "Contact Owner", "Consent", "School", "District",
  "Subjects", "Class Type", "Start Intent", "Source", "Campaign",
];

const QUIZ_ATTEMPT_HEADERS = [
  "Submitted At", "Session Id", "Attempt Id", "Grade", "A/L Track", "Medium", "Language",
  "Question No", "Question Id", "Subject", "Topic", "Difficulty", "Question (EN)",
  "Selected Option", "Selected Answer (EN)", "Correct Option", "Is Correct",
  "Response Time (ms)", "Points",
];

function loadEnv() {
  const env = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    const full = path.join(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const at = trimmed.indexOf("=");
      if (at < 1) continue;
      const key = trimmed.slice(0, at).trim();
      if (env[key]) continue; // a real environment variable wins
      env[key] = trimmed.slice(at + 1).trim().replace(/^"|"$/g, "");
    }
  }
  return env;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
  const apply = process.argv.includes("--apply");
  const env = loadEnv();

  const missing = ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_SHEET_ID"]
    .filter((key) => !env[key]);
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  const gid = Number(env.REGISTRATIONS_SHEET_GID || 300772715);
  const attemptsTitle = env.QUIZ_ATTEMPTS_SHEET_TITLE || "YGC Quiz Attempts";

  const auth = new JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(env.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo();

  console.log(`\nSpreadsheet: ${doc.title}`);
  console.log(`Tabs present: ${doc.sheetsByIndex.map((s) => s.title).join(", ")}\n`);

  const registrations = doc.sheetsById[gid];
  if (!registrations) {
    console.error(`No tab with GID ${gid}. Set REGISTRATIONS_SHEET_GID to the right tab.`);
    process.exit(1);
  }

  let existingHeaders = [];
  try {
    await registrations.loadHeaderRow();
    existingHeaders = registrations.headerValues.filter(Boolean);
  } catch {
    existingHeaders = [];
  }

  // A tab with no header row cannot list rows at all, which is exactly the
  // state a half-finished run leaves behind. Treat that as zero rows.
  let rows = [];
  if (existingHeaders.length > 0) {
    try {
      rows = await registrations.getRows();
    } catch {
      rows = [];
    }
  }
  const missingHeaders = REGISTRATION_HEADERS.filter((h) => !existingHeaders.includes(h));

  console.log(`Registrations tab: "${registrations.title}" (gid ${gid})`);
  console.log(`  current headers : ${existingHeaders.length ? existingHeaders.join(", ") : "(none)"}`);
  console.log(`  data rows       : ${rows.length}`);
  console.log(`  missing columns : ${missingHeaders.length ? missingHeaders.join(", ") : "none"}`);

  const attempts = doc.sheetsByTitle[attemptsTitle];
  console.log(`\nQuiz attempts tab: "${attemptsTitle}" ${attempts ? "(exists)" : "(will be created)"}`);

  if (missingHeaders.length === 0 && attempts) {
    console.log("\nBoth tabs are already prepared. Nothing to do.");
    return;
  }

  if (!apply) {
    console.log("\nReport only. Re-run with --apply to make these changes:");
    if (missingHeaders.length > 0) {
      console.log(`  - clear the ${rows.length} row(s) in "${registrations.title}" and write the new header row`);
    }
    if (!attempts) console.log(`  - create the "${attemptsTitle}" tab`);
    return;
  }

  if (missingHeaders.length > 0 && rows.length > 0) {
    console.log(`\nThis will DELETE ${rows.length} existing row(s) from "${registrations.title}".`);
    const answer = await ask(`Type the tab name to confirm ("${registrations.title}"): `);
    if (answer.trim() !== registrations.title) {
      console.log("Names did not match. Nothing was changed.");
      process.exit(1);
    }
  }

  if (missingHeaders.length > 0) {
    // A tab narrower than the header row rejects setHeaderRow outright, so
    // widen it first. Rows are grown too, because the festival will add more
    // than the default allowance.
    if (registrations.columnCount < REGISTRATION_HEADERS.length || registrations.rowCount < 2000) {
      await registrations.resize({
        rowCount: Math.max(registrations.rowCount, 2000),
        columnCount: Math.max(registrations.columnCount, REGISTRATION_HEADERS.length),
      });
      console.log(`Resized "${registrations.title}" to fit ${REGISTRATION_HEADERS.length} columns.`);
    }

    await registrations.clear();
    await registrations.setHeaderRow(REGISTRATION_HEADERS);
    console.log(`Prepared "${registrations.title}" with ${REGISTRATION_HEADERS.length} columns.`);
  }

  if (!attempts) {
    // Five rows per participant, so this tab needs plenty of room.
    await doc.addSheet({
      title: attemptsTitle,
      headerValues: QUIZ_ATTEMPT_HEADERS,
      gridProperties: { rowCount: 10000, columnCount: QUIZ_ATTEMPT_HEADERS.length },
    });
    console.log(`Created "${attemptsTitle}" with ${QUIZ_ATTEMPT_HEADERS.length} columns.`);
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("\nSetup failed:", error.message);
  process.exit(1);
});
