import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Car,
  Check,
  Lock,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { AppShell, ModeIcon } from "@/components/fo";
import { NewSiteForm } from "@/components/site-form";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { getOperator, getQualification, operators } from "@/lib/data";
import { useHydrated, useToday } from "@/lib/offline";
import { currentSites, useSites } from "@/lib/site-store";
import { siteSummary, type Site } from "@/lib/sites";
import { deleteTrip, updateTrip, useTrips } from "@/lib/trip-store";
import {
  addDays,
  addStop,
  checklistDefinition,
  dateRangeLabel,
  MAX_TRIP_DAYS,
  moveStop,
  neededWhenLabel,
  removeStop,
  setDates,
  setRoute,
  shareText,
  shortDate,
  sitesNotOnTrip,
  toggleItem,
  toggleQual,
  toggleSkip,
  tripQualifications,
  tripStatus,
  tripTitle,
  tripEnd,
  STATUS_LABEL,
  type Trip,
  type TripRoute,
} from "@/lib/trips";
import {
  needsAttention,
  qualStatus,
  showRecordFlags,
  statusLabel,
  useQualRecord,
} from "@/lib/qual-record";

type Search = { id?: string | undefined };

export const Route = createFileRoute("/trip")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s["id"] === "string" && s["id"].length <= 64 ? s["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Trip — FieldOps Alaska" },
      {
        name: "description",
        content: "A trip's sites, how to get there, qualifications and checklists.",
      },
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
  const sites = useSites();

  if (!hydrated || trips === null || sites === null) {
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
  return <TripDetail trip={trip} sites={sites} />;
}

function TripDetail({ trip, sites }: { trip: Trip; sites: Site[] }) {
  const today = useToday();
  const navigate = useNavigate();
  const [shareStatus, setShareStatus] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = tripStatus(trip, today);
  const change = (fn: (t: Trip) => Trip) => updateTrip(trip.id, fn);

  async function share() {
    const text = shareText(trip, sites);
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
        <h2 className="min-w-0 break-words text-xl font-bold leading-tight">
          {tripTitle(trip, sites)}
        </h2>
        <span className="shrink-0 rounded-sm bg-secondary px-2 py-1 font-mono text-xs uppercase">
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p className="mt-1 text-muted-foreground">{dateRangeLabel(trip)}</p>

      <div className="mt-5 grid gap-4">
        <Stepper
          label="First day"
          value={trip.start === today ? `Today, ${shortDate(trip.start)}` : shortDate(trip.start)}
          onMinus={() => change((t) => setDates(t, addDays(t.start, -1), t.days, currentSites()))}
          onPlus={() => change((t) => setDates(t, addDays(t.start, 1), t.days, currentSites()))}
        />
        <Stepper
          label="Length"
          value={`${trip.days} day${trip.days === 1 ? "" : "s"}`}
          onMinus={() => change((t) => setDates(t, t.start, t.days - 1, currentSites()))}
          onPlus={() => change((t) => setDates(t, t.start, t.days + 1, currentSites()))}
          minusDisabled={trip.days <= 1}
          plusDisabled={trip.days >= MAX_TRIP_DAYS}
        />
      </div>

      <Section title="Sites, in order">
        <div className="grid gap-3">
          {trip.stops.map((stop, index) => {
            const site = sites.find((s) => s.id === stop.siteId);
            const first = index === 0;
            const last = index === trip.stops.length - 1;
            return (
              <div key={stop.siteId} className="rounded-lg border-2 border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-mono font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    {site ? (
                      <>
                        <Link
                          to="/site"
                          search={{ id: site.id }}
                          className="flex min-h-14 items-center break-words text-lg font-bold text-card-foreground"
                        >
                          {site.name}
                        </Link>
                        {siteSummary(site) && (
                          <div className="text-sm text-muted-foreground">{siteSummary(site)}</div>
                        )}
                        {site.kind === null && (
                          <Link
                            to="/site"
                            search={{ id: site.id }}
                            className="mt-2 flex min-h-14 items-center gap-2 rounded-lg border-2 border-caution px-3 text-sm font-semibold active:bg-secondary"
                          >
                            <AlertTriangle className="h-5 w-5 shrink-0 text-caution" />
                            Say what kind of site this is and what it needs, so the right checklists
                            are included
                          </Link>
                        )}
                        {site.confidentiality === "confidential" && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-1 text-xs font-semibold uppercase">
                            <Lock className="h-3.5 w-3.5" />
                            Confidential
                          </span>
                        )}
                      </>
                    ) : (
                      <p className="flex min-h-14 items-center text-muted-foreground">
                        This site is no longer on this phone.
                      </p>
                    )}
                  </div>
                </div>

                {site && (
                  <RoutePicker
                    route={stop.route}
                    onChoose={(route) => change((t) => setRoute(t, stop.siteId, route))}
                  />
                )}

                <div className="mt-3 grid grid-cols-[auto_auto_minmax(0,1fr)] gap-2">
                  <button
                    type="button"
                    aria-label="Move earlier"
                    disabled={first}
                    onClick={() => change((t) => moveStop(t, stop.siteId, -1))}
                    className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-border active:bg-secondary disabled:opacity-40"
                  >
                    <ArrowUp className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move later"
                    disabled={last}
                    onClick={() => change((t) => moveStop(t, stop.siteId, 1))}
                    className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-border active:bg-secondary disabled:opacity-40"
                  >
                    <ArrowDown className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => change((t) => removeStop(t, stop.siteId))}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border px-3 font-semibold text-muted-foreground active:bg-secondary"
                  >
                    <X className="h-5 w-5" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <AddSites
          trip={trip}
          sites={sites}
          onAdd={(siteId) => change((t) => addStop(t, siteId, currentSites()))}
        />
      </Section>

      <QualificationsSection
        trip={trip}
        sites={sites}
        onToggle={(id) => change((t) => toggleQual(t, id))}
      />

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
                  <SkipNote checklistId={cl.id} auto={cl.autoSkipped === true} />
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
        Sends the plan as text, with site names. A plan with a confidential site starts with a
        warning to keep it with the technicians working these sites.
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

// How the technician gets to one site: an operator from the records, or
// driving themselves. The list stays open until something is chosen.
function RoutePicker({
  route,
  onChoose,
}: {
  route: TripRoute;
  onChoose: (route: TripRoute) => void;
}) {
  const [open, setOpen] = useState(false);
  const operator = route?.by === "operator" ? getOperator(route.operatorId) : undefined;
  const showList = open || route === null;

  const option = (selected: boolean) =>
    `flex min-h-14 w-full items-center gap-3 rounded-lg border-2 px-3 py-2 text-left ${selected ? "border-primary bg-primary/10" : "border-border bg-background"}`;

  return (
    <div className="mt-3">
      <div className="text-xs font-bold uppercase text-muted-foreground">Getting there</div>
      {!showList && (
        <div className="mt-1 flex items-center gap-2">
          <div className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg border-2 border-primary bg-primary/10 px-3 font-semibold">
            {operator ? (
              <ModeIcon mode={operator.mode} className="h-5 w-5 shrink-0 text-accent" />
            ) : (
              <Car className="h-5 w-5 shrink-0 text-accent" />
            )}
            <span className="min-w-0">{operator?.name ?? "Drive yourself"}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-14 shrink-0 items-center rounded-lg border-2 border-border px-4 text-sm font-bold uppercase active:bg-secondary"
          >
            Change
          </button>
        </div>
      )}
      {showList && (
        <div className="mt-1 grid gap-2">
          <button
            type="button"
            aria-pressed={route?.by === "self"}
            onClick={() => {
              onChoose({ by: "self" });
              setOpen(false);
            }}
            className={option(route?.by === "self")}
          >
            <Car className="h-5 w-5 shrink-0 text-accent" />
            <span className="font-semibold">Drive yourself</span>
          </button>
          {operators.map((o) => {
            const selected = route?.by === "operator" && route.operatorId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onChoose({ by: "operator", operatorId: o.id });
                  setOpen(false);
                }}
                className={option(selected)}
              >
                <ModeIcon mode={o.mode} className="h-5 w-5 shrink-0 text-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{o.name}</span>
                  <span className="block text-sm text-muted-foreground">{o.community}</span>
                </span>
                {selected && <Check className="h-5 w-5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Adds one of your sites to this trip, or a site typed in here.
function AddSites({
  trip,
  sites,
  onAdd,
}: {
  trip: Trip;
  sites: Site[];
  onAdd: (siteId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = sitesNotOnTrip(trip, sites);
  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-16 w-full items-center justify-center gap-2 rounded-lg border-2 border-accent px-4 text-lg font-bold uppercase text-accent active:bg-secondary"
      >
        <Plus className="h-5 w-5" />
        {open ? "Close" : "Add a site"}
      </button>
      {open && (
        <div className="mt-3 grid gap-3">
          {available.length > 0 && (
            <ul className="grid gap-2">
              {available.map((site) => (
                <li key={site.id}>
                  <button
                    type="button"
                    onClick={() => onAdd(site.id)}
                    className="flex min-h-16 w-full items-center gap-3 rounded-lg border-2 border-border bg-card px-4 py-2 text-left active:bg-secondary"
                  >
                    <Plus className="h-5 w-5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block font-semibold break-words">{site.name}</span>
                      {siteSummary(site) && (
                        <span className="block text-sm text-muted-foreground">
                          {siteSummary(site)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-lg border-2 border-border p-3">
            <div className="mb-2 text-sm font-bold uppercase text-muted-foreground">
              Type in a new site
            </div>
            <NewSiteForm submitLabel="Add to this trip" onAdded={(site) => onAdd(site.id)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Why a list is skipped: by hand, or because no site or month on the trip needs it.
function SkipNote({ checklistId, auto }: { checklistId: string; auto: boolean }) {
  const definition = auto ? checklistDefinition(checklistId) : undefined;
  return (
    <p className="mt-2 text-sm text-muted-foreground">
      {definition
        ? `Not needed for these sites and dates, so it starts skipped. Needed when ${neededWhenLabel(definition)}.`
        : "Skipped for this trip."}
    </p>
  );
}

// Each qualification the trip's sites need, ticked per trip. With a record of
// the technician's own qualifications on this phone, each also says whether it
// is in that record and whether it expires before the trip ends.
function QualificationsSection({
  trip,
  sites,
  onToggle,
}: {
  trip: Trip;
  sites: Site[];
  onToggle: (id: string) => void;
}) {
  const record = useQualRecord();
  const today = useToday();
  const ids = tripQualifications(trip, sites);
  if (ids.length === 0) return null;
  const end = tripEnd(trip);
  return (
    <Section title="Qualifications">
      <p className="mb-2 text-sm text-muted-foreground">
        Everything the trip's sites need, once each. Tick what you hold.
      </p>
      <ul className="grid gap-2">
        {ids.map((id) => {
          const status = showRecordFlags(record, trip, today)
            ? qualStatus(record, id, end, today)
            : null;
          return (
            <li key={id}>
              <TickRow
                on={trip.quals.includes(id)}
                label={getQualification(id)?.name ?? id}
                onToggle={() => onToggle(id)}
              />
              {status && (
                <p
                  className={`mt-1 flex items-center gap-1 px-1 text-sm ${needsAttention(status) ? "font-semibold text-caution" : "text-muted-foreground"}`}
                >
                  {needsAttention(status) && <AlertTriangle className="h-4 w-4 shrink-0" />}
                  {statusLabel(status)}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <Link
        to="/qualifications"
        className="mt-3 flex min-h-14 items-center justify-center rounded-lg border-2 border-border px-4 font-semibold active:bg-secondary"
      >
        Your qualifications
      </Link>
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
