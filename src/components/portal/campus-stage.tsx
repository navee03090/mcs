"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BRAND_PHOTOS } from "@/lib/brand";
import { useCalmMotion } from "@/lib/motion";

const MOTES = [
  { left: "8%", bottom: "12%", delay: "0s", duration: "13s" },
  { left: "18%", bottom: "28%", delay: "1.4s", duration: "11s" },
  { left: "32%", bottom: "8%", delay: "2.2s", duration: "15s" },
  { left: "46%", bottom: "22%", delay: "0.6s", duration: "12s" },
  { left: "61%", bottom: "14%", delay: "2.8s", duration: "14s" },
  { left: "74%", bottom: "30%", delay: "1s", duration: "10s" },
  { left: "86%", bottom: "10%", delay: "3.1s", duration: "16s" },
  { left: "92%", bottom: "24%", delay: "1.8s", duration: "12s" },
];

export function CampusStage({
  children,
  className = "min-h-screen",
}: {
  children: React.ReactNode;
  className?: string;
}) {
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
    const timer = setInterval(() => setIndex((n) => (n + 1) % BRAND_PHOTOS.length), 7000);
    return () => clearInterval(timer);
  }, [calm, paused]);

  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      {BRAND_PHOTOS.map((photo, photoIndex) => (
        <div
          key={photo.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${photoIndex === index || calm ? "opacity-100" : "opacity-0"}`}
          aria-hidden={photoIndex !== index}
        >
          <Image
            src={photo.src}
            alt={photoIndex === index ? photo.alt : ""}
            fill
            sizes="100vw"
            className={`object-cover ${calm ? "" : "kenburns"}`}
            priority={photoIndex === 0}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-[#140c0c]/80 via-[#140c0c]/55 to-[#140c0c]/80" />
      {!calm && !paused && <div className="ambient pointer-events-none absolute inset-0" aria-hidden="true" />}
      {!calm &&
        !paused &&
        MOTES.map((mote) => (
          <span
            key={mote.left}
            className="mote pointer-events-none"
            style={{
              left: mote.left,
              bottom: mote.bottom,
              animationDelay: mote.delay,
              animationDuration: mote.duration,
            }}
            aria-hidden="true"
          />
        ))}
      <div className="relative z-10 flex h-full min-h-[inherit] flex-col">{children}</div>
    </div>
  );
}
