"use client";

import { AnimatePresence } from "framer-motion";
import { DeskFrame } from "@/components/portal/desk-frame";
import { IssueCard } from "@/components/portal/issue-card";
import type { DeskProps } from "./types";

export function StaffDesk(props: DeskProps) {
  const issues = (props.board?.issues ?? []).filter((issue) => !issue.is_confidential);

  return (
    <DeskFrame
      viewer={props.viewer}
      onSignOut={props.signOut}
      toast={props.toast}
      kicker={`${props.viewer.department ?? "Department"} queue`}
    >
      {props.msg && (
        <p className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">{props.msg}</p>
      )}
      <section className="card p-4">
        <h2 className="font-display text-3xl">{props.viewer.department} queue</h2>
        <p className="mb-4 text-sm text-zinc-600">
          Issues routed to {props.viewer.department}. Other departments stay off this desk.
        </p>
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
          <p className="rounded-2xl border border-dashed border-black/10 px-3 py-8 text-center text-sm text-zinc-500">
            The {props.viewer.department} queue is clear.
          </p>
        )}
      </section>
    </DeskFrame>
  );
}
