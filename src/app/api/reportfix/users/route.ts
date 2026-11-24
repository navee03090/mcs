import { NextResponse } from "next/server";
import { createStudent, ensureSeeded, listProfiles, noteSignIn } from "@/lib/reportfix/store";

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
    const body = (await request.json()) as {
      name?: string;
      rollNumber?: string;
      action?: string;
      userId?: string;
    };
    if (body.action === "sign-in") {
      if (!body.userId) {
        return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
      }
      const user = await noteSignIn(body.userId);
      return NextResponse.json({ ok: true, user });
    }
    const user = await createStudent(body.name ?? "", body.rollNumber);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
