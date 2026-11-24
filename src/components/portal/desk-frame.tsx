"use client";

import Link from "next/link";
import { McsMark } from "@/components/brand/McsMark";
import { Toast } from "@/components/motion/Toast";
import { TrustGauge } from "@/components/motion/TrustGauge";
import type { Profile } from "@/lib/reportfix/types";

const ROLE_LABEL = {
  student: "Student",
  staff: "Department staff",
  admin: "Admin",
} as const;

export function DeskFrame({
  viewer,
  onSignOut,
  toast,
  kicker,
  children,
}: {
  viewer: Profile;
  onSignOut: () => void;
  toast: string | null;
  kicker: string;
  children: React.ReactNode;
}) {
  const seen = viewer.last_seen_at
    ? new Date(viewer.last_seen_at).toLocaleString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-5 px-4 py-6">
      <Toast message={toast} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <McsMark size={44} priority />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              {kicker}
            </p>
            <p className="font-display text-lg leading-none">ReportFix</p>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium">
            <span className="live-dot" aria-hidden="true" />
            Live
          </span>
          <TrustGauge score={viewer.trust_score} />
          <div className="text-xs">
            <p className="font-semibold">{viewer.name}</p>
            <p className="text-zinc-500">
              {ROLE_LABEL[viewer.role]}
              {viewer.department ? ` · ${viewer.department}` : ""}
              {viewer.roll_number ? ` · ${viewer.roll_number}` : ""}
            </p>
            {seen && <p className="text-zinc-400">Signed in {seen}</p>}
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="btn rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium"
          >
            Sign out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
