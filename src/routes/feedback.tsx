import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/fo";
import { Button } from "@/components/ui/button";
import { getOperator } from "@/lib/data";
import { isOperatorRecord, MAX_NOTE_LENGTH, type FeedbackNote } from "@/lib/feedback-note";
import { useHydrated } from "@/lib/offline";
import { flushOutbox, newNoteId, queueNote, useOutboxCount } from "@/lib/outbox";

type Search = { from?: string | undefined; record?: string | undefined };

const SCREEN = /^\/[A-Za-z0-9\-_/]{0,199}$/;

export const Route = createFileRoute("/feedback")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const from = s["from"];
    const record = s["record"];
    return {
      from:
        typeof from === "string" && SCREEN.test(from) && from !== "/feedback" ? from : undefined,
      record: typeof record === "string" && isOperatorRecord(record) ? record : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Send feedback — FieldOps Alaska" },
      { name: "description", content: "Tell us what's wrong, missing or hard to use." },
      { property: "og:title", content: "Send feedback — FieldOps Alaska" },
      { property: "og:description", content: "Anonymous feedback on FieldOps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedbackPage,
});

type Status = "idle" | "sent" | "queued" | "rejected" | "full";

const STATUS_TEXT: Record<Exclude<Status, "idle">, string> = {
  sent: "Sent. Thank you.",
  queued: "Saved on this phone. It will send when you have signal.",
  rejected: "The server couldn't accept that note.",
  full: "20 notes are already waiting to send. Try again once you have signal.",
};

function FeedbackPage() {
  const search = Route.useSearch();
  // The page is built ahead of time without a search, so wait for hydration.
  const hydrated = useHydrated();
  const from = hydrated ? search.from : undefined;
  const record = hydrated ? search.record : undefined;
  const subject = record ? getOperator(record)?.name : undefined;

  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [sending, setSending] = useState(false);
  const waiting = useOutboxCount();
  const trimmed = text.trim();

  async function send() {
    const note: FeedbackNote = {
      noteId: newNoteId(),
      text: trimmed,
      screen: from ?? "/feedback",
      recordId: record ?? null,
      appVersion: __APP_VERSION__,
    };
    if (!queueNote(note)) {
      setStatus("full");
      return;
    }
    setText("");
    setSending(true);
    const outcomes = await flushOutbox();
    setSending(false);
    const outcome = outcomes.get(note.noteId) ?? "keep";
    setStatus(outcome === "sent" ? "sent" : outcome === "drop" ? "rejected" : "queued");
  }

  return (
    <AppShell
      title="Feedback"
      hideFeedback
      back={
        <a
          href={from ?? "/"}
          className="mb-2 flex min-h-14 items-center gap-2 text-base font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </a>
      }
    >
      <p className="text-base text-muted-foreground">
        What's wrong, missing or hard to use? Notes work with no signal: they send when you're back
        in range.
      </p>
      {subject && (
        <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm font-semibold">
          About: {subject}
        </p>
      )}

      <label htmlFor="note" className="sr-only">
        Your note
      </label>
      <textarea
        id="note"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (status !== "idle") setStatus("idle");
        }}
        maxLength={MAX_NOTE_LENGTH}
        rows={6}
        placeholder="Type your note…"
        className="mt-4 w-full rounded-lg border-2 border-border bg-card p-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
      />
      <div className="mt-1 text-right font-mono text-xs text-muted-foreground">
        {text.length} / {MAX_NOTE_LENGTH}
      </div>

      <Button
        size="lg"
        onClick={() => void send()}
        disabled={trimmed.length === 0 || sending}
        className="mt-3 w-full uppercase"
      >
        <Send className="h-5 w-5" />
        {sending ? "Sending…" : "Send feedback"}
      </Button>

      <p role="status" aria-live="polite" className="mt-3 min-h-6 text-base font-semibold">
        {status !== "idle" && STATUS_TEXT[status]}
      </p>
      {waiting > 0 && (
        <p className="text-sm text-muted-foreground">
          {waiting === 1 ? "1 note is" : `${waiting} notes are`} waiting for signal.
        </p>
      )}

      <div className="mt-6 flex gap-3 rounded-lg border-2 border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
        <ShieldCheck className="h-5 w-5 shrink-0 text-ok" />
        <p>
          You're never asked who you are. A note is sent with the screen it came from and the app
          version, never your name or email. Your connection's IP address is used for a moment to
          limit spam and is never stored. Notes are deleted after 90 days.
        </p>
      </div>
    </AppShell>
  );
}
