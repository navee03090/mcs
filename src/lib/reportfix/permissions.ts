import type { Issue, Profile, Report } from "./types";

export function canSee(issue: Issue, user: Profile) {
  if (issue.is_confidential) {
    if (user.role === "admin") return true;
    return user.role === "student" && issue.reporter_ids.includes(user.id);
  }
  if (user.role === "staff") return issue.department === user.department;
  return true;
}

export function presentIssue(issue: Issue): Issue {
  if (!issue.is_confidential) return issue;
  return { ...issue, reporter_ids: [] };
}

export function presentReport(report: Report, viewer: Profile): Report {
  if (!report.is_confidential) return report;
  if (viewer.role === "student" && report.reporter_id === viewer.id) return report;
  return { ...report, reporter_id: "anonymous" };
}
