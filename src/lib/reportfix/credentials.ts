import { createHash, timingSafeEqual } from "node:crypto";
import type { Role } from "./types";

const ACCOUNTS: Record<string, { userId: string; role: "staff" | "admin" }> = {
  cse: { userId: "22222222-2222-2222-2222-222222222201", role: "staff" },
  ee: { userId: "22222222-2222-2222-2222-222222222202", role: "staff" },
  library: { userId: "22222222-2222-2222-2222-222222222203", role: "staff" },
  cafeteria: { userId: "22222222-2222-2222-2222-222222222204", role: "staff" },
  is: { userId: "22222222-2222-2222-2222-222222222205", role: "staff" },
  labs: { userId: "22222222-2222-2222-2222-222222222206", role: "staff" },
  admin: { userId: "33333333-3333-3333-3333-333333333301", role: "admin" },
};

export type CredentialResult =
  | { ok: true; userId: string }
  | { ok: false; error: string; status: number };

function sameSecret(input: string, expected: string) {
  const left = createHash("sha256").update(input).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function checkCredentials(username: string, password: string, door: Role): CredentialResult {
  if (door !== "staff" && door !== "admin") {
    return { ok: false, error: "Those credentials do not match.", status: 400 };
  }
  const account = ACCOUNTS[username.trim().toLowerCase()];
  if (!account) return { ok: false, error: "Those credentials do not match.", status: 401 };

  const expected = process.env[account.role === "admin" ? "ADMIN_PASSWORD" : "STAFF_PASSWORD"];
  if (!expected) return { ok: false, error: "Sign-in is not configured.", status: 503 };
  if (!password || !sameSecret(password, expected)) {
    return { ok: false, error: "Those credentials do not match.", status: 401 };
  }
  if (account.role !== door) {
    return {
      ok: false,
      error: account.role === "admin" ? "Use the admin door." : "Use the staff door.",
      status: 403,
    };
  }
  return { ok: true, userId: account.userId };
}
