import { decideReport } from "./decide";
import { proposeExtraction } from "./extract";
import type { TriageResult } from "./types";

/** AI may suggest a summary. Priority, safety, place, and confidentiality stay in code. */
export async function triageReport(
  rawText: string,
  locationId?: string | null,
): Promise<TriageResult> {
  const decided = decideReport(rawText, locationId);
  const proposal = await proposeExtraction(rawText);
  if (!proposal) return decided;

  const title =
    !decided.needs_clarification && proposal.summary
      ? proposal.summary.slice(0, 120)
      : decided.title;

  return {
    ...decided,
    title,
    rules_fired: [...decided.rules_fired, "llm-proposal-ignored-for-decisions"],
  };
}

export function sameProblem(
  a: { location_id: string | null; category: string; is_confidential: boolean },
  b: { location_id: string | null; category: string; is_confidential: boolean },
) {
  if (a.is_confidential || b.is_confidential) return false;
  return Boolean(a.location_id && a.location_id === b.location_id && a.category === b.category);
}
