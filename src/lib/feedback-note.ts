// A feedback note as the phone sends it and the server accepts it. Shared so
// both sides apply the same rules.

export const MAX_NOTE_LENGTH = 1000;

export interface FeedbackNote {
  /** Random id made on the phone, so a retried send isn't stored twice. */
  noteId: string;
  text: string;
  /** The screen it was sent from, e.g. `/operators/op-amhs`. */
  screen: string;
  /** The operator it is about, when sent from that operator's page. */
  recordId: string | null;
  appVersion: string;
}

export type ParsedNote = { ok: true; note: FeedbackNote } | { ok: false; error: string };

const NOTE_ID = /^[A-Za-z0-9-]{8,64}$/;
const SCREEN = /^\/[A-Za-z0-9\-_/]{0,199}$/;
const RECORD_ID = /^(site|op)-[a-z0-9-]{1,60}$/;
const APP_VERSION = /^[A-Za-z0-9.-]{1,40}$/;

/**
 * Whether the app may tie a note to this record. Only operators qualify: a
 * note never carries a site. The server still accepts older `site-` ids, which
 * phones running an earlier version may send.
 */
export const isOperatorRecord = (id: string) => /^op-[a-z0-9-]{1,60}$/.test(id);

/** Checks every field of an incoming note. Text is trimmed; nothing else is changed. */
export function parseNote(input: unknown): ParsedNote {
  if (typeof input !== "object" || input === null) return { ok: false, error: "not an object" };
  const o = input as Record<string, unknown>;
  const { noteId, text, screen, recordId, appVersion } = o;
  if (typeof noteId !== "string" || !NOTE_ID.test(noteId)) return { ok: false, error: "noteId" };
  if (typeof text !== "string") return { ok: false, error: "text" };
  const trimmed = text.trim();
  if (trimmed.length === 0) return { ok: false, error: "text is empty" };
  if (trimmed.length > MAX_NOTE_LENGTH) return { ok: false, error: "text is too long" };
  if (typeof screen !== "string" || !SCREEN.test(screen)) return { ok: false, error: "screen" };
  if (recordId !== null && (typeof recordId !== "string" || !RECORD_ID.test(recordId))) {
    return { ok: false, error: "recordId" };
  }
  if (typeof appVersion !== "string" || !APP_VERSION.test(appVersion)) {
    return { ok: false, error: "appVersion" };
  }
  return { ok: true, note: { noteId, text: trimmed, screen, recordId, appVersion } };
}
