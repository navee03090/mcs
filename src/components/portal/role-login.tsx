"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { McsMark } from "@/components/brand/McsMark";
import { deskPath } from "@/lib/portal";
import { writeSession } from "@/lib/session";
import type { Profile, Role } from "@/lib/reportfix/types";
import { CampusStage } from "./campus-stage";

const COPY: Record<Role, { title: string; line: string; back: string }> = {
  student: {
    title: "Student desk",
    line: "Report a problem, watch it move, and confirm the fix.",
    back: "Sign in with your name, or create a student record.",
  },
  staff: {
    title: "Department desk",
    line: "Your queue is only your department.",
    back: "Choose the department you serve.",
  },
  admin: {
    title: "Campus admin",
    line: "Every department, confidential cases, and the trust ledger.",
    back: "Enter the oversight desk.",
  },
};

export function RoleLogin({ role }: { role: Role }) {
  const router = useRouter();
  const copy = COPY[role];
  const [users, setUsers] = useState<Profile[]>([]);
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/reportfix/users")
      .then((res) => res.json())
      .then((data: { ok?: boolean; error?: string; users?: Profile[] }) => {
        if (!data.ok) {
          setError(data.error || "Could not load people");
          return;
        }
        setUsers((data.users ?? []).filter((user) => user.role === role));
      })
      .catch(() => setError("Could not load people"));
  }, [role]);

  async function enter(userId: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/reportfix/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sign-in", userId }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; user?: Profile };
    setBusy(false);
    if (!data.ok || !data.user) {
      setError(data.error || "Sign-in failed");
      return;
    }
    writeSession(data.user.id);
    router.push(deskPath(data.user.role));
  }

  async function createStudent() {
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/reportfix/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), rollNumber: roll.trim() }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; user?: Profile };
    setBusy(false);
    if (!data.ok || !data.user) {
      setError(data.error || "Could not create the student");
      return;
    }
    writeSession(data.user.id);
    router.push("/student");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <CampusStage className="min-h-[240px] lg:min-h-screen">
        <div className="flex flex-1 flex-col justify-between p-6 text-white sm:p-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <McsMark size={48} priority />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d48a]">MCS</span>
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f3d48a]">ReportFix</p>
            <h1 className="font-display mt-2 text-4xl sm:text-5xl">{copy.title}</h1>
            <p className="mt-3 max-w-md text-sm text-white/80">{copy.line}</p>
          </div>
        </div>
      </CampusStage>

      <main className="flex flex-col justify-center bg-[var(--background)] px-6 py-10 sm:px-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Sign in</p>
        <h2 className="font-display mt-2 text-3xl text-[#140c0c]">{copy.back}</h2>

        {error && (
          <p className="mt-4 rounded-xl border border-[var(--brand-soft)] bg-white px-3 py-2 text-sm text-[var(--brand)]">
            {error}
          </p>
        )}

        <ul className="mt-6 space-y-2">
          {users.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void enter(user.id)}
                className="btn flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-left"
              >
                <span>
                  <span className="block font-semibold">{user.name}</span>
                  <span className="text-xs text-zinc-500">
                    {user.department ? user.department : user.roll_number ? `Roll ${user.roll_number}` : "Trust"} ·{" "}
                    {user.trust_score}
                  </span>
                </span>
                <span className="text-sm font-semibold text-[var(--brand)]">Enter</span>
              </button>
            </li>
          ))}
          {!users.length && !error && <li className="text-sm text-zinc-500">Loading people…</li>}
        </ul>

        {role === "student" && (
          <form
            className="mt-8 space-y-3 border-t border-black/10 pt-6"
            onSubmit={(event) => {
              event.preventDefault();
              void createStudent();
            }}
          >
            <p className="text-sm font-semibold">New student</p>
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              placeholder="Roll number"
              value={roll}
              onChange={(event) => setRoll(event.target.value)}
            />
            <button
              type="submit"
              disabled={busy}
              className="btn rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Create and enter
            </button>
          </form>
        )}

        <Link href="/" className="mt-8 text-sm text-zinc-600 underline-offset-4 hover:underline">
          Back to the campus
        </Link>
      </main>
    </div>
  );
}
