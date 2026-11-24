import { createAdminClient } from "@/lib/supabase/admin";
import { SEED_LOCATIONS, SEED_PROFILES } from "./seed";
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

function emptyState(): AppState {
  return {
    profiles: structuredClone(SEED_PROFILES),
    locations: structuredClone(SEED_LOCATIONS),
    issues: [],
    reports: [],
    votes: [],
    trust_events: [],
  };
}

async function ensureBucket() {
  const sb = createAdminClient();
  await sb.storage.createBucket(BUCKET, { public: false }).catch(() => null);
}

export async function loadState(): Promise<AppState> {
  await ensureBucket();
  const sb = createAdminClient();
  const { data, error } = await sb.storage.from(BUCKET).download(OBJECT);
  if (error || !data) {
    const state = emptyState();
    await saveState(state);
    return state;
  }
  const text = await data.text();
  return JSON.parse(text) as AppState;
}

export async function saveState(state: AppState) {
  await ensureBucket();
  const sb = createAdminClient();
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const { error } = await sb.storage.from(BUCKET).upload(OBJECT, blob, {
    upsert: true,
    contentType: "application/json",
  });
  if (error) throw error;
}

export async function withState<T>(
  fn: (state: AppState) => Promise<T> | T,
): Promise<T> {
  const state = await loadState();
  const result = await fn(state);
  await saveState(state);
  return result;
}

export function resetState(): AppState {
  return emptyState();
}
