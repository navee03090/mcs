import type { Profile } from "./types";

export function detectBrigade(params: {
  events: { at: string; actor: Pick<Profile, "created_at"> }[];
  now?: number;
}) {
  const now = params.now ?? Date.now();
  const recentNew = params.events.filter((event) => {
    const at = new Date(event.at).getTime();
    const born = new Date(event.actor.created_at).getTime();
    return now - at <= 10 * 60 * 1000 && now - born < 60 * 60 * 1000;
  });
  if (recentNew.length >= 3) {
    return {
      flagged: true,
      reason: `${recentNew.length} joins/votes in 10 minutes came from accounts under 1 hour old — down-weighted as possible brigading`,
    };
  }
  return { flagged: false, reason: "" };
}
