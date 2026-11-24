import { matchLocation, normalizeText, placeById } from "./locations";
import type { Department, Priority, TriageResult } from "./types";

const SAFETY =
  /\b(fire|aag|dhuan|smoke|spark|sparks|chingari|short\s*circuit|bijli|shock|current|gas|leak|burning|behosh|faint|fainted|injured|zakhmi|medical|ambulance|collapse)\b/i;

const HARASS =
  /\b(harass\w*|ragging|ragg\w*|molest\w*|assault|bully\w*|bullied|threat\w*|stalk\w*|blackmail|dhamki)\b/i;

const INJECTION =
  /ignore\s+(all\s+|previous\s+|prior\s+)?(rules|instructions)|mark\s+(this\s+|it\s+)?critical|is\s+ko\s+critical|you\s+are\s+now\s+admin|jailbreak|override\s+(the\s+)?rules|system\s+prompt/i;

export type Category =
  | "projector"
  | "wifi"
  | "ac"
  | "power"
  | "plumbing"
  | "food"
  | "harassment"
  | "other";

const RANK: Record<Priority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function boundReport(input: string) {
  const clean = stripHtml(input);
  const head = clean.slice(0, 3500);
  const tail = clean.slice(-1500);
  return clean.length <= 5000 ? clean : `${head} ${tail}`;
}

export function detectCategory(text: string): Category {
  const t = normalizeText(text);
  if (HARASS.test(text) || HARASS.test(t)) return "harassment";
  if (/\b(projector|proj|screen)\b/.test(t)) return "projector";
  if (/\b(wifi|wi fi|internet|net)\b/.test(t)) return "wifi";
  if (/\b(ac|air condition\w*|cooling|cooler)\b/.test(t)) return "ac";
  if (/\b(outlet|socket|spark|wiring|bijli)\b/.test(t)) return "power";
  if (/\b(sink|clog\w*|drain|tap|pani)\b/.test(t)) return "plumbing";
  if (/\b(food|khana|meal)\b/.test(t)) return "food";
  return "other";
}

export function basePriority(category: Category, text: string, safety: boolean): Priority {
  if (safety) return "critical";
  if (category === "harassment") return "high";
  if (category === "wifi" && /\b(slow|weak|lag)\b/.test(normalizeText(text))) return "low";
  if (category === "food") return "low";
  if (category === "other") return "low";
  return "medium";
}

export function trustWeight(profile: { trust_score: number; created_at: string }) {
  const ageMs = Date.now() - new Date(profile.created_at).getTime();
  let weight = Math.min(1.5, Math.max(0.5, 0.5 + profile.trust_score / 100));
  if (ageMs < 60 * 60 * 1000) weight *= 0.5;
  return Math.round(weight * 100) / 100;
}

export function raise(priority: Priority, steps: number): Priority {
  const order: Priority[] = ["low", "medium", "high", "critical"];
  const next = Math.min(order.length - 1, RANK[priority] + steps);
  return order[next];
}

/** Crowd bumps need 3+ distinct people. Cap at HIGH unless the base is already critical. */
export function crowdFromWeights(weights: number[], base: Priority) {
  const crowd_score =
    Math.round(weights.reduce((sum, w) => sum + w, 0) * 100) / 100;
  const people = weights.length;
  let steps = 0;
  if (people >= 6) steps = 2;
  else if (people >= 3) steps = 1;
  let final = base === "critical" ? "critical" : raise(base, steps);
  if (final === "critical" && base !== "critical") final = "high";
  const explanation =
    people < 3
      ? `Base ${base}. Crowd score ${crowd_score} from ${people} student — no bump (need 3). Final ${final}.`
      : `Base ${base}. Crowd score ${crowd_score} from ${people} students (+${steps}). Final ${final}.`;
  return { final: final as Priority, crowd_score, explanation, steps };
}

export function shouldReopen(params: {
  confirmWeight: number;
  disputeWeight: number;
  distinctDisputers: number;
  affectedCount: number;
}) {
  const total = params.confirmWeight + params.disputeWeight;
  if (total <= 0) return false;
  const neededDisputers = params.affectedCount <= 1 ? 1 : 2;
  return (
    params.distinctDisputers >= neededDisputers &&
    params.disputeWeight >= total * 0.5
  );
}

export function tallyText(params: {
  confirmWeight: number;
  disputeWeight: number;
  distinctDisputers: number;
  affectedCount: number;
  reopened: boolean;
}) {
  const total = params.confirmWeight + params.disputeWeight;
  const pct = total ? Math.round((params.disputeWeight / total) * 100) : 0;
  return `disputes ${params.disputeWeight} / total ${total} (${pct}%) · disputers ${params.distinctDisputers} / affected ${params.affectedCount} → ${params.reopened ? "reopen" : "stay"}`;
}

/** Code decides. The model is not consulted. */
export function decideReport(rawInput: string, locationOverride?: string | null): TriageResult {
  const raw = boundReport(rawInput);
  const rules: string[] = [];
  const empty = !normalizeText(raw);

  if (empty) {
    rules.push("empty-text");
    return clarify("Empty report. Describe the problem and pick a campus location.", rules);
  }

  const injection = INJECTION.test(raw);
  if (injection) rules.push("injection-ignored");

  const safety = SAFETY.test(raw);
  if (safety) rules.push("safety-critical");

  const harassment = HARASS.test(raw);
  if (harassment) rules.push("confidential-harassment");

  const category = detectCategory(raw);
  rules.push(`category:${category}`);

  const loc = locationOverride
    ? (() => {
        const place = placeById(locationOverride);
        return place
          ? {
              id: place.id,
              name: place.name,
              known: true,
              department_hint: place.department_hint,
            }
          : matchLocation(raw);
      })()
    : matchLocation(raw);

  if (loc.known) rules.push(`location:${loc.id}`);
  else rules.push("location-unknown");

  const priority = basePriority(category, raw, safety);
  rules.push("tone-ignored");
  rules.push(`base-priority:${priority}`);

  if (!loc.known || !loc.id) {
    const result = clarify(
      "That place is not on the campus list (or no place was named). Pick a location to continue.",
      rules,
    );
    result.injection = injection;
    result.is_safety = safety;
    result.is_confidential = harassment;
    result.category = category;
    result.base_priority = priority;
    result.priority = priority;
    result.priority_reason = reasonFor(category, null, priority, safety, injection);
    result.title = titleFor(category, null);
    return result;
  }

  const department: Department | null = harassment
    ? null
    : (loc.department_hint ?? "Labs");

  return {
    department: harassment ? null : department,
    location_id: loc.id,
    location_text: loc.name ?? loc.id,
    location_known: true,
    priority,
    base_priority: priority,
    priority_reason: reasonFor(category, loc.name, priority, safety, injection),
    title: titleFor(category, loc.name),
    canonical_summary: `${category} at ${loc.id}`,
    is_confidential: harassment,
    is_safety: safety,
    needs_clarification: false,
    clarification_question: null,
    category,
    injection,
    rules_fired: rules,
    crowd_score: 0,
  };
}

function clarify(question: string, rules: string[]): TriageResult {
  return {
    department: null,
    location_id: null,
    location_text: "Unknown",
    location_known: false,
    priority: "low",
    base_priority: "low",
    priority_reason: "Not routed — location needs clarification.",
    title: "Needs clarification",
    canonical_summary: "unrouted",
    is_confidential: false,
    is_safety: false,
    needs_clarification: true,
    clarification_question: question,
    category: "other",
    injection: false,
    rules_fired: rules,
    crowd_score: 0,
  };
}

function titleFor(category: string, place: string | null) {
  const label = category === "other" ? "Campus issue" : category;
  return place ? `${label} at ${place}` : label;
}

function reasonFor(
  category: string,
  place: string | null,
  priority: Priority,
  safety: boolean,
  injection: boolean,
) {
  const where = place ? ` at ${place}` : "";
  const safetyNote = safety ? " Safety lexicon forces critical regardless of tone." : "";
  const injectNote = injection
    ? " Instructions inside the report were ignored."
    : " Tone and the word urgent were ignored.";
  return `${category} issue${where}; impact priority ${priority}.${safetyNote}${injectNote}`;
}
