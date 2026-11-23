import { NextResponse } from "next/server";
import { getAiConfig, runGeminiText } from "@/lib/ai/client";

/**
 * Gemini (via Coarena) endpoint.
 * POST { "prompt": "..." , "system"?: "..." }
 * Keep keys server-side only.
 */
export async function POST(request: Request) {
  const { apiKey, model, baseURL } = getAiConfig();

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "No AI API key configured. Set AI_API_KEY or GEMINI_API_KEY.",
      },
      { status: 503 },
    );
  }

  let body: { prompt?: string; system?: string } = {};
  try {
    body = (await request.json()) as { prompt?: string; system?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({
      ok: true,
      ready: true,
      provider: "coarena",
      model,
      baseURL,
      message: "Send { \"prompt\": \"...\" } to run Gemini.",
    });
  }

  try {
    const result = await runGeminiText({
      prompt,
      system: body.system,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
