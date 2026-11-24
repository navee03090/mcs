"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function PulseGlow({
  children,
  active,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (!active || reduced) return <span className={className}>{children}</span>;
  return (
    <motion.span
      className={className}
      animate={{ boxShadow: ["0 0 0 0 rgba(180,30,40,0.0)", "0 0 0 6px rgba(180,30,40,0.18)", "0 0 0 0 rgba(180,30,40,0.0)"] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.span>
  );
}
