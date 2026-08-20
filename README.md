# EDUS 60-Second Challenge

A festival quiz-to-registration funnel for the **YGC Innovation Festival 2026**
(Jaffna, 22 August 2026). A student picks a language, takes a five question
challenge against a sixty second clock, downloads their score card, and then
registers their interest in EDUS classes.

Everything is written to a Google Sheet, and completed registrations are also
pushed to Perfex CRM.

---

## The flow

```
WELCOME -> LANGUAGE -> PROFILE -> SETUP -> READY -> QUIZ -> RESULT -> REGISTRATION -> SUCCESS
```

| Screen | What happens |
| --- | --- |
| `WELCOME` | Brand entry point. |
| `LANGUAGE` | English or Tamil. Sets **both** the interface language and the language the questions are shown in. |
| `PROFILE` | Name, WhatsApp number, whose number it is, and consent. **Written to the sheet before the student goes any further.** |
| `SETUP` | Grade, then medium. Only the mediums EDUS teaches that grade in are offered, and a grade with one medium selects it automatically. Grade A/L also asks for a stream. |
| `READY` | Rules and the GO button. The clock starts on GO, not before. |
| `QUIZ` | Five questions, one at a time, no going back, one sixty second timer for the whole attempt. Auto-submits at zero. |
| `RESULT` | Score, points, time, grade rank, badges, and a downloadable PNG score card. Correct answers are deliberately not shown. |
| `REGISTRATION` | District, subjects, class type and start intent. Name, number and contact owner arrive pre-filled from `PROFILE` and stay editable so a typo can be corrected. School is optional. Subjects are derived from the grade and medium chosen on `SETUP`. |
| `SUCCESS` | Confirmation, score recap and the EDUS link list. |

### Lead capture is the point

Contact details are asked for **before** the quiz and written to the sheet
immediately, because a lead nobody can call is worth nothing. A student who
gives their number and then closes the tab is still a lead.

The row is created once and updated in place as the student progresses, so
`Status` tells you exactly how far each person got:

| `Status` | Meaning |
| --- | --- |
| `PROFILE_CAPTURED` | Gave their name and number, went no further. Still callable. |
| `QUIZ_STARTED` | Picked a grade and started the challenge, did not finish. Callable, and you know their grade. |
| `CHALLENGE_COMPLETED` | Finished the quiz, did not complete the registration. |
| `REGISTERED` | Completed everything. |

Consent is taken on the `PROFILE` screen rather than later, because that is the
screen where the contact number is stored. EDUS does not keep a student's
number, often a minor's, before they have agreed to be contacted.

---

## Architecture

```
src/
  app/
    layout.tsx                  Fonts (Geist + Noto Sans Tamil), metadata, viewport
    page.tsx                    Renders ChallengeApp
    globals.css                 Tailwind v4 theme, font stack, reduced-motion, word-break
    api/
      health/route.ts           Can this app store a student right now
      lead/route.ts             Stores the lead the moment it is given
      quiz/start/route.ts       Picks the questions, issues a signed session token
      quiz/submit/route.ts      Grades server-side, scores, ranks, persists
      registration/route.ts     Saves contact + interest, pushes the CRM lead

  components/challenge/
    ChallengeApp.tsx            The state machine and all API calls
    ui.tsx                      Shared primitives (buttons, fields, option cards)
    screens/*.tsx               One file per screen

  lib/                          Safe on the client
    catalog.ts                  Grades, mediums, A/L streams, subjects, districts
    dictionary.ts               Every interface string, in English and Tamil
    scoring.ts                  Pure scoring maths, shared vocabulary
    schemas.ts                  Zod request schemas + phone normalisation
    types.ts                    API contracts
    links.ts                    EDUS destinations for the final screen

  server/                       Server only, guarded by the `server-only` package
    env.ts                      Environment validation, read and checked once
    retry.ts                    Backoff for Sheets rate limits, import free so it is testable
    question-bank.ts            Loads the bank, selects questions, grades answers
    quiz-token.ts               HMAC signing and verification of a quiz session
    sheets.ts                   Google Sheets access, upsert, ranking
    crm.ts                      Perfex lead push
    api-response.ts             One error envelope for every route

scripts/setup-sheets.mjs        One-time preparation of the two sheet tabs
scripts/verify-retry.mjs        Exercises the rate-limit retry without calling Google
EDUS_YGC_2026_Questions_Only.json   287 bilingual questions (imported at build time)
```

### Why the answer key never reaches the browser

`src/server/question-bank.ts` holds `correct_option_id` and imports
`server-only`, so it cannot be pulled into a client bundle. `/api/quiz/start`
returns questions through `toClientQuestion()`, which strips the key and
shuffles the options.

Because the browser cannot be trusted to say which questions it was asked
either, `/api/quiz/start` also issues an HMAC-signed token listing the exact
question IDs, the track and the server start time. `/api/quiz/submit` rejects a
submission whose answers do not match that token.

---

## Scoring

From the campaign config. Accuracy dominates; speed only breaks close ties.

| Component | Value |
| --- | --- |
| Base points | easy 900, medium 1000, hard 1100 |
| Speed bonus | up to 100 per **correct** answer, `round(100 * (1 - min(ms, 12000) / 12000))` |
| Streak bonus | 50 per consecutive correct after the first, capped at 200 |
| Perfect bonus | 250 for 5 out of 5 |
| Normalised score | `raw / best possible for the questions you drew * 10000` |

Normalising against the student's **own** question set means a student who drew
three hard questions is not punished against one who drew three easy ones.

Tie-break order for the grade rank: correct count, normalised score, hard
questions correct, elapsed time, then who submitted first.

**Timing integrity.** Per-question timings come from the browser and could be
understated to farm the speed bonus, so the server rescales them to add up to
the elapsed time it measured itself. A client claiming every answer took zero
milliseconds gets the real elapsed time spread evenly across its answers.

---

## Data

Two tabs, in the spreadsheet named by `GOOGLE_SHEET_ID`. **No other tab in that
spreadsheet is ever read or written.**

### Registrations, addressed by GID (default `300772715`, the "Events Signup" tab)

One row per participant, created the moment the name and number are given and
updated in place at every later step.

`Session Id`, `Attempt Id`, `Captured At`, `Started At`, `Submitted At`,
`Registered At`, `Status`, `Language`, `Grade`, `A/L Track`, `Medium`,
`Correct Count`, `Hard Correct`, `Total Questions`, `Score`, `Time Taken (s)`,
`Tier`, `Badges`, `Grade Rank`, `Student Name`, `Student Phone`,
`Contact Owner`, `Consent`, `School`, `District`, `Subjects`, `Class Type`,
`Start Intent`, `Source`, `Campaign`

See the status table above for how far each row got.

### Quiz attempts, addressed by title (default `YGC Quiz Attempts`)

One row per question answered, five per attempt, joined back by `Session Id`.

`Submitted At`, `Session Id`, `Attempt Id`, `Grade`, `A/L Track`, `Medium`,
`Language`, `Question No`, `Question Id`, `Subject`, `Topic`, `Difficulty`,
`Question (EN)`, `Selected Option`, `Selected Answer (EN)`, `Correct Option`,
`Is Correct`, `Response Time (ms)`, `Points`

---

## Setup

### Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | yes | Service account with edit access to the spreadsheet. |
| `GOOGLE_PRIVATE_KEY` | yes | Literal `\n` sequences are converted to newlines. |
| `GOOGLE_SHEET_ID` | yes | The spreadsheet ID from its URL. |
| `PERFEX_API_TOKEN` | no | Without it the CRM push is skipped and logged, nothing else changes. |
| `REGISTRATIONS_SHEET_GID` | no | Defaults to `300772715`. |
| `QUIZ_ATTEMPTS_SHEET_TITLE` | no | Defaults to `YGC Quiz Attempts`. |
| `QUIZ_TOKEN_SECRET` | no | Defaults to a value derived from the service account key, so there is nothing extra to configure. Set it explicitly if you rotate the Google key and want tokens to survive. |

### One-time sheet preparation

```bash
npm run setup:sheets
```

Reports what it would change and touches nothing. To apply:

```bash
node scripts/setup-sheets.mjs --apply
```

Applying rewrites the registrations tab header row. If that tab has data rows,
the script names them, asks you to type the tab name to confirm, and clears
them. It also creates the quiz attempts tab if it is missing.

The running app never does this. If a header is missing at runtime it refuses
the write and tells you to run this script, rather than guessing and destroying
data during the festival.

### Develop

```bash
npm run dev
```

### Verify before shipping

```bash
npm run check
```

Runs `tsc --noEmit`, then `eslint`, then `npm run verify:retry`.

The retry check exercises the rate-limit path that cannot be induced safely
against production: which failures are retried, that backoff doubles and is
jittered, that a non-transient error fails fast, and that the attempt limit
holds.

---

## Operational notes

- **Sheets quota** is roughly 60 reads and 60 writes per minute per service
  account. A full journey costs five writes and three reads. Being throttled no
  longer fails a student: every Google call retries with exponential backoff and
  jitter, so a burst degrades into a short wait instead of an error. Sustained
  overload past the retry budget would still fail, and the answer is a database,
  not a bigger retry.
- **A student is never blocked by a failed lead write.** If the sheet cannot be
  written on the first screen, they are let through and the browser re-sends the
  same details when the quiz starts, which recreates the row. Every later step
  re-sends what it knows, so one failed write is repaired by the next step.
- **`GET /api/health`** answers "can this app store a student right now" without
  opening the spreadsheet. It reads no rows, so booth staff can poll it during
  the event, and it reports no participant data.
- **A failed lead write stops the student**, on purpose. There is nothing else
  in flight to salvage at that point, and losing the lead is the one outcome
  this flow exists to prevent, so the student is asked to try again.
- **A failed sheet write does not lose a score.** The result screen still shows
  the correct score and displays a notice asking booth staff to record it by
  hand. The server logs the failure.
- **A CRM outage cannot fail a registration.** The lead push is best-effort and
  its errors are logged and swallowed; the sheet is the record of truth.
- **Answers are hidden on purpose.** Showing them at a live booth lets students
  pass them around and destroys the leaderboard. Release them after the
  leaderboard closes.
- **The score card carries no personal data**: no name, no phone, no school.

---

## Known gap

Registration offers **Physics** and **Combined Maths** for Grade A/L, because
those are the A/L subjects in the supplied catalogue. A student who picks the
Commerce, Biological Science, Technology or Arts stream is therefore shown two
subjects that do not match their stream. Their quiz questions are correct;
only the subject list on the registration screen is affected. Extend
`GRADES` in `src/lib/catalog.ts` once the full A/L subject offering is
confirmed.
