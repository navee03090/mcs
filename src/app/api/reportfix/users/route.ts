import { NextResponse } from "next/server";
import { checkCredentials } from "@/lib/reportfix/credentials";
import { createStudent, ensureSeeded, listProfiles, noteSignIn } from "@/lib/reportfix/store";
import type { Role } from "@/lib/reportfix/types";

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
      department?: string;
      action?: string;
      userId?: string;
      username?: string;
      password?: string;
      role?: Role;
    };
    if (body.action === "credentials") {
      const checked = checkCredentials(body.username ?? "", body.password ?? "", body.role ?? "student");
      if (!checked.ok) {
        return NextResponse.json({ ok: false, error: checked.error }, { status: checked.status });
      }
      const user = await noteSignIn(checked.userId);
      return NextResponse.json({ ok: true, user });
    }
    if (body.action === "sign-in") {
      if (!body.userId) {
        return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
      }
      const user = await noteSignIn(body.userId, body.department);
      return NextResponse.json({ ok: true, user });
    }
    const user = await createStudent(body.name ?? "", body.rollNumber, body.department);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message.startsWith("Choose") || message === "Unknown user" ? 400 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
