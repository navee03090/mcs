import { NextResponse } from "next/server";
import {
  closeVerification,
  ensureSeeded,
  getProfile,
  listConfidential,
  listIssues,
  listLedger,
  listLocations,
  listReports,
  markInvalid,
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
    const [issues, reports, locations, ledger, confidential] = await Promise.all([
      listIssues(viewer),
      listReports(viewer),
      listLocations(),
      listLedger(viewer.role === "admin" ? undefined : viewer.id),
      listConfidential(viewer),
    ]);
    return NextResponse.json({
      ok: true,
      viewer,
      issues,
      reports: reports.filter((r) => !r.is_confidential || r.reporter_id === viewer.id),
      locations,
      ledger,
      confidential,
    });
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
      action?: "status" | "spam" | "close_window";
    };
    if (!body.userId || !body.issueId) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }
    if (body.action === "spam") {
      const issue = await markInvalid(body.userId, body.issueId);
      return NextResponse.json({ ok: true, issue });
    }
    if (body.action === "close_window") {
      const issue = await closeVerification(body.userId, body.issueId);
      return NextResponse.json({ ok: true, issue });
    }
    if (!body.status) {
      return NextResponse.json({ ok: false, error: "Missing status" }, { status: 400 });
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
