import { NextResponse } from "next/server";
import { ensureSeeded, submitReport } from "@/lib/reportfix/store";

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as {
      userId?: string;
      text?: string;
      locationId?: string;
    };
    if (!body.userId || !body.text?.trim()) {
      return NextResponse.json(
        { ok: false, error: "userId and text required" },
        { status: 400 },
      );
    }
    const result = await submitReport(
      body.userId,
      body.text.trim().slice(0, 5000),
      body.locationId,
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 400 },
    );
  }
}
