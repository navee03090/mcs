const KEY = "rf-session";

export function readSession() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function writeSession(userId: string) {
  localStorage.setItem(KEY, userId);
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
