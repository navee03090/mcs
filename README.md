# CodeQuest AI — empty shell

Next.js + Supabase + Vercel starter for **CodeQuest 2026 Module 02 (AI Hackathon)**.

No product features. Build the real solution only after the problem statement drops.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend / API | Next.js 16 (App Router) |
| DB / Auth / Storage | Supabase |
| Deploy | Vercel ← GitHub |
| AI | Gemini (primary) + OpenAI (backup) via `POST /api/ai` |

## Setup (tonight)

1. Create a **private** GitHub repo and push this folder.
2. Create a Supabase project → copy URL + keys into `.env.local`.
3. Get a [Gemini API key](https://aistudio.google.com/apikey) (and optional OpenAI backup).
4. Import the GitHub repo in Vercel → add the same env vars → Deploy.
5. Confirm `https://YOUR_APP.vercel.app/api/health` returns `"ok": true`.

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Team roles

| Role | Owns |
| --- | --- |
| A · AI / Product | Prompt design, model IO, impact story |
| B · Full-stack | API routes, Supabase schema, deploy |
| C · UX / Pitch | UI polish, 4-min demo script, Q&A |

## Day-of rules reminder

- Core code must be written during the hackathon window.
- Open-source frameworks, pretrained weights, and public APIs are allowed with attribution.
- Do not recycle a past competition project or commercial template.

## Useful paths

- `src/lib/supabase/` — browser, server, admin, session proxy clients
- `src/app/api/health` — env readiness JSON
- `src/app/api/ai` — empty AI route to wire at kickoff
- Portal login: https://codequest26.vercel.app/portal/ai-26

## Demo target (4 min)

1. Problem (20s) → 2. Live click-through (2 min) → 3. AI architecture (45s) → 4. Impact (30s)
