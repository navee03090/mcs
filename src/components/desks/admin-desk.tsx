"use client";

import { AnimatePresence } from "framer-motion";
import { DeskFrame } from "@/components/portal/desk-frame";
import { IssueCard } from "@/components/portal/issue-card";
import type { DeskProps } from "./types";

export function AdminDesk(props: DeskProps) {
  const issues = (props.board?.issues ?? []).filter((issue) => !issue.is_confidential);

  return (
    <DeskFrame viewer={props.viewer} onSignOut={props.signOut} toast={props.toast} kicker="Campus admin">
      {props.msg && (
        <p className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">{props.msg}</p>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-3xl">All departments</h2>
              <p className="text-sm text-zinc-600">Public issues across EE, CSE, IS, Library, Cafeteria, and Labs.</p>
            </div>
            <button
              type="button"
              onClick={props.loadSummary}
              className="text-xs font-semibold text-[var(--brand)] underline"
              disabled={props.busy}
            >
              AI summary
            </button>
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
              {(props.board?.confidential ?? []).map((issue) => (
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
              {!props.board?.confidential?.length && <li className="text-zinc-500">None</li>}
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
