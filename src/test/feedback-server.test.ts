import { describe, expect, it } from "vitest";
import { DAILY_CAP, handleFeedback, type FeedbackEnv } from "@/server/feedback";

const ORIGIN = "https://fieldops.example";
const NOW = new Date("2026-11-16T12:00:00Z");

const note = {
  noteId: "0f8e6c1a-4b2d-4e7a-9a51-3d2c1b0a9f88",
  text: "Gate at mile 26 is chained",
  screen: "/sites/site-thompson-pass",
  recordId: "site-thompson-pass",
  appVersion: "test",
};

// A stand-in for D1 and the rate limiter that records what the handler asks for.
function fakeEnv(options: { allowed?: boolean; inserted?: boolean; existing?: boolean } = {}) {
  const { allowed = true, inserted = true, existing = false } = options;
  const calls: { sql: string; values: unknown[] }[] = [];
  const limiterKeys: string[] = [];
  const env: FeedbackEnv = {
    FEEDBACK_LIMITER: {
      limit: async ({ key }) => {
        limiterKeys.push(key);
        return { success: allowed };
      },
    },
    DB: {
      prepare(sql) {
        const statement = {
          values: [] as unknown[],
          bind(...values: unknown[]) {
            statement.values = values;
            return statement;
          },
          async run() {
            calls.push({ sql, values: statement.values });
            const isInsert = sql.trim().startsWith("INSERT");
            return { meta: { changes: isInsert && inserted ? 1 : 0 } };
          },
          async first<T>() {
            calls.push({ sql, values: statement.values });
            return (existing ? { found: 1 } : null) as T | null;
          },
        };
        return statement;
      },
    },
  };
  return { env, calls, limiterKeys };
}

function post(body: unknown, headers: Record<string, string> = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return new Request(`${ORIGIN}/api/feedback`, {
    method: "POST",
    headers: {
      origin: ORIGIN,
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.7",
      ...headers,
    },
    body: text,
  });
}

describe("handleFeedback", () => {
  it("stores a valid note and rate-limits by IP without storing it", async () => {
    const { env, calls, limiterKeys } = fakeEnv();
    const response = await handleFeedback(post(note), env, NOW);
    expect(response.status).toBe(201);
    expect(limiterKeys).toEqual(["203.0.113.7"]);
    const insert = calls.find((c) => c.sql.includes("INSERT"));
    expect(insert?.values).toEqual([
      note.noteId,
      NOW.toISOString(),
      note.text,
      note.screen,
      note.recordId,
      note.appVersion,
      "2026-11-16T00:00:00.000Z",
      DAILY_CAP,
    ]);
    expect(JSON.stringify(calls)).not.toContain("203.0.113.7");
  });

  it("deletes notes older than 90 days on each write", async () => {
    const { env, calls } = fakeEnv();
    await handleFeedback(post(note), env, NOW);
    const purge = calls.find((c) => c.sql.startsWith("DELETE"));
    expect(purge?.values).toEqual(["2026-08-18T12:00:00.000Z"]);
  });

  it("answers a retried note as already stored", async () => {
    const { env } = fakeEnv({ inserted: false, existing: true });
    expect((await handleFeedback(post(note), env, NOW)).status).toBe(200);
  });

  it("refuses once the daily cap is reached", async () => {
    const { env } = fakeEnv({ inserted: false, existing: false });
    expect((await handleFeedback(post(note), env, NOW)).status).toBe(429);
  });

  it("refuses when the IP rate limit is hit", async () => {
    const { env, calls } = fakeEnv({ allowed: false });
    expect((await handleFeedback(post(note), env, NOW)).status).toBe(429);
    expect(calls).toEqual([]);
  });

  it("rejects other origins, non-JSON, oversized and invalid bodies before rate-limiting", async () => {
    const { env, limiterKeys } = fakeEnv();
    const statuses = [
      await handleFeedback(post(note, { origin: "https://evil.example" }), env, NOW),
      await handleFeedback(post(note, { "content-type": "text/plain" }), env, NOW),
      await handleFeedback(post({ ...note, text: "x".repeat(5000) }), env, NOW),
      await handleFeedback(post("{not json"), env, NOW),
      await handleFeedback(post({ ...note, recordId: "users-1" }), env, NOW),
    ].map((r) => r.status);
    expect(statuses).toEqual([403, 415, 413, 400, 400]);
    expect(limiterKeys).toEqual([]);
  });

  it("answers 503 where the Cloudflare bindings don't exist", async () => {
    expect((await handleFeedback(post(note), null, NOW)).status).toBe(503);
  });
});
