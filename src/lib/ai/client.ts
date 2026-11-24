import OpenAI from "openai";

/** Gemini via Coarena (OpenAI-compatible). Server-only. */
export function getAiConfig() {
  const apiKey =
    process.env.AI_API_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.OPENAI_API_KEY ??
    "";
  const baseURL = process.env.AI_BASE_URL ?? "https://coarena.ai/api/v1";
  const model = process.env.AI_MODEL ?? "gemini-3-8-flash";

  return { apiKey, baseURL, model };
}

export function createAiClient() {
  const { apiKey, baseURL } = getAiConfig();

  if (!apiKey) {
    throw new Error("Missing AI_API_KEY / GEMINI_API_KEY");
  }

  return new OpenAI({ apiKey, baseURL });
}

export async function runGeminiText(params: {
  prompt: string;
  system?: string;
}) {
  const client = createAiClient();
  const { model } = getAiConfig();

  const completion = await client.chat.completions.create(
    {
      model,
      messages: [
        ...(params.system
          ? [{ role: "system" as const, content: params.system }]
          : []),
        { role: "user" as const, content: params.prompt },
      ],
    },
    { signal: AbortSignal.timeout(8000) },
  );

  return {
    model,
    text: completion.choices[0]?.message?.content ?? "",
    usage: completion.usage ?? null,
  };
}
