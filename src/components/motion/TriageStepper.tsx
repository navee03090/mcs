"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = ["Reading", "Understanding", "Routing", "Priority"] as const;

export function TriageStepper({
  running,
  visible,
}: {
  running: boolean;
  visible: boolean;
}) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!running) {
      setStep(STEPS.length);
      return;
    }
    setStep(0);
    if (reduced) return;
    const timer = setInterval(() => {
      setStep((current) => Math.min(STEPS.length - 1, current + 1));
    }, 160);
    return () => clearInterval(timer);
  }, [running, reduced]);

  if (!visible) return null;

  return (
    <ol className="grid grid-cols-4 gap-2 text-[11px] font-medium" aria-label="AI triage">
      {STEPS.map((label, index) => {
        const on = index <= step || !running;
        return (
          <li key={label} className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
              <motion.div
                className="h-full bg-[var(--brand)]"
                initial={false}
                animate={{ width: on ? "100%" : "0%" }}
                transition={{ duration: reduced ? 0 : 0.25 }}
              />
            </div>
            <span className={on ? "text-[var(--brand)]" : "text-zinc-400"}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
