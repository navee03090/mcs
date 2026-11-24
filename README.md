# ReportFix — CodeQuest 2026

Campus issue reporting for the AI module. Students report in English or Roman Urdu, code routes the issue, departments act, and the people affected confirm whether the fix is real.

Live app: https://mcs-pied.vercel.app/

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
npm run test:attack
npm run build
```

`npm run test:attack` uses an in-memory store and the deterministic rule engine. It does not call the model or the production bucket.

## Env

See `.env.example`.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server only — state is stored in a private Storage bucket)
- `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` (optional summary. Decisions do not depend on it.)

## What works

- Judge bar: switch user, create a student (trust starts at 50), reset to the seeded campus
- Report → department, location, priority, one-line reason
- Same problem at the same place merges; WiFi and AC at one lab stay separate
- Safety lexicon (English + Roman Urdu) is always critical
- Caps, "urgent", and instructions inside a report do not change priority
- Unknown places ask for a location instead of guessing
- Harassment stays confidential, anonymous, and off staff queues and public lists
- Affected students confirm or dispute a resolution; the tally is shown
- Trust ledger, crowd bump only at 3+ people, brigading flag for brand-new accounts

## What AI does vs what code does

The model may only propose a short summary. It has no write access.

Code decides priority, the safety override, tone immunity, confidentiality, whether the location exists, who can see an issue, vote weight, trust changes, crowd bumps, reopen, and brigading.

If the key is missing, the call exceeds 8 seconds, or the JSON is invalid, the rule engine still returns a result.

## Storage

State is a JSON file in Supabase Storage (`reportfix/state.json`), not a file on the Vercel machine. Reset replaces that object with the seed (admin, six staff, three students, two sample issues).

## Branding and animation

Logo and campus photos are served from `public/brand/`:

- `mcs-logo.png`
- `mcs-1.jpg`, `mcs-2.jpg`, `mcs-3.jpg`

Replace those files to change the crest or the hero photos. The palette is the crest red and gold in `src/app/globals.css` (`--brand`, `--brand-soft`, `--accent`).

Animations turn off when the operating system asks for reduced motion. The first-visit splash is skipped in that case too.

## Known limits

- Grouping uses the problem category plus the canonical location, not a second model call.
- Urdu script (not Roman Urdu) asks for clarification instead of being translated.
- One shared state file, so two writes at the same instant can overwrite each other.
- Visual design is plain on purpose.
