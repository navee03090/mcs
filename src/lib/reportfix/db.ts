import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPUS_PLACES } from "./locations";
import { SEED_PROFILES } from "./seed";
import type {
  CampusLocation,
  Issue,
  IssueVote,
  Profile,
  Report,
  TrustEvent,
} from "./types";

const BUCKET = "reportfix";
const OBJECT = "state.json";

export type AppState = {
  profiles: Profile[];
  locations: CampusLocation[];
  issues: Issue[];
  reports: Report[];
  votes: IssueVote[];
  trust_events: TrustEvent[];
};

let memory: AppState | null = null;

function locations(): CampusLocation[] {
  return CAMPUS_PLACES.map((place) => ({
    id: place.id,
    name: place.name,
    building: place.building,
    department_hint: place.department_hint,
  }));
}

function sampleIssues(now: string): Issue[] {
  return [
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
      title: "Slow service at Main Cafeteria",
      canonical_summary: "food at cafeteria",
      department: "Cafeteria",
      location_id: "cafeteria",
      location_text: "Main Cafeteria",
      priority: "low",
      base_priority: "low",
      priority_reason: "Seeded minor complaint.",
      priority_explanation: "Base low. Crowd score 1 from 1 student — no bump. Final low.",
      category: "food",
      status: "open",
      me_too_count: 1,
      crowd_weight: 1,
      crowd_score: 1,
      is_confidential: false,
      reporter_ids: ["11111111-1111-1111-1111-111111111102"],
      rules_fired: ["seed"],
      injection: false,
      tally: "",
      verification_open: false,
      brigade_flag: false,
      brigade_reason: "",
      created_at: now,
      updated_at: now,
    },
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
      title: "Printer jam at IS Lab",
      canonical_summary: "other at is-lab",
      department: "IS",
      location_id: "is-lab",
      location_text: "IS Lab",
      priority: "medium",
      base_priority: "medium",
      priority_reason: "Seeded facilities issue.",
      priority_explanation: "Base medium. Crowd score 1 from 1 student — no bump. Final medium.",
      category: "other",
      status: "in_progress",
      me_too_count: 1,
      crowd_weight: 1,
      crowd_score: 1,
      is_confidential: false,
      reporter_ids: ["11111111-1111-1111-1111-111111111103"],
      rules_fired: ["seed"],
      injection: false,
      tally: "",
      verification_open: false,
      brigade_flag: false,
      brigade_reason: "",
      created_at: now,
      updated_at: now,
    },
  ];
}

function emptyState(): AppState {
  const now = "2025-10-01T00:00:00.000Z";
  return {
    profiles: structuredClone(SEED_PROFILES),
    locations: locations(),
    issues: sampleIssues(now),
    reports: [],
    votes: [],
    trust_events: SEED_PROFILES.map((profile) => ({
      id: `seed-trust-${profile.id}`,
      profile_id: profile.id,
      delta: 0,
      reason: profile.trust_reason,
      issue_id: null,
      created_at: profile.created_at,
    })),
  };
}

async function ensureBucket() {
  const sb = createAdminClient();
  await sb.storage.createBucket(BUCKET, { public: false }).catch(() => null);
}

export async function loadState(): Promise<AppState> {
  if (process.env.REPORTFIX_MEMORY === "1") {
    if (!memory) memory = emptyState();
    return structuredClone(memory);
  }

  await ensureBucket();
  const sb = createAdminClient();
  const { data, error } = await sb.storage.from(BUCKET).download(OBJECT);
  if (error || !data) {
    const state = emptyState();
    await saveState(state);
    return state;
  }
  const text = await data.text();
  return hydrate(JSON.parse(text) as AppState);
}

function hydrate(raw: AppState): AppState {
  return {
    profiles: raw.profiles ?? [],
    locations: raw.locations ?? [],
    votes: raw.votes ?? [],
    reports: (raw.reports ?? []).map((report) => ({
      ...report,
      injection: report.injection ?? false,
    })),
    trust_events: (raw.trust_events ?? []).map((event) => ({
      ...event,
      issue_id: event.issue_id ?? null,
    })),
    issues: (raw.issues ?? []).map((issue) => ({
      ...issue,
      crowd_score: issue.crowd_score ?? issue.crowd_weight ?? 0,
      base_priority: issue.base_priority ?? issue.priority ?? "low",
      priority_explanation:
        issue.priority_explanation ?? issue.priority_reason ?? "",
      category: issue.category ?? "other",
      rules_fired: issue.rules_fired ?? [],
      injection: issue.injection ?? false,
      tally: issue.tally ?? "",
      verification_open: issue.verification_open ?? false,
      brigade_flag: issue.brigade_flag ?? false,
      brigade_reason: issue.brigade_reason ?? "",
      reporter_ids: issue.reporter_ids ?? [],
    })),
  };
}

export async function saveState(state: AppState) {
  if (process.env.REPORTFIX_MEMORY === "1") {
    memory = structuredClone(state);
    return;
  }

  await ensureBucket();
  const sb = createAdminClient();
  const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
  const { error } = await sb.storage.from(BUCKET).upload(OBJECT, blob, {
    upsert: true,
    contentType: "application/json",
  });
  if (error) throw error;
}

export async function withState<T>(fn: (state: AppState) => Promise<T> | T): Promise<T> {
  const state = await loadState();
  const result = await fn(state);
  await saveState(state);
  return result;
}

export function resetState(): AppState {
  return emptyState();
}
