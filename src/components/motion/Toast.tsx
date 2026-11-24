"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function Toast({ message }: { message: string | null }) {
  const reduced = useReducedMotion();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            role="status"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl bg-[#1a120b] px-4 py-2 text-sm text-white shadow-lg"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
