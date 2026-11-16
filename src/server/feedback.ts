// POST /api/feedback: stores one anonymous feedback note.
//
// The endpoint is public, so it only accepts same-origin JSON, bounds the
// body, validates every field, rate-limits by IP address (counted, never
// stored or logged) and enforces a daily cap. It never logs note text.
import { parseNote } from "../lib/feedback-note";

export const MAX_BODY_BYTES = 4096;
/** Hard backstop across all testers, since the IP rate limit is approximate. */
export const DAILY_CAP = 300;
export const RETENTION_DAYS = 90;

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<{ meta: { changes: number } }>;
  first<T = unknown>(): Promise<T | null>;
}

export interface FeedbackEnv {
  DB: { prepare(sql: string): D1Statement };
  FEEDBACK_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

const DAY_MS = 86_400_000;

/** Deletes notes older than the retention period. Also run by the daily cron and the read command. */
export async function purgeOldNotes(db: FeedbackEnv["DB"], now: Date) {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * DAY_MS).toISOString();
  await db.prepare("DELETE FROM feedback_notes WHERE received_at < ?").bind(cutoff).run();
}

export async function handleFeedback(
  request: Request,
  env: FeedbackEnv | null,
  now: Date,
): Promise<Response> {
  if (!env) return json(503, { error: "Feedback isn't available on this server." });

  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return json(403, { error: "Wrong origin." });
  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) {
    return json(415, { error: "Send JSON." });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return json(413, { error: "Too large." });
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return json(413, { error: "Too large." });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "Not valid JSON." });
  }
  const parsed = parseNote(body);
  if (!parsed.ok) return json(400, { error: `Invalid note: ${parsed.error}.` });
  const { note } = parsed;

  // The IP address is used only as the rate-limit key: never stored or logged.
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const { success } = await env.FEEDBACK_LIMITER.limit({ key: ip });
  if (!success) return json(429, { error: "Too many notes. Try again in a minute." });

  await purgeOldNotes(env.DB, now);

  const dayStart = new Date(Math.floor(now.getTime() / DAY_MS) * DAY_MS).toISOString();
  // One statement: insert only while today's count is under the cap, and
  // ignore a note id that is already stored (a retried send).
  const result = await env.DB.prepare(
    `INSERT INTO feedback_notes (note_id, received_at, text, screen, record_id, app_version)
     SELECT ?, ?, ?, ?, ?, ?
     WHERE (SELECT COUNT(*) FROM feedback_notes WHERE received_at >= ?) < ?
     ON CONFLICT(note_id) DO NOTHING`,
  )
    .bind(
      note.noteId,
      now.toISOString(),
      note.text,
      note.screen,
      note.recordId,
      note.appVersion,
      dayStart,
      DAILY_CAP,
    )
    .run();
  if (result.meta.changes === 1) return json(201, { ok: true });

  const existing = await env.DB.prepare("SELECT 1 AS found FROM feedback_notes WHERE note_id = ?")
    .bind(note.noteId)
    .first();
  if (existing) return json(200, { ok: true, duplicate: true });
  return json(429, { error: "Today's feedback limit is reached. Try again tomorrow." });
}
