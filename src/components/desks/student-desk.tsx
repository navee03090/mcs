"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TriageStepper } from "@/components/motion/TriageStepper";
import { DeskFrame } from "@/components/portal/desk-frame";
import { IssueCard } from "@/components/portal/issue-card";
import { isMine } from "@/lib/portal";
import type { DeskProps } from "./types";

const SAMPLES = [
  "CSE Lab 3 projector nahi chal raha",
  "calmly: sparks from EE Lab 1 outlet",
  "ragging complaint near Hostel A",
  "Moon Base cafeteria sink clogged",
];

export function StudentDesk(props: DeskProps) {
  const { viewer, board, trending } = props;
  const mine = (board?.issues ?? []).filter((issue) => isMine(issue, viewer.id));
  const waiting = (board?.reports ?? []).filter(
    (report) => report.reporter_id === viewer.id && report.needs_clarification,
  );

  return (
    <DeskFrame viewer={viewer} onSignOut={props.signOut} toast={props.toast} kicker="Student desk">
      {props.msg && (
        <p className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">{props.msg}</p>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-3">
          <motion.div
            className="card p-4"
            animate={props.needsPlace && !props.reduced ? { x: [0, -8, 8, -4, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="font-display text-2xl">File a report</h2>
            <p className="mt-1 text-sm text-zinc-600">English or Roman Urdu. The code decides the route.</p>
            <TriageStepper running={props.busy} visible={props.showTriage} />
            <textarea
              className="mt-3 min-h-28 w-full rounded-xl border border-black/10 bg-white p-3 text-sm"
              placeholder="CSE Lab 3 ka projector band hai"
              maxLength={1000}
              value={props.text}
              onChange={(event) => props.setText(event.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {SAMPLES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => props.setText(sample)}
                  className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] text-zinc-600"
                >
                  {sample}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-xs text-zinc-600">
              Location if asked{" "}
              <select
                className="ml-1 rounded-lg border border-black/10 bg-white px-2 py-1"
                value={props.locationId}
                onChange={(event) => {
                  const placeId = event.target.value;
                  props.setLocationId(placeId);
                  if (props.needsPlace && placeId) props.submit(placeId);
                }}
              >
                <option value="">Not sure yet</option>
                {(board?.locations ?? []).map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </label>
            {props.needsPlace && (
              <div className="mt-3 flex flex-wrap gap-2">
                <p className="w-full text-xs font-medium">Did you mean…?</p>
                {(board?.locations ?? []).map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => props.submit(loc.id)}
                    disabled={props.busy}
                    className={`rounded-full border px-3 py-1 text-xs ${props.locationId === loc.id ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-black/10 bg-white"}`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => props.submit()}
              disabled={props.busy || !props.text.trim()}
              className="btn mt-3 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {props.busy ? "Reading the report…" : "Submit to AI triage"}
            </button>
            {props.msg?.includes("Confidential") && (
              <p className="mt-3 text-sm font-medium text-[var(--brand)]">
                Sealed. This stays on your tracker and off every public board.
              </p>
            )}
          </motion.div>

          <div className="card p-4">
            <h2 className="font-display text-2xl">My issues</h2>
            <p className="mb-3 text-sm text-zinc-600">Live status for reports you filed or joined.</p>
            {waiting.map((report) => (
              <p key={report.id} className="mb-2 rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-xs">
                Needs a place: {report.clarification_question}
              </p>
            ))}
            {!board && <div className="h-24 animate-pulse rounded-xl bg-black/5" />}
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {mine.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    viewer={viewer}
                    busy={props.busy}
                    reduced={props.reduced}
                    allowStaff={false}
                    onStatus={props.setStatus}
                    onStaff={props.staffAction}
                    onVote={props.vote}
                  />
                ))}
              </AnimatePresence>
            </ul>
            {board && !mine.length && (
              <p className="rounded-2xl border border-dashed border-black/10 px-3 py-6 text-center text-sm text-zinc-500">
                Nothing on your tracker yet. File a report above.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-3">
          <div className="card p-4">
            <h2 className="font-display text-2xl">Trending</h2>
            <ol className="mt-2 space-y-2 text-sm">
              {trending.map((item, index) => (
                <li key={item.id} className="flex gap-2">
                  <span className="font-semibold text-[var(--accent)]">{index + 1}</span>
                  <span>
                    {item.title} · {item.location_text}
                  </span>
                </li>
              ))}
              {!trending.length && <li className="text-zinc-500">Nothing public yet</li>}
            </ol>
          </div>
          <div className="card p-4">
            <h2 className="font-semibold">Your trust</h2>
            <p className="mt-1 text-xs text-zinc-600">{viewer.trust_reason}</p>
            <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-xs">
              {(board?.ledger ?? []).slice(0, 8).map((event) => (
                <li key={event.id} className={event.delta < 0 ? "text-[var(--brand)]" : "text-emerald-800"}>
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
