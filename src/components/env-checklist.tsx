"use client";

import { useEffect, useState } from "react";

const checks = [
  ["NEXT_PUBLIC_SUPABASE_URL", "supabaseUrl"],
  ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY)", "supabasePublishableKey"],
  ["SUPABASE_SECRET_KEY (or SERVICE_ROLE)", "supabaseServiceRoleKey"],
  ["AI_API_KEY / GEMINI (Coarena)", "geminiApiKey"],
] as const;

type EnvFlags = Record<(typeof checks)[number][1], boolean>;

export function EnvChecklist() {
  const [env, setEnv] = useState<EnvFlags | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Health check failed (${res.status})`);
        return res.json() as Promise<{ env: EnvFlags }>;
      })
      .then((data) => setEnv(data.env))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, []);

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!env) {
    return <p className="text-sm text-zinc-500">Checking env…</p>;
  }

  return (
    <ul className="space-y-2">
      {checks.map(([label, key]) => {
        const ok = env[key];
        return (
          <li
            key={key}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
            <span
              className={
                ok
                  ? "rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  : "rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
              }
            >
              {ok ? "set" : "missing"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
