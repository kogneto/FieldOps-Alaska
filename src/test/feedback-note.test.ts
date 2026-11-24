import { describe, expect, it } from "vitest";
import { isOperatorRecord, MAX_NOTE_LENGTH, parseNote } from "@/lib/feedback-note";

const valid = {
  noteId: "0f8e6c1a-4b2d-4e7a-9a51-3d2c1b0a9f88",
  text: "  Trail sign at mile 4 is gone  ",
  screen: "/sites/site-douglas-hut",
  recordId: "site-douglas-hut",
  appVersion: "9ffc216",
};

describe("parseNote", () => {
  it("accepts a valid note and trims its text", () => {
    const parsed = parseNote(valid);
    expect(parsed).toEqual({ ok: true, note: { ...valid, text: "Trail sign at mile 4 is gone" } });
  });

  it("accepts a note that isn't about a record", () => {
    expect(parseNote({ ...valid, screen: "/", recordId: null }).ok).toBe(true);
  });

  it("rejects empty or over-long text", () => {
    expect(parseNote({ ...valid, text: "   " }).ok).toBe(false);
    expect(parseNote({ ...valid, text: "x".repeat(MAX_NOTE_LENGTH) }).ok).toBe(true);
    expect(parseNote({ ...valid, text: "x".repeat(MAX_NOTE_LENGTH + 1) }).ok).toBe(false);
  });

  it("rejects every malformed field", () => {
    expect(parseNote(null).ok).toBe(false);
    expect(parseNote({ ...valid, noteId: "short" }).ok).toBe(false);
    expect(parseNote({ ...valid, screen: "https://evil.example/" }).ok).toBe(false);
    expect(parseNote({ ...valid, screen: "/sites/<script>" }).ok).toBe(false);
    expect(parseNote({ ...valid, recordId: "users-1" }).ok).toBe(false);
    expect(parseNote({ ...valid, recordId: undefined }).ok).toBe(false);
    expect(parseNote({ ...valid, appVersion: "" }).ok).toBe(false);
    expect(parseNote({ ...valid, text: 42 }).ok).toBe(false);
  });
});

describe("isOperatorRecord", () => {
  it("lets a note be tied to an operator, never to a site", () => {
    expect(isOperatorRecord("op-amhs")).toBe(true);
    expect(isOperatorRecord("site-coldfoot")).toBe(false);
    expect(isOperatorRecord("3f2c9a7e-0000-4000-8000-000000000000")).toBe(false);
  });
});
