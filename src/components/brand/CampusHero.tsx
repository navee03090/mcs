"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useCalmMotion } from "@/lib/motion";
import { useEffect, useState } from "react";
import { BRAND_PHOTOS } from "@/lib/brand";
import { McsMark } from "./McsMark";

export function CampusHero() {
  const calm = useCalmMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (calm || paused) return;
    const timer = setInterval(() => setIndex((n) => (n + 1) % BRAND_PHOTOS.length), 6000);
    return () => clearInterval(timer);
  }, [calm, paused]);

  return (
    <section className="relative isolate min-h-[280px] overflow-hidden rounded-3xl border border-black/10">
      {BRAND_PHOTOS.map((photo, photoIndex) => (
        <div
          key={photo.src}
          className={`absolute inset-0 transition-opacity duration-700 ${photoIndex === index || calm ? "opacity-100" : "opacity-0"}`}
          aria-hidden={photoIndex !== index}
        >
          <Image
            src={photo.src}
            alt={photoIndex === index ? photo.alt : ""}
            fill
            sizes="(min-width: 1024px) 1100px, 100vw"
            className={`object-cover ${calm ? "" : "kenburns"}`}
            priority={photoIndex === 0}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#140c0c]/88 via-[#140c0c]/72 to-[#140c0c]/35" />
      {!calm && !paused && <div className="ambient pointer-events-none absolute inset-0" aria-hidden="true" />}
      <div className="relative flex min-h-[280px] flex-col justify-end gap-3 p-6 text-white sm:p-8">
        <motion.div
          initial={calm ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          <McsMark size={72} priority />
        </motion.div>
        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f3d48a]"
          initial={calm ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
        >
          Military College of Signals
        </motion.p>
        <motion.h1
          className="font-display text-4xl font-semibold tracking-tight sm:text-5xl"
          initial={calm ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
        >
          ReportFix
        </motion.h1>
        <motion.p
          className="max-w-xl text-sm text-white/85 sm:text-base"
          initial={calm ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.35 }}
        >
          Report → AI triage → department → resolve → student confirm
        </motion.p>
      </div>
    </section>
  );
}
