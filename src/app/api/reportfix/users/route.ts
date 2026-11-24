import { NextResponse } from "next/server";
import { createStudent, ensureSeeded, listProfiles } from "@/lib/reportfix/store";

export async function GET() {
  try {
    await ensureSeeded();
    const users = await listProfiles();
    return NextResponse.json({ ok: true, users });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as { name?: string };
    const user = await createStudent(body.name ?? "");
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
