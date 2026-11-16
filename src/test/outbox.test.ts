import { beforeEach, describe, expect, it } from "vitest";
import type { FeedbackNote } from "@/lib/feedback-note";
import { classify, flushOutbox, MAX_OUTBOX, queueNote, readOutbox } from "@/lib/outbox";

const note = (id: string): FeedbackNote => ({
  noteId: `note-${id}-0000`,
  text: `note ${id}`,
  screen: "/",
  recordId: null,
  appVersion: "test",
});

beforeEach(() => localStorage.clear());

describe("classify", () => {
  it("keeps notes that may succeed later and drops ones that never will", () => {
    expect(classify(201)).toBe("sent");
    expect(classify(200)).toBe("sent");
    expect(classify("network-error")).toBe("keep");
    expect(classify(429)).toBe("keep");
    expect(classify(503)).toBe("keep");
    expect(classify(408)).toBe("keep");
    expect(classify(400)).toBe("drop");
    expect(classify(403)).toBe("drop");
    expect(classify(413)).toBe("drop");
  });
});

describe("outbox", () => {
  it("refuses new notes once it is full", () => {
    for (let i = 0; i < MAX_OUTBOX; i++) expect(queueNote(note(String(i)))).toBe(true);
    expect(queueNote(note("extra"))).toBe(false);
    expect(readOutbox()).toHaveLength(MAX_OUTBOX);
  });

  it("removes sent and rejected notes, keeps the rest, and reports each", async () => {
    queueNote(note("a"));
    queueNote(note("b"));
    queueNote(note("c"));
    const status: Record<string, number | "network-error"> = {
      "note-a-0000": 201,
      "note-b-0000": "network-error",
      "note-c-0000": 400,
    };
    const outcomes = await flushOutbox(async (n) => status[n.noteId] ?? 500);
    expect(Object.fromEntries(outcomes)).toEqual({
      "note-a-0000": "sent",
      "note-b-0000": "keep",
      "note-c-0000": "drop",
    });
    expect(readOutbox().map((n) => n.noteId)).toEqual(["note-b-0000"]);
  });

  it("sends a note queued after a flush of an empty outbox", async () => {
    // Regression: an empty run finished synchronously and stayed stuck as the
    // current run, so every later flush returned its empty result.
    const send = async () => 201;
    await flushOutbox(send);
    queueNote(note("late"));
    const outcomes = await flushOutbox(send);
    expect(outcomes.get("note-late-0000")).toBe("sent");
    expect(readOutbox()).toEqual([]);
  });

  it("shares one run between concurrent flushes", async () => {
    queueNote(note("a"));
    let sends = 0;
    const send = async () => {
      sends++;
      return 201;
    };
    await Promise.all([flushOutbox(send), flushOutbox(send)]);
    expect(sends).toBe(1);
  });
});
