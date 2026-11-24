import { NextResponse } from "next/server";
import { castVote, ensureSeeded } from "@/lib/reportfix/store";

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as {
      userId?: string;
      issueId?: string;
      vote?: "confirm" | "dispute";
    };
    if (!body.userId || !body.issueId || !body.vote) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }
    const result = await castVote(body.userId, body.issueId, body.vote);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 400 },
    );
  }
}
