import { NextResponse } from "next/server";
import { adminSummary, ensureSeeded, getProfile } from "@/lib/reportfix/store";

export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const userId = new URL(request.url).searchParams.get("userId");
    const viewer = userId ? await getProfile(userId) : null;
    if (!viewer || viewer.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });
    }
    const summary = await adminSummary();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
