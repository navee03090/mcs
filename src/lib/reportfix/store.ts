import { randomUUID } from "crypto";
import { loadState, resetState, saveState, withState } from "./db";
import { crowdPriorityBoost, shouldReopen } from "./rules";
import { similarIssue, triageReport } from "./triage";
import type {
  Issue,
  IssueStatus,
  IssueVote,
  Profile,
  Report,
  TrustEvent,
} from "./types";

export async function listProfiles() {
  const state = await loadState();
  return [...state.profiles].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProfile(id: string) {
  const state = await loadState();
  return state.profiles.find((p) => p.id === id) ?? null;
}

export async function createStudent(name: string) {
  return withState((state) => {
    const profile: Profile = {
      id: randomUUID(),
      name: name.trim() || `Student ${Date.now().toString().slice(-4)}`,
      role: "student",
      department: null,
      trust_score: 50,
      trust_reason: "New account — base trust 50",
      created_at: new Date().toISOString(),
    };
    state.profiles.push(profile);
    return profile;
  });
}

export async function listLocations() {
  const state = await loadState();
  return state.locations;
}

export async function listIssues(viewer: Profile) {
  const state = await loadState();
  let issues = [...state.issues].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );

  if (viewer.role === "student") {
    issues = issues.filter(
      (i) => !i.is_confidential || i.reporter_ids.includes(viewer.id),
    );
  } else if (viewer.role === "staff") {
    issues = issues.filter(
      (i) =>
        !i.is_confidential &&
        i.department === viewer.department &&
        i.status !== "needs_clarification",
    );
  }
  return issues;
}

export async function listReports(viewer: Profile) {
  const state = await loadState();
  let reports = [...state.reports].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  if (viewer.role === "student") {
    reports = reports.filter(
      (r) => !r.is_confidential || r.reporter_id === viewer.id,
    );
  } else if (viewer.role === "staff") {
    reports = reports.filter((r) => !r.is_confidential);
  }
  return reports;
}

export async function submitReport(reporterId: string, rawText: string) {
  const reporter = await getProfile(reporterId);
  if (!reporter || reporter.role !== "student") {
    throw new Error("Only students can submit reports");
  }

  const triage = await triageReport(rawText);
  const reportId = randomUUID();
  const now = new Date().toISOString();

  return withState((state) => {
    if (
      triage.needs_clarification ||
      !triage.location_known ||
      !triage.department
    ) {
      const report: Report = {
        id: reportId,
        issue_id: null,
        reporter_id: reporterId,
        raw_text: rawText,
        ai_department: triage.department,
        ai_location: triage.location_text,
        ai_priority: triage.priority,
        ai_reason: triage.priority_reason,
        ai_category: triage.category,
        is_confidential: triage.is_confidential,
        needs_clarification: true,
        clarification_question: triage.clarification_question,
        created_at: now,
      };
      state.reports.unshift(report);
      return { report, issue: null as Issue | null, triage, grouped: false };
    }

    const candidates = state.issues.filter((i) => {
      if (triage.is_confidential || i.is_confidential) return false;
      if (i.status === "needs_clarification") return false;
      return similarIssue(
        {
          canonical_summary: triage.canonical_summary,
          location_text: triage.location_text,
          location_id: triage.location_id,
        },
        i,
      );
    });

    let issue: Issue;
    let grouped = false;

    if (candidates[0]) {
      grouped = true;
      issue = candidates[0];
      if (!issue.reporter_ids.includes(reporterId)) {
        issue.reporter_ids.push(reporterId);
      }
      issue.me_too_count = issue.reporter_ids.length;
      issue.crowd_weight += Math.max(10, reporter.trust_score);
      issue.priority = crowdPriorityBoost({
        meTooCount: issue.me_too_count,
        crowdWeight: issue.crowd_weight,
        base: issue.priority === "critical" ? "critical" : triage.priority,
      });
      issue.priority_reason = `${issue.priority_reason} · crowd update`;
      issue.updated_at = now;
      if (issue.status === "resolved") issue.status = "reopened";
    } else {
      issue = {
        id: randomUUID(),
        title: triage.title,
        canonical_summary: triage.canonical_summary,
        department: triage.department,
        location_id: triage.location_id,
        location_text: triage.location_text,
        priority: triage.priority,
        priority_reason: triage.priority_reason,
        status: triage.is_confidential ? "confidential" : "open",
        me_too_count: 1,
        crowd_weight: Math.max(10, reporter.trust_score),
        is_confidential: triage.is_confidential,
        reporter_ids: [reporterId],
        created_at: now,
        updated_at: now,
      };
      state.issues.unshift(issue);
    }

    const report: Report = {
      id: reportId,
      issue_id: issue.id,
      reporter_id: reporterId,
      raw_text: rawText,
      ai_department: triage.department,
      ai_location: triage.location_text,
      ai_priority: triage.priority,
      ai_reason: triage.priority_reason,
      ai_category: triage.category,
      is_confidential: triage.is_confidential,
      needs_clarification: false,
      clarification_question: null,
      created_at: now,
    };
    state.reports.unshift(report);
    return { report, issue, triage, grouped };
  });
}

export async function updateIssueStatus(
  staffId: string,
  issueId: string,
  status: IssueStatus,
) {
  return withState((state) => {
    const staff = state.profiles.find((p) => p.id === staffId);
    if (!staff || (staff.role !== "staff" && staff.role !== "admin")) {
      throw new Error("Only staff/admin can update status");
    }
    const issue = state.issues.find((i) => i.id === issueId);
    if (!issue) throw new Error("Issue not found");
    if (
      staff.role === "staff" &&
      (issue.department !== staff.department || issue.is_confidential)
    ) {
      throw new Error("Staff can only update their department queue");
    }
    issue.status = status;
    issue.updated_at = new Date().toISOString();
    return issue;
  });
}

export async function castVote(
  voterId: string,
  issueId: string,
  vote: "confirm" | "dispute",
) {
  return withState((state) => {
    const voter = state.profiles.find((p) => p.id === voterId);
    if (!voter || voter.role !== "student") throw new Error("Students only");
    const issue = state.issues.find((i) => i.id === issueId);
    if (!issue) throw new Error("Issue not found");
    if (issue.status !== "resolved" && issue.status !== "reopened") {
      throw new Error("Voting opens after staff marks resolved");
    }
    if (!issue.reporter_ids.includes(voterId)) {
      throw new Error("Only affected students may vote");
    }

    const existing = state.votes.find(
      (v) => v.issue_id === issueId && v.voter_id === voterId,
    );
    if (existing) existing.vote = vote;
    else {
      const row: IssueVote = {
        id: randomUUID(),
        issue_id: issueId,
        voter_id: voterId,
        vote,
        created_at: new Date().toISOString(),
      };
      state.votes.push(row);
    }

    let confirmWeight = 0;
    let disputeWeight = 0;
    for (const v of state.votes.filter((x) => x.issue_id === issueId)) {
      const p = state.profiles.find((pr) => pr.id === v.voter_id);
      const w = p?.trust_score ?? 40;
      if (v.vote === "confirm") confirmWeight += w;
      else disputeWeight += w;
    }

    const reopened = shouldReopen({ confirmWeight, disputeWeight });
    if (reopened) {
      issue.status = "reopened";
      issue.updated_at = new Date().toISOString();
      if (vote === "dispute") adjustTrustInState(state, voterId, 2, "Participated in reopen vote");
    } else if (vote === "confirm") {
      adjustTrustInState(state, voterId, 1, "Confirmed a resolved fix");
    }

    return { confirmWeight, disputeWeight, reopened };
  });
}

function adjustTrustInState(
  state: Awaited<ReturnType<typeof loadState>>,
  profileId: string,
  delta: number,
  reason: string,
) {
  if (!delta) return;
  const profile = state.profiles.find((p) => p.id === profileId);
  if (!profile) return;
  profile.trust_score = Math.max(0, Math.min(100, profile.trust_score + delta));
  profile.trust_reason = `${reason} (Δ${delta > 0 ? "+" : ""}${delta}) → ${profile.trust_score}`;
  const event: TrustEvent = {
    id: randomUUID(),
    profile_id: profileId,
    delta,
    reason,
    created_at: new Date().toISOString(),
  };
  state.trust_events.unshift(event);
}

export async function adminSummary() {
  const state = await loadState();
  const list = state.issues;
  const open = list.filter((i) => i.status === "open" || i.status === "reopened");
  const critical = list.filter((i) => i.priority === "critical");
  const byDept: Record<string, number> = {};
  for (const d of ["EE", "CSE", "IS", "Library", "Cafeteria", "Labs"]) {
    byDept[d] = list.filter((i) => i.department === d && i.status !== "resolved").length;
  }

  const { runGeminiText } = await import("@/lib/ai/client");
  const { text } = await runGeminiText({
    system: "You write terse campus admin briefings.",
    prompt: `Write a 4-bullet admin briefing. Be factual and short.\n${JSON.stringify(
      { open: open.length, critical: critical.length, byDept, top: list.slice(0, 8) },
    )}`,
  });
  return { text, open: open.length, critical: critical.length, byDept };
}

export async function resetAllData() {
  await saveState(resetState());
  return { ok: true };
}

export async function ensureSeeded() {
  await loadState();
}
