import { NextResponse } from "next/server";
import {
  ensureSeeded,
  getProfile,
  listIssues,
  listReports,
  updateIssueStatus,
} from "@/lib/reportfix/store";
import type { IssueStatus } from "@/lib/reportfix/types";

export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
    }
    const viewer = await getProfile(userId);
    if (!viewer) {
      return NextResponse.json({ ok: false, error: "Unknown user" }, { status: 404 });
    }
    const [issues, reports] = await Promise.all([
      listIssues(viewer),
      listReports(viewer),
    ]);
    return NextResponse.json({ ok: true, viewer, issues, reports });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      issueId?: string;
      status?: IssueStatus;
    };
    if (!body.userId || !body.issueId || !body.status) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }
    const issue = await updateIssueStatus(body.userId, body.issueId, body.status);
    return NextResponse.json({ ok: true, issue });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 400 },
    );
  }
}
