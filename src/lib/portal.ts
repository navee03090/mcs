import type { Issue, Role } from "@/lib/reportfix/types";

export type Desk = "student" | "staff" | "admin" | "judge";

export function deskPath(role: Role) {
  if (role === "staff") return "/staff" as const;
  if (role === "admin") return "/admin" as const;
  return "/student" as const;
}

export function loginPath(desk: "student" | "staff" | "admin") {
  if (desk === "staff") return "/staff/login" as const;
  if (desk === "admin") return "/admin/login" as const;
  return "/login" as const;
}

export function isMine(issue: Issue, userId: string) {
  return issue.is_confidential || issue.reporter_ids.includes(userId);
}

export function liveLabel(issue: Issue) {
  if (issue.is_confidential) return "Confidential";
  if (issue.status === "needs_clarification") return "Needs a place";
  if (issue.status === "reopened") return "Reopened";
  if (issue.status === "in_progress") return "In progress";
  if (issue.status === "resolved" && issue.verification_open) return "Awaiting your vote";
  if (issue.status === "resolved") return "Confirmed";
  return "Open";
}
