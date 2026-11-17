import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/fo";
import { Stepper } from "@/components/stepper";
import { qualifications } from "@/lib/data";
import { useHydrated, useToday } from "@/lib/offline";
import {
  addMonths,
  monthLabel,
  monthOf,
  setExpiry,
  setHeld,
  updateQualRecord,
  useQualRecord,
} from "@/lib/qual-record";

export const Route = createFileRoute("/qualifications")({
  head: () => ({
    meta: [
      { title: "Your qualifications — FieldOps Alaska" },
      {
        name: "description",
        content: "Record the qualifications you hold and when they expire. Kept on this phone.",
      },
      { property: "og:title", content: "Your qualifications — FieldOps Alaska" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: QualificationsPage,
});

const backToTrips = (
  <Link
    to="/trips"
    className="mb-2 flex min-h-14 items-center gap-2 text-base font-semibold text-muted-foreground"
  >
    <ArrowLeft className="h-5 w-5" />
    Trips
  </Link>
);

function QualificationsPage() {
  const hydrated = useHydrated();
  const record = useQualRecord();
  const today = useToday();

  return (
    <AppShell title="Your qualifications" back={backToTrips}>
      <p className="text-base text-muted-foreground">
        Optional. Record the qualifications you hold and the month each one expires, and every trip
        shows which ones run out before it ends.
      </p>
      <div className="mt-4 flex gap-3 rounded-lg border-2 border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
        <ShieldCheck className="h-5 w-5 shrink-0 text-ok" />
        <p>
          This stays on this phone. It's never sent with feedback or in a shared trip plan, and it
          doesn't ask for your name.
        </p>
      </div>

      {!hydrated || record === null ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {qualifications.map((q) => {
            const held = record.held.find((h) => h.id === q.id);
            return (
              <li key={q.id} className="rounded-lg border-2 border-border bg-card p-3">
                <button
                  type="button"
                  aria-pressed={Boolean(held)}
                  onClick={() => updateQualRecord((r) => setHeld(r, q.id, !held))}
                  className="flex min-h-16 w-full items-center gap-4 rounded-lg px-1 text-left text-lg font-semibold"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 ${held ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
                  >
                    {held && <Check className="h-6 w-6" />}
                  </span>
                  <span className="min-w-0 flex-1">{q.name}</span>
                  <span className="shrink-0 text-xs font-bold uppercase text-muted-foreground">
                    {held ? "I hold this" : "Not held"}
                  </span>
                </button>

                {held && held.expires === null && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
                    <span className="text-sm text-muted-foreground">No expiry recorded</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQualRecord((r) => setExpiry(r, q.id, addMonths(monthOf(today), 12)))
                      }
                      className="flex min-h-14 items-center rounded-lg border-2 border-border px-4 font-semibold active:bg-secondary"
                    >
                      Add an expiry month
                    </button>
                  </div>
                )}
                {held && held.expires !== null && (
                  <div className="mt-2 grid gap-2 px-1">
                    <Stepper
                      label="Expires at the end of"
                      value={monthLabel(held.expires)}
                      onMinus={() =>
                        updateQualRecord((r) =>
                          setExpiry(r, q.id, addMonths(held.expires ?? "", -1)),
                        )
                      }
                      onPlus={() =>
                        updateQualRecord((r) =>
                          setExpiry(r, q.id, addMonths(held.expires ?? "", 1)),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => updateQualRecord((r) => setExpiry(r, q.id, null))}
                      className="flex min-h-14 items-center justify-center rounded-lg border-2 border-border px-4 font-semibold active:bg-secondary"
                    >
                      It doesn't expire
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        A prep reminder only — not an authorization decision.
      </p>
    </AppShell>
  );
}
