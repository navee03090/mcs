"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { IssueStatus } from "@/lib/reportfix/types";

const STEPS = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
  { id: "confirmed", label: "Confirmed" },
] as const;

export function StatusTimeline({
  status,
  verificationOpen,
}: {
  status: IssueStatus;
  verificationOpen?: boolean;
}) {
  const reduced = useReducedMotion();
  const reopened = status === "reopened";
  const active =
    status === "resolved" && verificationOpen === false
      ? 3
      : status === "resolved"
        ? 2
        : status === "in_progress" || reopened
          ? 1
          : 0;

  return (
    <div className="mt-2">
      {reopened && (
        <motion.p
          className="mb-1 text-[11px] font-semibold text-amber-700"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Reopened
        </motion.p>
      )}
      <ol className="grid grid-cols-4 gap-1">
        {STEPS.map((step, index) => {
          const done = index <= active;
          return (
            <li key={step.id} className="min-w-0">
              <div className="relative h-1.5 rounded-full bg-black/10">
                <motion.div
                  className={`h-full rounded-full ${reopened && index === 1 ? "bg-amber-500" : "bg-[var(--brand)]"}`}
                  initial={false}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: reduced ? 0 : 0.35 }}
                />
              </div>
              <p className={`mt-1 truncate text-[10px] ${done ? "text-zinc-800" : "text-zinc-400"}`}>
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
