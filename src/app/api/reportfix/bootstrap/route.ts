import { NextResponse } from "next/server";
import { ensureSeeded, resetAllData } from "@/lib/reportfix/store";

export async function GET() {
  try {
    await ensureSeeded();
    return NextResponse.json({ ok: true, seeded: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Bootstrap failed",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action === "reset") {
    try {
      await resetAllData();
      return NextResponse.json({ ok: true, reset: true });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Reset failed",
        },
        { status: 500 },
      );
    }
  }
  return GET();
}
