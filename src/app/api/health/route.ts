import { NextResponse } from "next/server";
import { envStatus } from "@/lib/env";

export async function GET() {
  const env = envStatus();

  return NextResponse.json({
    ok: true,
    service: "codequest-ai",
    time: new Date().toISOString(),
    env: {
      supabaseUrl: env.supabaseUrl,
      supabasePublishableKey: env.supabasePublishableKey,
      supabaseServiceRoleKey: env.supabaseServiceRoleKey,
      geminiApiKey: env.geminiApiKey,
      openaiApiKey: env.openaiApiKey,
      aiModel: env.aiModel,
    },
  });
}
