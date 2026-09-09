import type { UIMessage } from "ai";

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

const KEY = "copilot.threads.v1";

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function isBrowser() {
  return typeof window !== "undefined";
}

export function loadThreads(): Thread[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Thread[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t.id === "string")
      .map((t) => ({ ...t, messages: Array.isArray(t.messages) ? t.messages : [] }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(threads));
  } catch {
    /* storage full or blocked */
  }
}

export function createThread(): Thread {
  return { id: newId(), title: "New chat", updatedAt: Date.now(), messages: [] };
}

/** Returns the newest thread, creating and persisting one when none exist. */
export function ensureThread(): Thread {
  const threads = loadThreads();
  if (threads.length > 0) return threads[0]!;
  const thread = createThread();
  saveThreads([thread]);
  return thread;
}

export function upsertThread(thread: Thread) {
  const rest = loadThreads().filter((t) => t.id !== thread.id);
  saveThreads([thread, ...rest]);
}

export function deleteThread(id: string) {
  const remaining = loadThreads().filter((t) => t.id !== id);
  saveThreads(remaining);
  return remaining;
}

export function titleFromMessages(messages: UIMessage[], fallback: string) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return fallback;
  const text = first.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
  if (!text) return fallback;
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}
