"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/motion/CountUp";
import { PulseGlow } from "@/components/motion/PulseGlow";
import { StatusTimeline } from "@/components/motion/StatusTimeline";
import { liveLabel } from "@/lib/portal";
import type { Issue, IssueStatus, Profile } from "@/lib/reportfix/types";

const STATUS_OPTIONS: IssueStatus[] = ["open", "in_progress", "resolved", "reopened"];

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  reopened: "Reopened",
};

function priorityClass(priority: Issue["priority"]) {
  if (priority === "critical") return "bg-[#b42334] text-white";
  if (priority === "high") return "bg-[#c8962e] text-[#1a120b]";
  if (priority === "medium") return "bg-[#f3e2b3] text-[#1a120b]";
  return "bg-zinc-200 text-zinc-800";
}

const RAIL: Record<Issue["priority"], string> = {
  critical: "bg-[#b42334]",
  high: "bg-[#c8962e]",
  medium: "bg-[#e4c36a]",
  low: "bg-zinc-300",
};

export function IssueCard({
  issue,
  viewer,
  busy,
  reduced,
  allowStaff,
  onStatus,
  onStaff,
  onVote,
  filedBy,
  staffName,
}: {
  issue: Issue;
  viewer: Profile;
  busy: boolean;
  reduced: boolean | null;
  allowStaff: boolean;
  onStatus: (issueId: string, status: IssueStatus) => void;
  onStaff: (issueId: string, action: "spam" | "close_window") => void;
  onVote: (issueId: string, vote: "confirm" | "dispute") => void;
  filedBy?: string;
  staffName?: string;
}) {
  const affected = issue.is_confidential || issue.reporter_ids.includes(viewer.id);
  const canVote =
    viewer.role === "student" &&
    affected &&
    (issue.status === "resolved" || issue.status === "reopened");

  return (
    <motion.li
      layout
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.3 }}
      className="overflow-hidden rounded-2xl border border-black/10 bg-white text-sm"
    >
      <div className="flex">
        <span className={`w-1.5 shrink-0 ${RAIL[issue.priority]}`} aria-hidden="true" />
        <div className="min-w-0 flex-1 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold">
              {issue.priority === "critical" && <span aria-hidden="true">! </span>}
              {issue.title}
            </p>
            <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)]">
              {liveLabel(issue)}
            </span>
          </div>
          {filedBy && (
            <p className="mt-1 text-xs font-semibold text-[#140c0c]">
              Filed by {filedBy}
              {staffName ? ` · ${staffName}` : ""}
            </p>
          )}
          {issue.priority_explanation && (
            <p className="mt-1 text-xs font-medium text-[#140c0c]">{issue.priority_explanation}</p>
          )}
          <p className="text-zinc-600">{issue.canonical_summary}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{issue.department}</span>
            <span>{issue.location_text}</span>
            <PulseGlow active={issue.priority === "critical"} className="rounded-full">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${priorityClass(issue.priority)}`}>
                {issue.priority}
              </span>
            </PulseGlow>
            <span>
              me-too <CountUp value={issue.me_too_count} />
            </span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full bg-[var(--accent)]"
              style={{ width: `${Math.min(100, (issue.crowd_score / 6) * 100)}%` }}
            />
          </div>
          {issue.tally && <p className="text-xs text-zinc-700">Tally: {issue.tally}</p>}
          {issue.injection && (
            <p className="text-xs font-medium text-[var(--brand)]">Injection flagged — command ignored</p>
          )}
          {issue.brigade_flag && <p className="text-xs text-amber-800">{issue.brigade_reason}</p>}
          {issue.is_confidential && (
            <p className="text-xs font-medium text-[var(--brand)]">Anonymous and confidential</p>
          )}
          <StatusTimeline status={issue.status} verificationOpen={issue.verification_open} />

          {allowStaff && (
            <details className="mt-2 text-xs">
              <summary>Triage debug</summary>
              <p>Rules: {(issue.rules_fired ?? []).join(", ") || "—"}</p>
              <p>
                Base {issue.base_priority} → final {issue.priority}. Crowd {issue.crowd_score}.
              </p>
            </details>
          )}

          {allowStaff && (
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busy || (issue.is_confidential && viewer.role !== "admin")}
                  onClick={() => onStatus(issue.id, status)}
                  className="btn rounded-full border border-black/10 px-2 py-0.5 text-xs"
                >
                  {STATUS_LABEL[status]}
                </button>
              ))}
              <button
                type="button"
                disabled={busy}
                onClick={() => onStaff(issue.id, "spam")}
                className="btn rounded-full border border-red-300 px-2 py-0.5 text-xs"
              >
                Mark invalid
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onStaff(issue.id, "close_window")}
                className="btn rounded-full border border-black/10 px-2 py-0.5 text-xs"
              >
                Close verification
              </button>
            </div>
          )}

          {canVote && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn rounded-full bg-emerald-700 px-3 py-1 text-xs text-white"
                disabled={busy}
                onClick={() => onVote(issue.id, "confirm")}
              >
                Confirm fix
              </button>
              <button
                type="button"
                className="btn rounded-full bg-[var(--brand)] px-3 py-1 text-xs text-white"
                disabled={busy}
                onClick={() => onVote(issue.id, "dispute")}
              >
                Dispute fix
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}
