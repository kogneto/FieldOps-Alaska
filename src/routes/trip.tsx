import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Lock,
  Plus,
  Share2,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { AppShell, ModeIcon } from "@/components/fo";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { getOperator, getQualification, getSite, monthsLabel } from "@/lib/data";
import { useHydrated, useToday } from "@/lib/offline";
import { deleteTrip, updateTrip, useTrips } from "@/lib/trip-store";
import {
  addDays,
  dateRangeLabel,
  MAX_TRIP_DAYS,
  removeStop,
  routeCovers,
  setDates,
  setRoute,
  shareText,
  shortDate,
  toggleItem,
  toggleQual,
  toggleSkip,
  tripMonths,
  tripQualifications,
  tripStatus,
  tripTitle,
  STATUS_LABEL,
  type Trip,
} from "@/lib/trips";

type Search = { id?: string | undefined };

export const Route = createFileRoute("/trip")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s["id"] === "string" && s["id"].length <= 64 ? s["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Trip — FieldOps Alaska" },
      { name: "description", content: "A trip's sites, routes, qualifications and checklists." },
      { property: "og:title", content: "Trip — FieldOps Alaska" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TripPage,
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

// One page for every trip, built ahead of time: the trip id is in the URL and
// the trip itself is in this phone's storage, so both are read after hydration.
function TripPage() {
  const search = Route.useSearch();
  const hydrated = useHydrated();
  const trips = useTrips();

  if (!hydrated || trips === null) {
    return (
      <AppShell title="Trip" back={backToTrips}>
        <p className="text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }
  const trip = trips.find((t) => t.id === search.id);
  if (!trip) {
    return (
      <AppShell title="Trip" back={backToTrips}>
        <p className="text-base text-muted-foreground">
          This trip isn't on this phone. Trips are kept only on the phone they were planned on.
        </p>
      </AppShell>
    );
  }
  return <TripDetail trip={trip} />;
}

function TripDetail({ trip }: { trip: Trip }) {
  const today = useToday();
  const navigate = useNavigate();
  const [shareStatus, setShareStatus] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = tripStatus(trip, today);
  const months = tripMonths(trip);
  const change = (fn: (t: Trip) => Trip) => updateTrip(trip.id, fn);

  async function share() {
    const text = shareText(trip);
    try {
      if (navigator.share) {
        await navigator.share({ title: "FieldOps trip", text });
        setShareStatus("");
        return;
      }
    } catch (error) {
      // Closing the share sheet isn't a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareStatus("Copied. Paste it into a message.");
    } catch {
      setShareStatus("Couldn't share or copy on this phone.");
    }
  }

  return (
    <AppShell title="Trip" back={backToTrips}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-xl font-bold leading-tight">{tripTitle(trip)}</h2>
        <span className="shrink-0 rounded-sm bg-secondary px-2 py-1 font-mono text-xs uppercase">
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p className="mt-1 text-muted-foreground">{dateRangeLabel(trip)}</p>

      <div className="mt-5 grid gap-4">
        <Stepper
          label="First day"
          value={trip.start === today ? `Today, ${shortDate(trip.start)}` : shortDate(trip.start)}
          onMinus={() => change((t) => setDates(t, addDays(t.start, -1), t.days))}
          onPlus={() => change((t) => setDates(t, addDays(t.start, 1), t.days))}
        />
        <Stepper
          label="Length"
          value={`${trip.days} day${trip.days === 1 ? "" : "s"}`}
          onMinus={() => change((t) => setDates(t, t.start, t.days - 1))}
          onPlus={() => change((t) => setDates(t, t.start, t.days + 1))}
          minusDisabled={trip.days <= 1}
          plusDisabled={trip.days >= MAX_TRIP_DAYS}
        />
      </div>

      <Section title="Sites">
        <div className="grid gap-3">
          {trip.stops.map((stop) => {
            const site = getSite(stop.siteId);
            if (!site) return null;
            const chosen = site.routes[stop.routeIndex];
            return (
              <div key={stop.siteId} className="rounded-lg border-2 border-border bg-card p-4">
                <Link
                  to="/sites/$id"
                  params={{ id: site.id }}
                  className="flex min-h-14 items-center text-lg font-bold text-card-foreground"
                >
                  {site.name}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {site.community}, {site.region}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {site.confidentiality === "confidential" && (
                    <span className="flex items-center gap-1 rounded-sm bg-secondary px-2 py-1 text-xs font-semibold uppercase">
                      <Lock className="h-3.5 w-3.5" />
                      Confidential
                    </span>
                  )}
                  {site.escort && (
                    <span className="flex items-center gap-1 rounded-sm bg-caution px-2 py-1 text-xs font-bold uppercase text-caution-foreground">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Escort required
                    </span>
                  )}
                </div>

                <div className="mt-3 text-xs font-bold uppercase text-muted-foreground">
                  Getting there
                </div>
                <div className="mt-1 grid gap-2">
                  {site.routes.map((route, i) => {
                    const operator = route.operatorId ? getOperator(route.operatorId) : undefined;
                    const selected = i === stop.routeIndex;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => change((t) => setRoute(t, site.id, i))}
                        className={`flex min-h-16 w-full items-center gap-3 rounded-lg border-2 px-3 py-2 text-left ${selected ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
                        >
                          {selected && <Check className="h-4 w-4" strokeWidth={3} />}
                        </span>
                        <ModeIcon mode={route.mode} className="h-5 w-5 shrink-0 text-accent" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">
                            {operator?.name ?? "Drive yourself"}
                          </span>
                          <span className="block text-sm text-muted-foreground">{route.how}</span>
                        </span>
                        <span className="shrink-0 font-mono text-xs uppercase">
                          {monthsLabel(route.months)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {chosen && !routeCovers(chosen, months) && (
                  <p className="mt-2 flex gap-2 text-sm font-semibold text-caution">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    This route doesn't work for every day of the trip.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => change((t) => removeStop(t, site.id))}
                  className="mt-3 flex min-h-14 items-center gap-2 rounded-lg border-2 border-border px-4 font-semibold text-muted-foreground active:bg-secondary"
                >
                  <X className="h-5 w-5" />
                  Remove from trip
                </button>
              </div>
            );
          })}
        </div>
        <Link
          to="/directory"
          className="mt-3 flex min-h-16 items-center justify-center gap-2 rounded-lg border-2 border-accent px-4 text-lg font-bold uppercase text-accent active:bg-secondary"
        >
          <Plus className="h-5 w-5" />
          Add a site
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a site and tap "Add to this trip".
        </p>
      </Section>

      <QualificationsSection trip={trip} onToggle={(id) => change((t) => toggleQual(t, id))} />

      <Section title="Checklists">
        <div className="grid gap-6">
          {trip.checklists.map((cl) => {
            const done = cl.ticks.filter(Boolean).length;
            const pct = cl.items.length ? Math.round((done / cl.items.length) * 100) : 0;
            return (
              <div key={cl.id}>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs uppercase text-primary">{cl.category}</div>
                    <h3 className="font-display text-lg uppercase leading-tight">{cl.title}</h3>
                  </div>
                  <button
                    type="button"
                    aria-pressed={cl.skipped}
                    onClick={() => change((t) => toggleSkip(t, cl.id))}
                    className="flex min-h-14 shrink-0 items-center rounded-lg border-2 border-border px-4 text-sm font-bold uppercase active:bg-secondary"
                  >
                    {cl.skipped ? "Include" : "Skip"}
                  </button>
                </div>
                {cl.skipped ? (
                  <p className="mt-2 text-sm text-muted-foreground">Skipped for this trip.</p>
                ) : (
                  <>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <ul className="mt-3 grid gap-2">
                      {cl.items.map((item, i) => (
                        <li key={i}>
                          <TickRow
                            on={cl.ticks[i] === true}
                            label={item}
                            onToggle={() => change((t) => toggleItem(t, cl.id, i))}
                          />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Button size="lg" onClick={() => void share()} className="mt-8 w-full uppercase">
        <Share2 className="h-5 w-5" />
        Share trip plan
      </Button>
      <p role="status" aria-live="polite" className="mt-2 min-h-6 text-sm font-semibold">
        {shareStatus}
      </p>
      <p className="text-sm text-muted-foreground">
        Sends the plan as text, with site names. A plan with a confidential site starts with
        "Confidential — share inside the crew only".
      </p>

      <button
        type="button"
        onClick={() => {
          if (!confirmDelete) {
            setConfirmDelete(true);
            return;
          }
          deleteTrip(trip.id);
          void navigate({ to: "/trips" });
        }}
        className={`mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border-2 px-4 font-bold uppercase ${confirmDelete ? "border-destructive bg-destructive text-destructive-foreground" : "border-destructive text-destructive"}`}
      >
        <Trash2 className="h-5 w-5" />
        {confirmDelete ? "Tap again to delete" : "Delete trip"}
      </button>
    </AppShell>
  );
}

function QualificationsSection({ trip, onToggle }: { trip: Trip; onToggle: (id: string) => void }) {
  const ids = tripQualifications(trip);
  if (ids.length === 0) return null;
  return (
    <Section title="Qualifications">
      <p className="mb-2 text-sm text-muted-foreground">
        Everything the trip's sites need, once each. Tick what you hold.
      </p>
      <ul className="grid gap-2">
        {ids.map((id) => (
          <li key={id}>
            <TickRow
              on={trip.quals.includes(id)}
              label={getQualification(id)?.name ?? id}
              onToggle={() => onToggle(id)}
            />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        A prep reminder only — not an authorization decision.
      </p>
    </Section>
  );
}

function TickRow({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`flex min-h-16 w-full items-center gap-4 rounded-lg border-2 px-4 text-left text-lg font-semibold ${on ? "border-border bg-secondary text-muted-foreground line-through" : "border-border bg-card text-card-foreground"}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
      >
        {on && <Check className="h-6 w-6" />}
      </span>
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 font-display text-lg uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
