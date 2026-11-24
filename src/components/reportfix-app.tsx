"use client";

import { useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminDesk } from "@/components/desks/admin-desk";
import { StaffDesk } from "@/components/desks/staff-desk";
import { StudentDesk } from "@/components/desks/student-desk";
import type { Board, DeskProps } from "@/components/desks/types";
import { ReportFixView } from "@/components/reportfix-view";
import { deskPath, loginPath, type Desk } from "@/lib/portal";
import { clearSession, readSession } from "@/lib/session";
import type { IssueStatus, Profile, Report } from "@/lib/reportfix/types";

export function ReportFixApp({ desk }: { desk: Desk }) {
  const router = useRouter();
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
  const [gate, setGate] = useState<"wait" | "open">(desk === "judge" ? "open" : "wait");
  const reduced = useReducedMotion();

  const viewer = board?.viewer ?? users.find((user) => user.id === userId) ?? null;

  const signOut = useCallback(() => {
    clearSession();
    router.push("/");
  }, [router]);

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
  }, []);

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
      reports: (data.reports ?? []).filter((report: Report) => !report.is_confidential),
      locations: data.locations ?? [],
      ledger: data.ledger ?? [],
      confidential: data.confidential ?? [],
    });
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (desk !== "judge") return;
    if (!userId && users[0]) setUserId(users[0].id);
  }, [desk, userId, users]);

  useEffect(() => {
    if (desk === "judge" || users.length === 0) return;
    const session = readSession();
    if (!session) {
      router.replace(loginPath(desk));
      return;
    }
    const person = users.find((user) => user.id === session);
    if (!person) {
      clearSession();
      router.replace(loginPath(desk));
      return;
    }
    if (deskPath(person.role) !== `/${desk}`) {
      router.replace(deskPath(person.role));
      return;
    }
    if (userId !== session) setUserId(session);
    setGate("open");
  }, [desk, users, userId, router]);

  useEffect(() => {
    if (!userId) return;
    const timer = setInterval(() => void loadBoard(userId), 4000);
    return () => clearInterval(timer);
  }, [userId, loadBoard]);

  useEffect(() => {
    if (userId) void loadBoard(userId);
  }, [userId, loadBoard]);

  const trending = useMemo(() => {
    return [...(board?.issues ?? [])]
      .filter((issue) => !issue.is_confidential)
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

  async function submit(placeId?: string) {
    const chosen = placeId ?? locationId;
    if (!userId || !text.trim()) return;
    setBusy(true);
    setMsg(null);
    if (placeId) setLocationId(placeId);
    const res = await fetch("/api/reportfix/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        text: text.slice(0, 1000),
        locationId: chosen || undefined,
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
        <h1 className="font-display text-3xl">ReportFix setup</h1>
        <pre className="whitespace-pre-wrap rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          {setupError}
        </pre>
        <button
          type="button"
          onClick={() => void bootstrap()}
          className="rounded-full bg-[#140c0c] px-4 py-2 text-sm text-white"
          disabled={busy}
        >
          Retry connection
        </button>
      </main>
    );
  }

  if (desk === "judge") {
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
        submit={(placeId) => void submit(placeId)}
        staffAction={(id, action) => void staffAction(id, action)}
        setStatus={(id, status) => void setStatus(id, status)}
        vote={(id, choice) => void vote(id, choice)}
        loadSummary={() => void loadSummary()}
      />
    );
  }

  if (gate !== "open" || !viewer) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-zinc-600">
        Opening your desk…
      </main>
    );
  }

  const shared: DeskProps = {
    board,
    viewer,
    text,
    setText,
    busy,
    msg,
    summary,
    locationId,
    setLocationId,
    toast,
    reduced,
    trending,
    needsPlace,
    showTriage,
    submit: (placeId) => void submit(placeId),
    staffAction: (id, action) => void staffAction(id, action),
    setStatus: (id, status) => void setStatus(id, status),
    vote: (id, choice) => void vote(id, choice),
    loadSummary: () => void loadSummary(),
    signOut,
  };

  if (desk === "staff") return <StaffDesk {...shared} />;
  if (desk === "admin") return <AdminDesk {...shared} />;
  return <StudentDesk {...shared} />;
}
