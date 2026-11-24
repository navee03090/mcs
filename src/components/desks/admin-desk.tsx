"use client";

import { AnimatePresence } from "framer-motion";
import { DeskFrame } from "@/components/portal/desk-frame";
import { IssueCard } from "@/components/portal/issue-card";
import { downloadIssuesExcel } from "@/lib/reportfix/excel";
import { cmsOf, reporterLabel, staffLabel } from "@/lib/reportfix/people-label";
import type { Profile } from "@/lib/reportfix/types";
import type { DeskProps } from "./types";

type Props = DeskProps & {
  people: Profile[];
  onRemoveStudent: (studentId: string) => void;
};

export function AdminDesk(props: Props) {
  const issues = (props.board?.issues ?? []).filter((issue) => !issue.is_confidential);
  const confidential = props.board?.confidential ?? [];
  const pending = issues.filter((issue) => issue.status !== "resolved").length;
  const resolved = issues.filter((issue) => issue.status === "resolved").length;
  const total = pending + resolved;
  const students = props.people.filter((person) => person.role === "student");

  function barHeight(count: number) {
    if (!total) return "8%";
    return `${Math.max(12, Math.round((count / total) * 100))}%`;
  }

  return (
    <DeskFrame viewer={props.viewer} onSignOut={props.signOut} toast={props.toast} kicker="Campus admin">
      {props.msg && (
        <p className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">{props.msg}</p>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-3xl">All departments</h2>
              <p className="text-sm text-zinc-600">Public issues across EE, CSE, IS, Library, Cafeteria, and Labs.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => downloadIssuesExcel([...issues, ...confidential], props.people)}
                disabled={!props.board}
                className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                Download Excel
              </button>
              <button
                type="button"
                onClick={props.loadSummary}
                className="text-xs font-semibold text-[var(--brand)] underline"
                disabled={props.busy}
              >
                AI summary
              </button>
            </div>
          </div>
          {props.summary && (
            <pre className="mb-3 whitespace-pre-wrap rounded-xl bg-[var(--brand-soft)] p-3 text-xs">{props.summary}</pre>
          )}
          {!props.board && <div className="h-24 animate-pulse rounded-xl bg-black/5" />}
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  viewer={props.viewer}
                  busy={props.busy}
                  reduced={props.reduced}
                  allowStaff
                  filedBy={reporterLabel(issue, props.people)}
                  staffName={staffLabel(issue, props.people)}
                  onStatus={props.setStatus}
                  onStaff={props.staffAction}
                  onVote={props.vote}
                />
              ))}
            </AnimatePresence>
          </ul>
          {props.board && !issues.length && (
            <p className="text-sm text-zinc-500">No public issues yet.</p>
          )}
        </section>

        <aside className="space-y-3">
          <div className="card p-4">
            <h2 className="font-display text-2xl">Issue status</h2>
            <div
              className="mt-3 flex h-28 items-end gap-6"
              role="img"
              aria-label={`${pending} pending, ${resolved} resolved`}
            >
              <div className="flex h-full flex-1 flex-col justify-end">
                <div className="rounded-t bg-[#b42334]" style={{ height: barHeight(pending) }} />
                <p className="mt-2 text-center text-xs font-semibold">Pending {pending}</p>
              </div>
              <div className="flex h-full flex-1 flex-col justify-end">
                <div className="rounded-t bg-[#2f6b4f]" style={{ height: barHeight(resolved) }} />
                <p className="mt-2 text-center text-xs font-semibold">Resolved {resolved}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {total} public {total === 1 ? "issue" : "issues"}. Confidential cases stay off this chart.
            </p>
          </div>

          <div className="card p-4">
            <h2 className="font-display text-2xl">Students</h2>
            <p className="mb-2 text-xs text-zinc-600">Remove an account. The report stays on the campus record.</p>
            <ul className="max-h-56 space-y-2 overflow-auto text-sm">
              {students.map((student) => (
                <li key={student.id} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="block font-medium">{student.name}</span>
                    <span className="text-xs text-zinc-500">
                      {student.department ?? "No department"}
                      {cmsOf(student) ? ` · CMS ${cmsOf(student)}` : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={props.busy}
                    onClick={() => {
                      if (window.confirm(`Remove ${student.name}? Their reports stay. Their name comes off the account list.`)) {
                        props.onRemoveStudent(student.id);
                      }
                    }}
                    className="rounded-full border border-[var(--brand-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--brand)] disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {!students.length && <li className="text-xs text-zinc-500">No students yet.</li>}
            </ul>
          </div>

          <div className="card p-4">
            <h2 className="font-display text-2xl">Trending</h2>
            <ol className="mt-2 space-y-2 text-sm">
              {props.trending.map((item, index) => (
                <li key={item.id} className="flex gap-2">
                  <span className="font-semibold text-[var(--accent)]">{index + 1}</span>
                  <span>
                    {item.title} · {item.location_text}
                  </span>
                </li>
              ))}
              {!props.trending.length && <li className="text-zinc-500">Nothing public yet</li>}
            </ol>
          </div>

          <div className="card border-[var(--brand-soft)] p-4 text-xs">
            <h2 className="font-display text-2xl">Confidential</h2>
            <p className="mb-2 text-zinc-600">Reporter stays anonymous, including here.</p>
            <ul className="space-y-3">
              {confidential.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  viewer={props.viewer}
                  busy={props.busy}
                  reduced={props.reduced}
                  allowStaff
                  onStatus={props.setStatus}
                  onStaff={props.staffAction}
                  onVote={props.vote}
                />
              ))}
              {!confidential.length && <li className="text-zinc-500">None</li>}
            </ul>
            <h2 className="mb-1 mt-4 font-semibold">Trust ledger</h2>
            <ul className="max-h-48 space-y-1 overflow-auto">
              {(props.board?.ledger ?? []).slice(0, 12).map((event) => (
                <li
                  key={event.id}
                  className={event.delta < 0 ? "text-[var(--brand)]" : event.delta > 0 ? "text-emerald-700" : ""}
                >
                  {event.delta > 0 ? "+" : ""}
                  {event.delta} · {event.reason}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </DeskFrame>
  );
}
