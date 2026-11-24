import type { Department } from "./types";

export type CampusPlace = {
  id: string;
  name: string;
  building: string | null;
  department_hint: Department | null;
  aliases: string[];
};

/** Canonical campus list. Edit aliases here — matching never guesses past this file. */
export const CAMPUS_PLACES: CampusPlace[] = [
  {
    id: "cse-lab-3",
    name: "CSE Lab 3",
    building: "CSE Block",
    department_hint: "CSE",
    aliases: ["cse lab 3", "cs lab 3", "cs lab3", "cse lab3", "lab 3", "lab3"],
  },
  {
    id: "cse-lab-2",
    name: "CSE Lab 2",
    building: "CSE Block",
    department_hint: "CSE",
    aliases: ["cse lab 2", "cs lab 2", "cse lab2", "lab 2", "lab2"],
  },
  {
    id: "cse-lab-1",
    name: "CSE Lab 1",
    building: "CSE Block",
    department_hint: "CSE",
    aliases: ["cse lab 1", "cs lab 1", "cse lab1", "lab 1", "lab1"],
  },
  {
    id: "ee-lab-1",
    name: "EE Lab 1",
    building: "EE Block",
    department_hint: "EE",
    aliases: ["ee lab 1", "ee lab1", "ee lab"],
  },
  {
    id: "library",
    name: "Central Library",
    building: "Library",
    department_hint: "Library",
    aliases: ["central library", "library", "lib", "لائبریری"],
  },
  {
    id: "cafeteria",
    name: "Main Cafeteria",
    building: "Student Center",
    department_hint: "Cafeteria",
    aliases: ["main cafeteria", "cafeteria", "canteen", "cafe", "کینٹین"],
  },
  {
    id: "is-lab",
    name: "IS Lab",
    building: "IS Block",
    department_hint: "IS",
    aliases: ["is lab", "information security lab"],
  },
  {
    id: "labs-common",
    name: "Common Labs Area",
    building: "Labs Complex",
    department_hint: "Labs",
    aliases: ["common labs", "labs complex", "labs area"],
  },
  {
    id: "hostel-a",
    name: "Hostel A",
    building: "Hostels",
    department_hint: null,
    aliases: ["hostel a", "hostel-a", "hostel", "ہاسٹل"],
  },
  {
    id: "auditorium",
    name: "Auditorium",
    building: "Main Block",
    department_hint: null,
    aliases: ["auditorium", "main hall"],
  },
];

const UNKNOWN_PLACE =
  /moon\s*base|\bblock\s*z\b|\blab\s*(?:[4-9]|[1-9]\d)\b|\blab(?:[4-9]|[1-9]\d)\b|\bbuilding\s*z\b/i;

export function normalizeText(input: string) {
  return input
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[a.length][b.length];
}

export function matchLocation(raw: string): {
  id: string | null;
  name: string | null;
  known: boolean;
  department_hint: Department | null;
} {
  const text = normalizeText(raw);
  if (!text || UNKNOWN_PLACE.test(raw) || UNKNOWN_PLACE.test(text)) {
    return { id: null, name: null, known: false, department_hint: null };
  }

  const aliases = CAMPUS_PLACES.flatMap((place) =>
    place.aliases.map((alias) => ({ alias, place })),
  ).sort((a, b) => b.alias.length - a.alias.length);

  for (const { alias, place } of aliases) {
    if (text.includes(alias)) {
      return {
        id: place.id,
        name: place.name,
        known: true,
        department_hint: place.department_hint,
      };
    }
  }

  const tokens = text.split(" ").filter((t) => t.length >= 4);
  for (const token of tokens) {
    for (const { alias, place } of aliases) {
      if (alias.includes(" ")) continue;
      if (Math.abs(alias.length - token.length) > 2) continue;
      if (levenshtein(alias, token) <= 2) {
        return {
          id: place.id,
          name: place.name,
          known: true,
          department_hint: place.department_hint,
        };
      }
    }
  }

  return { id: null, name: null, known: false, department_hint: null };
}

export function placeById(id: string) {
  return CAMPUS_PLACES.find((p) => p.id === id) ?? null;
}
