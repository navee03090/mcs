"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ReportFixView } from "@/components/reportfix-view";
import type {
  CampusLocation,
  Issue,
  IssueStatus,
  Profile,
  Report,
  TrustEvent,
} from "@/lib/reportfix/types";

type Board = {
  viewer: Profile;
  issues: Issue[];
  reports: Report[];
  locations: CampusLocation[];
  ledger: TrustEvent[];
  confidential: Issue[];
};

const STATUS_OPTIONS: IssueStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "reopened",
];

export function ReportFixApp() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [userId, setUserId] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const viewer = board?.viewer ?? users.find((u) => u.id === userId) ?? null;

  useEffect(() => {
    if (!msg) return;
    if (msg === "Data reset." || msg.startsWith("Created ")) {
      setToast(msg);
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/reportfix/users");
    const data = await res.json();
    if (!data.ok) {
      setSetupError(data.error || data.hint || "Database not ready");
      return;
    }
    setSetupError(null);
    setUsers(data.users);
    if (!userId && data.users[0]) setUserId(data.users[0].id);
  }, [userId]);

  const loadBoard = useCallback(async (id: string) => {
    const res = await fetch(`/api/reportfix/issues?userId=${id}`);
    const data = await res.json();
    if (!data.ok) {
      setMsg(data.error);
      return;
    }
    setBoard({
      viewer: data.viewer,
      issues: data.issues,
      reports: (data.reports ?? []).filter((r: Report) => !r.is_confidential),
      locations: data.locations ?? [],
      ledger: data.ledger ?? [],
      confidential: data.confidential ?? [],
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const timer = setInterval(() => void loadBoard(userId), 4000);
    return () => clearInterval(timer);
  }, [userId, loadBoard]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (userId) void loadBoard(userId);
  }, [userId, loadBoard]);

  const trending = useMemo(() => {
    return [...(board?.issues ?? [])]
      .filter((i) => !i.is_confidential)
      .sort((a, b) => b.crowd_weight - a.crowd_weight)
      .slice(0, 5);
  }, [board]);

  async function bootstrap() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/reportfix/bootstrap");
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setSetupError(
        `${data.error}\n\nOpen Supabase → SQL Editor and run file supabase/schema.sql then click Retry.`,
      );
      return;
    }
    setSetupError(null);
    await loadUsers();
  }

  async function resetData() {
    if (!confirm("Reset all ReportFix data to seed users?")) return;
    setBusy(true);
    const res = await fetch("/api/reportfix/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.ok ? "Data reset." : data.error);
    await loadUsers();
    if (userId) await loadBoard(userId);
  }

  async function createUser() {
    setBusy(true);
    const res = await fetch("/api/reportfix/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName || undefined }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setMsg(data.error);
      return;
    }
    setNewName("");
    await loadUsers();
    setUserId(data.user.id);
    setMsg(`Created ${data.user.name}`);
  }

  async function submit() {
    if (!userId || !text.trim()) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/reportfix/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        text: text.slice(0, 1000),
        locationId: locationId || undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setMsg(data.error);
      return;
    }
    if (data.report?.needs_clarification) {
      setMsg(`Needs clarification: ${data.report.clarification_question}`);
      await loadBoard(userId);
      return;
    } else if (data.grouped) {
      setMsg(`Joined existing issue (+me too). Priority ${data.issue.priority}`);
    } else if (data.issue?.is_confidential) {
      setMsg("Confidential report filed (hidden from public boards).");
    } else {
      setMsg(`Routed to ${data.issue.department} · ${data.issue.priority}`);
    }
    setText("");
    setLocationId("");
    await loadBoard(userId);
  }

  async function staffAction(issueId: string, action: "spam" | "close_window") {
    setBusy(true);
    const res = await fetch("/api/reportfix/issues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, issueId, action }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.ok ? action : data.error);
    if (userId) await loadBoard(userId);
  }

  async function setStatus(issueId: string, status: IssueStatus) {
    setBusy(true);
    const res = await fetch("/api/reportfix/issues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, issueId, status }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) setMsg(data.error);
    if (userId) await loadBoard(userId);
  }

  async function vote(issueId: string, vote: "confirm" | "dispute") {
    setBusy(true);
    const res = await fetch("/api/reportfix/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, issueId, vote }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(
      data.ok
        ? data.reopened
          ? "Enough disputes — issue reopened."
          : "Vote recorded."
        : data.error,
    );
    if (userId) await loadBoard(userId);
  }

  async function loadSummary() {
    if (!userId) return;
    setBusy(true);
    const res = await fetch(`/api/reportfix/summary?userId=${userId}`);
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setMsg(data.error);
      return;
    }
    setSummary(data.text);
  }

  const needsPlace = Boolean(msg?.startsWith("Needs clarification"));
  const showTriage = busy || Boolean(msg && /Routed|Joined|Confidential|clarification/i.test(msg));

  if (setupError) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <h1 className="text-2xl font-bold">ReportFix setup</h1>
        <pre className="whitespace-pre-wrap rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          {setupError}
        </pre>
        <p className="text-sm text-zinc-600">
          File to run: <code>supabase/schema.sql</code> in Supabase SQL Editor
          for project <code>hprppvnwjwstlksmazho</code>.
        </p>
        <button
          type="button"
          onClick={() => void bootstrap()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          disabled={busy}
        >
          Retry connection
        </button>
      </main>
    );
  }

  return (
    <ReportFixView
      users={users}
      userId={userId}
      setUserId={setUserId}
      board={board}
      viewer={viewer}
      text={text}
      setText={setText}
      busy={busy}
      msg={msg}
      summary={summary}
      newName={newName}
      setNewName={setNewName}
      locationId={locationId}
      setLocationId={setLocationId}
      toast={toast}
      reduced={reduced}
      trending={trending}
      needsPlace={needsPlace}
      showTriage={showTriage}
      resetData={() => void resetData()}
      createUser={() => void createUser()}
      submit={() => void submit()}
      staffAction={(id, action) => void staffAction(id, action)}
      setStatus={(id, status) => void setStatus(id, status)}
      vote={(id, choice) => void vote(id, choice)}
      loadSummary={() => void loadSummary()}
    />
  );
}
