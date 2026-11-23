import { NextResponse } from "next/server";

/**
 * Empty AI endpoint shell — implement at kickoff after the problem statement drops.
 * Keep model keys server-side only (GEMINI_API_KEY / OPENAI_API_KEY).
 */
export async function POST() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  if (!hasGemini && !hasOpenAI) {
    return NextResponse.json(
      {
        ok: false,
        error: "No AI API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "AI route ready. Wire your prompt + model call here during the hackathon.",
    providers: {
      gemini: hasGemini,
      openai: hasOpenAI,
    },
  });
}
