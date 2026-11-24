"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { McsMark } from "@/components/brand/McsMark";
import { Splash } from "@/components/brand/Splash";
import { useCalmMotion } from "@/lib/motion";
import { deskPath } from "@/lib/portal";
import { readSession } from "@/lib/session";
import type { Profile } from "@/lib/reportfix/types";
import { CampusStage } from "./campus-stage";

const DOORS = [
  {
    href: "/login" as const,
    kicker: "01",
    title: "Student",
    body: "Report a problem, follow every issue you filed or joined, and vote when a fix is real.",
    meta: "English and Roman Urdu",
  },
  {
    href: "/staff/login" as const,
    kicker: "02",
    title: "Department staff",
    body: "See only your department’s queue and move those issues forward.",
    meta: "EE · CSE · IS · Library · Cafeteria · Labs",
  },
  {
    href: "/admin/login" as const,
    kicker: "03",
    title: "Admin",
    body: "Oversee every department, confidential cases, and the trust ledger.",
    meta: "Campus-wide",
  },
];

export function HomeGate() {
  const calm = useCalmMotion();
  const [continueAs, setContinueAs] = useState<Profile | null>(null);

  useEffect(() => {
    const session = readSession();
    if (!session) return;
    void fetch("/api/reportfix/users")
      .then((res) => res.json())
      .then((data: { ok?: boolean; users?: Profile[] }) => {
        const person = data.users?.find((user) => user.id === session);
        if (person) setContinueAs(person);
      })
      .catch(() => undefined);
  }, []);

  return (
    <CampusStage>
      <Splash />
      <header className="flex items-center justify-between px-5 py-5 text-white sm:px-8">
        <div className="flex items-center gap-3">
          <McsMark size={46} priority />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f3d48a]">
              Military College of Signals
            </p>
            <p className="font-display text-lg">ReportFix</p>
          </div>
        </div>
        <Link href="/judge" className="text-xs font-medium text-white/80 underline-offset-4 hover:underline">
          Judge desk
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 pb-12 pt-4 sm:px-8">
        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f3d48a]"
          initial={calm ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          CodeQuest 2026
        </motion.p>
        <motion.h1
          className="font-display mt-2 max-w-xl text-4xl text-white sm:text-6xl"
          initial={calm ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          Three desks. One campus record.
        </motion.h1>
        <motion.p
          className="mt-3 max-w-lg text-sm text-white/80 sm:text-base"
          initial={calm ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          Students report. Departments fix their own queue. Admin sees the whole college.
        </motion.p>

        {continueAs && (
          <Link
            href={deskPath(continueAs.role)}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#140c0c]"
          >
            Continue as {continueAs.name}
          </Link>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {DOORS.map((door, index) => (
            <motion.div
              key={door.href}
              initial={calm ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + index * 0.08, duration: 0.45 }}
            >
              <Link href={door.href} className="door card flex h-full min-h-56 flex-col p-5 text-[#140c0c]">
                <span className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)]">{door.kicker}</span>
                <h2 className="font-display mt-3 text-3xl">{door.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-zinc-700">{door.body}</p>
                <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-zinc-500">{door.meta}</p>
                <span className="mt-3 text-sm font-semibold text-[var(--brand)]">Enter</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </CampusStage>
  );
}
