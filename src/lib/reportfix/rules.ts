import type { Priority, TriageResult } from "./types";

const SAFETY_RE =
  /\b(fire|spark|sparks|gas\s?leak|smoke|electric\s?shock|exposed\s?wire|short\s?circuit|medical|blood|injury|collapse|explosion|burning)\b/i;

const HARASS_RE =
  /\b(harass|harassment|ragging|ragg(?:ing)?|molest|assault|bully|bullying|threat(?:en|ening)?|stalk)\b/i;

/** Code rules beat AI tone games. */
export function applyHardRules(
  rawText: string,
  triage: TriageResult,
): TriageResult {
  const next = { ...triage };

  // Prompt-injection / command attempts never override rules
  if (
    /\b(ignore (all |previous )?rules|mark (as )?critical|set priority|override|jailbreak)\b/i.test(
      rawText,
    )
  ) {
    next.priority_reason = `${next.priority_reason} (ignored command-like wording)`;
  }

  if (SAFETY_RE.test(rawText) || next.is_safety) {
    next.priority = "critical";
    next.is_safety = true;
    next.priority_reason =
      "Safety hazard keywords detected — always top priority regardless of tone";
  }

  if (HARASS_RE.test(rawText) || next.is_confidential) {
    next.is_confidential = true;
    next.priority = elevate(next.priority);
    next.priority_reason = `${next.priority_reason}; confidential harassment/ragging path`;
  }

  // SHOUTING / "urgent" alone never boosts priority if not safety
  if (!next.is_safety && /\burgent\b/i.test(rawText) && next.priority === "critical") {
    next.priority = "high";
    next.priority_reason =
      "Word 'urgent' alone does not create critical priority";
  }

  if (!next.location_known) {
    next.needs_clarification = true;
    next.clarification_question =
      next.clarification_question ||
      "That location is not on our campus map. Which building/lab do you mean?";
  }

  return next;
}

function elevate(p: Priority): Priority {
  if (p === "low") return "medium";
  if (p === "medium") return "high";
  return p;
}

export function crowdPriorityBoost(params: {
  meTooCount: number;
  crowdWeight: number;
  base: Priority;
}): Priority {
  const { meTooCount, crowdWeight, base } = params;
  if (base === "critical") return "critical";
  if (meTooCount >= 4 || crowdWeight >= 180) return elevate(elevate(base));
  if (meTooCount >= 2 || crowdWeight >= 100) return elevate(base);
  return base;
}

export function shouldReopen(params: {
  confirmWeight: number;
  disputeWeight: number;
}): boolean {
  return (
    params.disputeWeight >= 40 &&
    params.disputeWeight > params.confirmWeight * 0.75
  );
}
