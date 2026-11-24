"use client";

import Image from "next/image";
import { LOGO } from "@/lib/brand";

export function McsMark({ size = 40, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#140c0c]"
      style={{ width: size, height: size }}
    >
      <Image
        src={LOGO.src}
        alt={LOGO.alt}
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
