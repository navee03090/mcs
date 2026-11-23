import { EnvChecklist } from "@/components/env-checklist";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-zinc-500">
          CodeQuest 2026 · AI Hackathon shell
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Ready for kickoff
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Empty Next.js + Supabase + Vercel starter. No product features yet —
          build the solution only after the problem statement is revealed.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Env checklist
        </h2>
        <EnvChecklist />
      </section>

      <section className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Health:{" "}
          <a className="underline underline-offset-4" href="/api/health">
            /api/health
          </a>
        </p>
        <p>
          AI stub:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-900">
            POST /api/ai
          </code>
        </p>
        <p>
          Copy{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-900">
            .env.example
          </code>{" "}
          →{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-900">
            .env.local
          </code>
          , then{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-900">
            npm run dev
          </code>
          .
        </p>
      </section>
    </main>
  );
}
