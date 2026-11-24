"use client";

import { motion, useReducedMotion } from "framer-motion";

export function TrustGauge({ score }: { score: number }) {
  const reduced = useReducedMotion();
  const safe = Math.max(0, Math.min(100, score));
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
        <motion.circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={false}
          animate={{ strokeDashoffset: circ - (safe / 100) * circ }}
          transition={{ duration: reduced ? 0 : 0.5 }}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span className="text-sm font-semibold tabular-nums">{safe}</span>
    </span>
  );
}
