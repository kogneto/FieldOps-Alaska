import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarPlus, Check, Lock, Plus, Trash2, Unlock } from "lucide-react";
import { AppShell } from "@/components/fo";
import { DirectionsLink, WhereInput } from "@/components/place-field";
import { fieldLabel, inputClass } from "@/components/site-form";
import { confidentialityRule, qualifications, siteKinds } from "@/lib/data";
import { useHydrated, useToday } from "@/lib/offline";
import { currentSites, deleteSite, updateSite, useSites } from "@/lib/site-store";
import {
  MAX_COMMUNITY,
  MAX_SITE_NAME,
  renameSite,
  setConfidentiality,
  setKind,
  setSiteWhere,
  toggleSiteQualification,
  type Site,
} from "@/lib/sites";
import { updateAllTrips, updateTrip, useTrips } from "@/lib/trip-store";
import {
  addStop,
  currentTrip,
  dateRangeLabel,
  includeNeeded,
  tripsUsingSite,
  tripTitle,
} from "@/lib/trips";

type Search = { id?: string | undefined };

export const Route = createFileRoute("/site")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s["id"] === "string" && s["id"].length <= 64 ? s["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Site — FieldOps Alaska" },
      { name: "description", content: "One of your sites, kept only on this phone." },
      { property: "og:title", content: "Site — FieldOps Alaska" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SitePage,
});

const backToSites = (
  <Link
    to="/sites"
    className="mb-2 flex min-h-14 items-center gap-2 text-base font-semibold text-muted-foreground"
  >
    <ArrowLeft className="h-5 w-5" />
    Your sites
  </Link>
);

// One page for every site, built ahead of time: the site id is in the URL and
// the site itself is in this phone's storage, so both are read after hydration.
// Feedback sent from here is never tied to the site.
function SitePage() {
  const search = Route.useSearch();
  const hydrated = useHydrated();
  const sites = useSites();
  if (!hydrated || sites === null) {
    return (
      <AppShell title="Site" back={backToSites}>
        <p className="text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }
  const site = sites.find((s) => s.id === search.id);
  if (!site) {
    return (
      <AppShell title="Site" back={backToSites}>
        <p className="text-base text-muted-foreground">
          This site isn't on this phone. Sites are kept only on the phone they were typed in on.
        </p>
      </AppShell>
    );
  }
  return <SiteDetail key={site.id} site={site} />;
}

// A change to a site's kind or qualifications can make a checklist needed on a
// trip it is on, so every trip is checked again afterwards.
function changeSite(id: string, change: (site: Site) => Site) {
  updateSite(id, change);
  const sites = currentSites();
  updateAllTrips((t) => includeNeeded(t, sites));
}

function SiteDetail({ site }: { site: Site }) {
  const navigate = useNavigate();
  const trips = useTrips();
  const [name, setName] = useState(site.name);
  const [community, setCommunity] = useState(site.community);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const usedBy = trips ? tripsUsingSite(trips, site.id) : [];
  const sites = currentSites();

  return (
    <AppShell title="Site" back={backToSites}>
      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className={fieldLabel}>Site name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              updateSite(site.id, (s) => renameSite(s, e.target.value, community));
            }}
            onBlur={() => setName(site.name)}
            maxLength={MAX_SITE_NAME}
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="grid gap-1">
          <span className={fieldLabel}>Village or town</span>
          <input
            value={community}
            onChange={(e) => {
              setCommunity(e.target.value);
              updateSite(site.id, (s) => renameSite(s, s.name, e.target.value));
            }}
            maxLength={MAX_COMMUNITY}
            placeholder="e.g. Bethel"
            autoComplete="off"
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-3 grid gap-2">
        <WhereInput
          label="Where it is"
          value={site.where}
          onChange={(where) => updateSite(site.id, (s) => setSiteWhere(s, where))}
        />
        <DirectionsLink where={site.where} label="Directions to the site" />
        <p className="text-xs text-muted-foreground">
          Directions send only this line to your maps app, never the site's name.
        </p>
      </div>

      <TripAction siteId={site.id} />

      <Section title="Confidentiality">
        <div className="grid grid-cols-2 gap-2">
          {(["open", "confidential"] as const).map((c) => {
            const on = site.confidentiality === c;
            const Icon = c === "open" ? Unlock : Lock;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => updateSite(site.id, (s) => setConfidentiality(s, c))}
                className={`flex min-h-16 items-center justify-center gap-2 rounded-lg border-2 px-3 font-bold uppercase ${on ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                {c === "open" ? "Open" : "Confidential"}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {confidentialityRule[site.confidentiality]} Set it to what the client has said.
        </p>
      </Section>

      <Section title="Kind of site">
        <p className="mb-2 text-sm text-muted-foreground">
          Decides which checklists a trip here needs.
        </p>
        <div className="grid gap-2">
          {siteKinds.map((kind) => {
            const on = site.kind === kind;
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={on}
                onClick={() => changeSite(site.id, (s) => setKind(s, on ? null : kind))}
                className={`flex min-h-14 items-center gap-3 rounded-lg border-2 px-4 text-left font-semibold ${on ? "border-primary bg-primary/10" : "border-border bg-card"}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
                >
                  {on && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                {kind}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Qualifications needed">
        <p className="mb-2 text-sm text-muted-foreground">
          What a technician must hold to work here. Trips list them for you to tick.
        </p>
        <div className="grid gap-2">
          {qualifications.map((q) => {
            const on = site.qualificationIds.includes(q.id);
            return (
              <button
                key={q.id}
                type="button"
                aria-pressed={on}
                onClick={() => changeSite(site.id, (s) => toggleSiteQualification(s, q.id))}
                className={`flex min-h-14 items-center gap-3 rounded-lg border-2 px-4 text-left font-semibold ${on ? "border-primary bg-primary/10" : "border-border bg-card"}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
                >
                  {on && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                {q.name}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Delete">
        {usedBy.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              This site is on {usedBy.length === 1 ? "a trip" : `${usedBy.length} trips`}. Remove it
              from {usedBy.length === 1 ? "that trip" : "them"} before deleting it.
            </p>
            <ul className="mt-2 grid gap-2">
              {usedBy.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/trip"
                    search={{ id: t.id }}
                    className="flex min-h-14 items-center rounded-lg border-2 border-border bg-card px-4 font-semibold active:bg-secondary"
                  >
                    {tripTitle(t, sites)}, {dateRangeLabel(t)}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              deleteSite(site.id);
              void navigate({ to: "/sites" });
            }}
            className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border-2 px-4 font-bold uppercase ${confirmDelete ? "border-destructive bg-destructive text-destructive-foreground" : "border-destructive text-destructive"}`}
          >
            <Trash2 className="h-5 w-5" />
            {confirmDelete ? "Tap again to delete" : "Delete site"}
          </button>
        )}
      </Section>
    </AppShell>
  );
}

// Starts a trip here, or adds the site to the trip under way or coming up.
// Waits for storage before showing anything.
function TripAction({ siteId }: { siteId: string }) {
  const trips = useTrips();
  const today = useToday();
  if (trips === null) return <div className="mt-4 min-h-16" />;
  const trip = currentTrip(trips, today);
  const sites = currentSites();
  const big =
    "mt-4 flex min-h-16 w-full items-center justify-center gap-3 rounded-lg px-4 text-lg font-bold uppercase active:translate-y-0.5";

  if (trip?.stops.some((s) => s.siteId === siteId)) {
    return (
      <Link to="/trip" search={{ id: trip.id }} className={`${big} border-2 border-ok text-ok`}>
        <Check className="h-6 w-6" />
        On your trip · Open it
      </Link>
    );
  }
  if (trip) {
    return (
      <>
        <button
          type="button"
          onClick={() => updateTrip(trip.id, (t) => addStop(t, siteId, currentSites()))}
          className={`${big} bg-primary text-primary-foreground`}
        >
          <Plus className="h-6 w-6" />
          Add to this trip
        </button>
        <p className="mt-1 text-sm text-muted-foreground">
          {tripTitle(trip, sites)}, {dateRangeLabel(trip)}
        </p>
        <Link
          to="/plan"
          search={{ site: siteId }}
          className="mt-2 flex min-h-14 items-center justify-center rounded-lg border-2 border-border px-4 font-semibold active:bg-secondary"
        >
          Plan a separate trip
        </Link>
      </>
    );
  }
  return (
    <Link
      to="/plan"
      search={{ site: siteId }}
      className={`${big} bg-primary text-primary-foreground`}
    >
      <CalendarPlus className="h-6 w-6" />
      Plan a trip here
    </Link>
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
