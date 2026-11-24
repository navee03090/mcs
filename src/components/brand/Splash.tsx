"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { McsMark } from "./McsMark";

export function Splash() {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (reduced) return;
    if (sessionStorage.getItem("rf-splash")) return;
    sessionStorage.setItem("rf-splash", "1");
    setShow(true);
    const timer = setTimeout(() => setShow(false), 900);
    return () => clearTimeout(timer);
  }, [reduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[#140c0c]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <McsMark size={96} priority />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
