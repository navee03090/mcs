"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function CountUp({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const controls = animate(shown, value, {
      duration: 0.4,
      onUpdate: (next) => setShown(Math.round(next)),
    });
    return () => controls.stop();
    // shown is the start point; we only restart when the target changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);

  return <span className="inline-block tabular-nums">{shown}</span>;
}
