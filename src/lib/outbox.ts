// Feedback notes wait here, in the browser's local storage, until they are
// sent. A note is sent straight away when there is signal; otherwise it is
// retried on launch, when the phone comes back online and when the app comes
// back to the foreground (iPhones have no background sync).
import { useSyncExternalStore } from "react";
import type { FeedbackNote } from "./feedback-note";

const KEY = "fo-outbox";
const CHANGE_EVENT = "fo-outbox";
/** A full outbox refuses new notes rather than growing without bound. */
export const MAX_OUTBOX = 20;
const SEND_TIMEOUT_MS = 15_000;

export type SendStatus = number | "network-error";
export type Outcome = "sent" | "keep" | "drop";

/** What to do with a note after one send attempt. */
export function classify(status: SendStatus): Outcome {
  if (status === "network-error") return "keep";
  if (status >= 200 && status < 300) return "sent";
  // Rate-limited, timed out or a server problem: try again later.
  if (status === 408 || status === 429 || status >= 500) return "keep";
  // Any other 4xx means the server will never accept this note.
  return "drop";
}

export function readOutbox(): FeedbackNote[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as FeedbackNote[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(notes: FeedbackNote[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    // Storage blocked or full: nothing more can be done on this phone.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Adds a note to the outbox. Returns false when the outbox is full. */
export function queueNote(note: FeedbackNote): boolean {
  const notes = readOutbox();
  if (notes.length >= MAX_OUTBOX) return false;
  writeOutbox([...notes, note]);
  return true;
}

export async function sendNote(note: FeedbackNote): Promise<SendStatus> {
  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(note),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    return response.status;
  } catch {
    return "network-error";
  }
}

let flushing: Promise<Map<string, Outcome>> | null = null;

/**
 * Tries to send every queued note once, and reports what happened to each by
 * note id. Concurrent calls share one run; a note queued during a run isn't
 * in its report and stays queued for the next one.
 */
export function flushOutbox(send: (note: FeedbackNote) => Promise<SendStatus> = sendNote) {
  // Clear the marker in a .finally attached after assignment: with an empty
  // outbox the run finishes synchronously, and clearing it inside the run would
  // happen before the assignment, leaving a finished run stuck as "current".
  flushing ??= runFlush(send).finally(() => {
    flushing = null;
  });
  return flushing;
}

async function runFlush(send: (note: FeedbackNote) => Promise<SendStatus>) {
  const outcomes = new Map<string, Outcome>();
  for (const note of readOutbox()) {
    const outcome = classify(await send(note));
    outcomes.set(note.noteId, outcome);
    if (outcome === "keep") continue;
    // Re-read so a note queued during the send isn't lost.
    writeOutbox(readOutbox().filter((n) => n.noteId !== note.noteId));
  }
  return outcomes;
}

/** Starts retrying the outbox on launch, on reconnect and on return to the app. */
export function startOutboxSync() {
  const flush = () => void flushOutbox();
  flush();
  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flush();
  });
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** How many notes are waiting to be sent. Zero on pages built ahead of time. */
export function useOutboxCount() {
  return useSyncExternalStore(
    subscribe,
    () => readOutbox().length,
    () => 0,
  );
}

export function newNoteId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
