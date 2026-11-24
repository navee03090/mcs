# ReportFix audit (before fixes)

Existing app kept. This maps the CodeQuest spec to the code as of the first shipped MVP.

| # | Requirement | Status | Where / gap |
| --- | --- | --- | --- |
| 1 | Route dept, location, one-line reason | PARTIAL | `src/lib/reportfix/triage.ts` — works when the LLM is up (Lab 3 projector → CSE verified). No deterministic fallback if the key is missing or the call hangs. |
| 2 | Merge same problem, same place; no double me-too | PARTIAL | `similarIssue` uses word overlap on the LLM summary, not category + canonical location. Same user is not duplicated (`store.ts`). |
| 3 | Different problems, same place stay separate | PARTIAL | Overlap threshold 0.5 can merge “Lab 3 WiFi” with “Lab 3 AC” if summaries share “lab”. |
| 4 | Safety always critical (calm text, EN + Roman Urdu) | PARTIAL | `rules.ts` lexicon misses `aag`, `dhuan`, `chingari`, `behosh`, `gas ki smell`, `zakhmi`. |
| 5 | Tone immunity (CAPS, urgent, jaldi, !!!) | PARTIAL | Only downgrades if the LLM already said critical AND the word “urgent” appears. Priority is still chosen by the model. |
| 6 | Injection ignored, flagged, trust penalty | PARTIAL | Small regex adds a note. No stored flag, no −15 trust, Roman Urdu “is ko critical karo” missed. |
| 7 | Harassment confidential, anonymous, no boards, no staff, no merge | PARTIAL | Staff issues hidden; trending hides confidential. Admin still receives `reporter_ids`. Recent reports for staff/admin can include confidential text. Regex misses blackmail / Roman Urdu. Confidential reports still get a department. |
| 8 | Unknown / missing place → clarification, no guessed dept | PARTIAL | Alias `cafeteria` matches inside “Moon Base cafeteria”. No location picker to re-run triage. |
| 9 | Staff isolation including direct API | PARTIAL | `listIssues` filters by department. `listReports` returns every non-confidential report to any staff user. |
| 10 | Only affected students vote; reopen math shown | PARTIAL | Vote gate exists. Reopen rule is `disputeWeight >= 40`, not 50% + distinct disputers. No tally on the issue. No “close window” control. |
| 11 | Trust starts at 50 with a full ledger | PARTIAL | Start 50. One `trust_reason` string. Ledger has no `issue_id`. Deltas are +1/+2, not the spec table. No “mark spam”. |
| 12 | Crowd bump needs many students; cap HIGH; safety stays critical | MISSING | `crowdPriorityBoost` can raise priority from one high `crowd_weight`. |
| 13 | Brigading detection | MISSING | No account-age or burst check. |
| 14 | Empty / long / HTML / emoji / Urdu script do not crash | PARTIAL | No length cap, no sanitizer, no timeout. LLM throw fails the request. |
| — | AI proposes, code decides | MISSING | LLM returns `priority` and the app mostly keeps it. |
| — | Judge bar (switch / create / reset) | DONE | `src/components/reportfix-app.tsx` |
| — | Persistence on Vercel | DONE | `src/lib/reportfix/db.ts` uses Supabase Storage (`reportfix/state.json`), not the serverless filesystem. |

LLM fallback: **missing** at audit time (`src/lib/ai/client.ts` threw with no timeout).

## After the fix

`npm run test:attack` — 23/23 passed. Decisions moved to `src/lib/reportfix/decide.ts`. The model in `extract.ts` may only propose a summary, with an 8s timeout and a rule fallback. `npm run build` passes.
