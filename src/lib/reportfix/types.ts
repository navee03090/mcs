export const DEPARTMENTS = [
  "EE",
  "CSE",
  "IS",
  "Library",
  "Cafeteria",
  "Labs",
] as const;

export type Department = (typeof DEPARTMENTS)[number];
export type Role = "student" | "staff" | "admin";
export type Priority = "critical" | "high" | "medium" | "low";
export type IssueStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "reopened"
  | "needs_clarification"
  | "confidential";

export type Profile = {
  id: string;
  name: string;
  role: Role;
  department: Department | null;
  trust_score: number;
  trust_reason: string;
  created_at: string;
  roll_number?: string | null;
  last_seen_at?: string | null;
};

export type CampusLocation = {
  id: string;
  name: string;
  building: string | null;
  department_hint: Department | null;
};

export type Issue = {
  id: string;
  title: string;
  canonical_summary: string;
  department: Department;
  location_id: string | null;
  location_text: string;
  priority: Priority;
  priority_reason: string;
  status: IssueStatus;
  me_too_count: number;
  crowd_weight: number;
  crowd_score: number;
  base_priority: Priority;
  priority_explanation: string;
  category: string;
  is_confidential: boolean;
  reporter_ids: string[];
  rules_fired: string[];
  injection: boolean;
  tally: string;
  verification_open: boolean;
  brigade_flag: boolean;
  brigade_reason: string;
  created_at: string;
  updated_at: string;
};

export type Report = {
  id: string;
  issue_id: string | null;
  reporter_id: string;
  raw_text: string;
  ai_department: Department | null;
  ai_location: string | null;
  ai_priority: Priority | null;
  ai_reason: string | null;
  ai_category: string | null;
  is_confidential: boolean;
  needs_clarification: boolean;
  clarification_question: string | null;
  injection: boolean;
  created_at: string;
};

export type IssueVote = {
  id: string;
  issue_id: string;
  voter_id: string;
  vote: "confirm" | "dispute";
  created_at: string;
};

export type TrustEvent = {
  id: string;
  profile_id: string;
  delta: number;
  reason: string;
  issue_id: string | null;
  created_at: string;
};

export type TriageResult = {
  department: Department | null;
  location_id: string | null;
  location_text: string;
  location_known: boolean;
  priority: Priority;
  priority_reason: string;
  title: string;
  canonical_summary: string;
  is_confidential: boolean;
  is_safety: boolean;
  needs_clarification: boolean;
  clarification_question: string | null;
  category: string;
  base_priority: Priority;
  injection: boolean;
  rules_fired: string[];
  crowd_score: number;
};
