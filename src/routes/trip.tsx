import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Building2,
  Car,
  Check,
  ChevronDown,
  Lock,
  Phone,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { AppShell, ModeIcon } from "@/components/fo";
import { ChecklistBody, LoadoutPanel } from "@/components/loadout";
import { checkProgress } from "@/lib/loadout";
import { DirectionsLink, PlaceField } from "@/components/place-field";
import { NewSiteForm } from "@/components/site-form";
import { TravelDocs } from "@/components/travel-docs";
import { deleteDocsForTrip, sweepOrphanDocs } from "@/lib/doc-store";
import { typedPlace, type Place } from "@/lib/places";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import {
  communitiesLabel,
  confidenceAdvice,
  getOperator,
  getQualification,
  meetingPlaces,
  operators,
  type Operator,
} from "@/lib/data";
import { useHydrated, useToday } from "@/lib/offline";
import { currentSites, useSites } from "@/lib/site-store";
import { siteSummary, type Site } from "@/lib/sites";
import { currentTrips, deleteTrip, updateTrip, useTrips } from "@/lib/trip-store";
import {
  addDays,
  addStop,
  checklistDefinition,
  checklistProgress,
  dateRangeLabel,
  isStepDone,
  MAX_TRIP_DAYS,
  moveStop,
  neededWhenLabel,
  nextStep,
  removeStop,
  setDates,
  setLodging,
  setMeet,
  setRoute,
  setStepDone,
  shareText,
  shortDate,
  sitesNotOnTrip,
  stepLabel,
  toggleItem,
  toggleQual,
  toggleSkip,
  tripQualifications,
  tripChecks,
  tripStatus,
  tripSteps,
  tripTitle,
  tripEnd,
  STATUS_LABEL,
  type Step,
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
        content:
          "A trip, step by step: the loadout, getting there, the checklists and getting home.",
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
  return <TripDetail key={trip.id} trip={trip} sites={sites} />;
}

const stepId = (key: string) => `step-${key.replace(/[^A-Za-z0-9-]/g, "-")}`;

// The trip follows its steps in order. The step the technician is on starts
// open; "Done" marks it and opens the next one.
function TripDetail({ trip, sites }: { trip: Trip; sites: Site[] }) {
  const today = useToday();
  const navigate = useNavigate();
  const [shareStatus, setShareStatus] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = tripStatus(trip, today);
  const steps = tripSteps(trip);
  const next = nextStep(trip);
  const [openKey, setOpenKey] = useState<string | null>(next?.key ?? null);
  const change = (fn: (t: Trip) => Trip) => updateTrip(trip.id, fn);

  function mark(step: Step, done: boolean) {
    change((t) => setStepDone(t, step.key, done));
    if (!done) return;
    const after = nextStep(setStepDone(trip, step.key, true));
    setOpenKey(after?.key ?? null);
    if (after) {
      // Wait for the step above to collapse before scrolling to the next one.
      requestAnimationFrame(() =>
        document.getElementById(stepId(after.key))?.scrollIntoView({ block: "start" }),
      );
    }
  }

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

  const nextLabel = next ? stepLabel(trip, next, sites) : undefined;

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
      <p className="mt-2 text-base font-semibold">
        {nextLabel
          ? `Next: ${nextLabel.title} · ${nextLabel.where}`
          : "Trip done: the return checklist is marked done."}
      </p>

      <Section title="Steps">
        <ol className="grid gap-2">
          {steps.map((step) => (
            <li key={step.key} id={stepId(step.key)} className="scroll-mt-40">
              <StepCard
                trip={trip}
                sites={sites}
                step={step}
                isNext={step.key === next?.key}
                open={openKey === step.key}
                onToggle={() => setOpenKey(openKey === step.key ? null : step.key)}
                onMark={(done) => mark(step, done)}
                change={change}
              />
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Plan">
        <div className="grid gap-4">
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

        <h3 className="mt-6 mb-2 text-xs font-bold uppercase text-muted-foreground">
          Sites, in the order they're worked
        </h3>
        <div className="grid gap-3">
          {trip.stops.map((stop, index) => (
            <SiteCard
              key={stop.siteId}
              site={sites.find((s) => s.id === stop.siteId)}
              index={index}
              first={index === 0}
              last={index === trip.stops.length - 1}
              onMove={(by) => change((t) => moveStop(t, stop.siteId, by))}
              onRemove={() => {
                change((t) => removeStop(t, stop.siteId));
                void sweepOrphanDocs(currentTrips());
              }}
            />
          ))}
        </div>
        <AddSites
          trip={trip}
          sites={sites}
          onAdd={(siteId) => change((t) => addStop(t, siteId, currentSites()))}
        />
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
          void deleteDocsForTrip(trip.id);
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

// ---- One step ------------------------------------------------------------------

function stepCount(trip: Trip, step: Step): { done: number; total: number } | null {
  switch (step.kind) {
    case "ready":
      return checklistProgress(trip);
    case "loadout":
    case "arrival":
    case "departure":
    case "return":
      return checkProgress(trip.loadout, tripChecks(trip), step.key);
    default:
      return null;
  }
}

function StepCard({
  trip,
  sites,
  step,
  isNext,
  open,
  onToggle,
  onMark,
  change,
}: {
  trip: Trip;
  sites: Site[];
  step: Step;
  isNext: boolean;
  open: boolean;
  onToggle: () => void;
  onMark: (done: boolean) => void;
  change: (fn: (t: Trip) => Trip) => void;
}) {
  const done = isStepDone(trip, step.key);
  const { title, where } = stepLabel(trip, step, sites);
  const count = stepCount(trip, step);

  return (
    <div className={`rounded-lg border-2 bg-card ${isNext ? "border-primary" : "border-border"}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${done ? "border-ok bg-ok text-ok-foreground" : isNext ? "border-primary" : "border-muted-foreground"}`}
        >
          {done ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            isNext && <span className="h-3 w-3 rounded-full bg-primary" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block font-bold ${done ? "text-muted-foreground" : ""}`}>{title}</span>
          <span className="block break-words text-sm text-muted-foreground">{where}</span>
        </span>
        {count && count.total > 0 && (
          <span className="shrink-0 font-mono text-sm">
            {count.done}/{count.total}
          </span>
        )}
        <ChevronDown className={`h-5 w-5 shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="grid gap-4 border-t-2 border-border p-3">
          <StepBody trip={trip} sites={sites} step={step} change={change} />
          {done ? (
            <button
              type="button"
              onClick={() => onMark(false)}
              className="flex min-h-14 w-full items-center justify-center rounded-lg border-2 border-border px-4 font-bold uppercase text-muted-foreground active:bg-secondary"
            >
              Done · Tap to undo
            </button>
          ) : (
            <Button size="lg" onClick={() => onMark(true)} className="w-full uppercase">
              <Check className="h-5 w-5" />
              {step.kind === "return" ? "Done · Finish the trip" : "Done · Next step"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function StepBody({
  trip,
  sites,
  step,
  change,
}: {
  trip: Trip;
  sites: Site[];
  step: Step;
  change: (fn: (t: Trip) => Trip) => void;
}) {
  const site = step.siteId ? sites.find((s) => s.id === step.siteId) : undefined;
  switch (step.kind) {
    case "ready":
      return (
        <>
          <PrepChecklists trip={trip} change={change} />
          <Qualifications
            trip={trip}
            sites={sites}
            onToggle={(id) => change((t) => toggleQual(t, id))}
          />
        </>
      );
    case "loadout":
      return (
        <>
          <LoadoutPanel trip={trip} />
          <h3 className="text-xs font-bold uppercase text-muted-foreground">Pre-loadout</h3>
          <ChecklistBody trip={trip} checkKey="pre" />
        </>
      );
    case "travel": {
      const stop = trip.stops.find((s) => s.siteId === step.siteId);
      if (!stop || !site)
        return <p className="text-muted-foreground">This site is no longer on this phone.</p>;
      // In the order they're needed: the operator, where you meet them, the
      // lodging, then the site.
      return (
        <>
          <TravelTo
            route={stop.route}
            onChoose={(route) => change((t) => setRoute(t, stop.siteId, route))}
          />
          {stop.route?.by !== "self" && (
            <PlaceField
              title="Where you meet the operator"
              namePlaceholder="e.g. Bethel airport, freight counter"
              place={stop.meet}
              onChange={(p) => change((t) => setMeet(t, stop.siteId, typedPlace(p.name, p.where)))}
            >
              {stop.meet === null && stop.route?.by === "operator" && (
                <OfficePicker
                  operator={getOperator(stop.route.operatorId)}
                  onPick={(p) => change((t) => setMeet(t, stop.siteId, p))}
                />
              )}
            </PlaceField>
          )}
          <PlaceField
            title="Lodging"
            namePlaceholder="e.g. Kuskokwim Inn"
            place={stop.lodging}
            onChange={(p) => change((t) => setLodging(t, stop.siteId, typedPlace(p.name, p.where)))}
          />
          <div className="grid gap-2 rounded-lg border-2 border-border p-3">
            <div className="font-bold">The site</div>
            {site.where ? (
              <DirectionsLink where={site.where} label="Directions to the site" />
            ) : (
              <p className="text-sm text-muted-foreground">
                No location yet. Add one on the site's page, or there with "Use where I am now".
              </p>
            )}
            <Link
              to="/site"
              search={{ id: site.id }}
              className="flex min-h-14 items-center justify-center rounded-lg border-2 border-border px-4 font-semibold active:bg-secondary"
            >
              Open the site's page
            </Link>
          </div>
          <TravelDocs tripId={trip.id} stepKey={step.key} />
        </>
      );
    }
    case "arrival":
    case "departure":
    case "return":
      return <ChecklistBody trip={trip} checkKey={step.key} />;
    case "work":
      return site ? (
        <>
          <p className="text-base">Do the job at {site.name}.</p>
          <Link
            to="/site"
            search={{ id: site.id }}
            className="flex min-h-14 items-center justify-center rounded-lg border-2 border-border px-4 font-semibold active:bg-secondary"
          >
            Open the site's page
          </Link>
        </>
      ) : (
        <p className="text-muted-foreground">This site is no longer on this phone.</p>
      );
    case "travel-home":
      return (
        <>
          <p className="text-base">Travel back to home base once the loadout has shipped.</p>
          <PlaceField
            title="Where you meet the operator"
            namePlaceholder="e.g. Bethel airport, Alaska Airlines"
            place={trip.homeMeet}
            onChange={(p) => change((t) => setMeet(t, null, typedPlace(p.name, p.where)))}
          />
          <TravelDocs tripId={trip.id} stepKey={step.key} />
        </>
      );
  }
}

// How the technician gets to one site, with a Call button for the operator.
function TravelTo({ route, onChoose }: { route: TripRoute; onChoose: (route: TripRoute) => void }) {
  const operator = route?.by === "operator" ? getOperator(route.operatorId) : undefined;
  return (
    <div className="grid gap-3">
      {operator && (
        <div>
          <a
            href={`tel:${operator.phone}`}
            className="flex min-h-16 items-center justify-center gap-3 rounded-lg bg-primary px-4 text-lg font-bold uppercase text-primary-foreground active:translate-y-0.5"
          >
            <Phone className="h-6 w-6" />
            Call {operator.phone}
          </a>
          <p className="mt-1 text-sm text-muted-foreground">
            {operator.name}. {confidenceAdvice[operator.source.confidence]}
          </p>
          <Link
            to="/operators/$id"
            params={{ id: operator.id }}
            className="mt-2 flex min-h-14 items-center justify-center rounded-lg border-2 border-border px-4 font-semibold active:bg-secondary"
          >
            Open the operator's page
          </Link>
        </div>
      )}
      <RoutePicker route={route} onChoose={onChoose} />
    </div>
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
    <div>
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
                  <span className="block text-sm text-muted-foreground">
                    {communitiesLabel(o.communities)}
                  </span>
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

// The chosen operator's offices that have an address, so where the technician
// meets it fills in with one tap. Shown only while nothing has been typed there,
// so it never replaces what the technician wrote.
function OfficePicker({
  operator,
  onPick,
}: {
  operator: Operator | undefined;
  onPick: (place: Place) => void;
}) {
  const [open, setOpen] = useState(false);
  const offices = operator ? meetingPlaces(operator) : [];
  if (!operator || offices.length === 0) return null;
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-accent px-4 font-semibold active:bg-secondary"
      >
        <Building2 className="h-5 w-5 shrink-0" />
        {offices.length === 1 ? "Use its office" : `Pick one of its ${offices.length} offices`}
      </button>
    );
  }
  return (
    <div className="grid gap-2">
      {offices.map((office) => (
        <button
          key={`${office.community}-${office.name}`}
          type="button"
          onClick={() =>
            onPick(
              typedPlace(
                `${operator.name}, ${office.community} ${office.name.toLowerCase()}`,
                office.where ?? "",
              ),
            )
          }
          className="flex min-h-14 w-full flex-col justify-center rounded-lg border-2 border-border bg-background px-3 py-2 text-left active:bg-secondary"
        >
          <span className="font-semibold">
            {office.community} · {office.name}
          </span>
          <span className="text-sm text-muted-foreground">{office.where}</span>
        </button>
      ))}
    </div>
  );
}

// ---- Planning --------------------------------------------------------------------

function SiteCard({
  site,
  index,
  first,
  last,
  onMove,
  onRemove,
}: {
  site: Site | undefined;
  index: number;
  first: boolean;
  last: boolean;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
}) {
  // Taking a site off the trip drops its ticks, step marks and travel
  // documents, so it takes a second tap.
  const [confirmRemove, setConfirmRemove] = useState(false);
  return (
    <div className="rounded-lg border-2 border-border bg-card p-4">
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
                  Say what kind of site this is and what it needs, so the right checklists are
                  included
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
      <div className="mt-3 grid grid-cols-[auto_auto_minmax(0,1fr)] gap-2">
        <button
          type="button"
          aria-label="Move earlier"
          disabled={first}
          onClick={() => onMove(-1)}
          className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-border active:bg-secondary disabled:opacity-40"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="Move later"
          disabled={last}
          onClick={() => onMove(1)}
          className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-border active:bg-secondary disabled:opacity-40"
        >
          <ArrowDown className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!confirmRemove) {
              setConfirmRemove(true);
              return;
            }
            onRemove();
          }}
          className={`flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 px-3 font-semibold ${confirmRemove ? "border-destructive bg-destructive text-destructive-foreground" : "border-border text-muted-foreground active:bg-secondary"}`}
        >
          <X className="h-5 w-5" />
          {confirmRemove ? "Tap again" : "Remove"}
        </button>
      </div>
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
                      <span className="block break-words font-semibold">{site.name}</span>
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

// ---- Getting ready ---------------------------------------------------------------

function PrepChecklists({ trip, change }: { trip: Trip; change: (fn: (t: Trip) => Trip) => void }) {
  return (
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
function Qualifications({
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
    <div>
      <h3 className="font-display text-lg uppercase leading-tight">Qualifications</h3>
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
    </div>
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
