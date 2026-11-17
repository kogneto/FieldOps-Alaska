import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarPlus,
  Check,
  Lock,
  MapPin,
  Plus,
  ShieldAlert,
  Snowflake,
} from "lucide-react";
import { AppShell, Disclaimer, ModeIcon, SaveButton, SourceTag } from "@/components/fo";
import {
  confidentialityRule,
  getOperator,
  getQualification,
  getSite,
  monthsLabel,
  type Route as SiteRoute,
} from "@/lib/data";
import { mapsUrl, platformFrom } from "@/lib/maps";
import { useToday } from "@/lib/offline";
import { updateTrip, useTrips } from "@/lib/trip-store";
import { addStop, currentTrip, dateRangeLabel, tripTitle } from "@/lib/trips";

export const Route = createFileRoute("/sites/$id")({
  loader: ({ params }) => {
    const site = getSite(params.id);
    if (!site) throw notFound();
    return { site };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.site.name ?? "Site"} — FieldOps Alaska` },
      {
        name: "description",
        content: `Access notes, seasonal constraints and qualifications for ${loaderData?.site.name ?? "this site"}.`,
      },
      { property: "og:title", content: `${loaderData?.site.name ?? "Site"} — FieldOps Alaska` },
      { property: "og:description", content: "Site access and prep details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => (
    <AppShell title="Not found">
      <Link
        to="/directory"
        className="flex min-h-14 items-center justify-center rounded-lg border-2 border-primary px-4 font-bold uppercase text-primary"
      >
        Back to directory
      </Link>
    </AppShell>
  ),
  errorComponent: () => (
    <AppShell title="Error">
      <p>Couldn't load this site.</p>
    </AppShell>
  ),
  component: SitePage,
});

function SitePage() {
  const { site } = Route.useLoaderData();
  return (
    <AppShell
      title={site.name}
      recordId={site.id}
      back={
        <Link
          to="/directory"
          className="mb-2 flex min-h-14 items-center gap-2 text-base font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Directory
        </Link>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="text-muted-foreground">
            {site.kind} · {site.community}, {site.region}
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {site.lat.toFixed(2)}, {site.lng.toFixed(2)}
          </div>
        </div>
        <SaveButton id={site.id} />
      </div>
      <div className="mt-3">
        <SourceTag source={site.source} showAdvice />
      </div>
      <OpenInMaps lat={site.lat} lng={site.lng} />
      <TripAction siteId={site.id} />

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="flex items-center gap-1 rounded-sm bg-secondary px-2 py-1 text-xs font-semibold uppercase">
          <Lock className="h-3.5 w-3.5" />
          {site.confidentiality === "open" ? "Open" : "Confidential"}
        </span>
        {site.escort && (
          <span className="flex items-center gap-1 rounded-sm bg-caution px-2 py-1 text-xs font-bold uppercase text-caution-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            Escort required
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {confidentialityRule[site.confidentiality]}
      </p>

      <Section title="Access">
        <ul className="grid gap-2">
          {site.access.map((a) => (
            <li
              key={a}
              className="rounded-lg border-2 border-border bg-card p-4 text-card-foreground"
            >
              {a}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Gate codes and keys come from client dispatch — never stored here.
        </p>
      </Section>

      <Section title="Seasonal">
        <p className="flex gap-3 rounded-lg border-2 border-border bg-card p-4">
          <Snowflake className="h-6 w-6 shrink-0 text-accent" />
          {site.seasonal}
        </p>
      </Section>

      <Section title="Qualifications">
        <ul className="grid gap-2">
          {site.qualificationIds.map((id) => (
            <li
              key={id}
              className="flex min-h-16 items-center gap-3 rounded-lg border-2 border-border bg-card p-4"
            >
              <BadgeCheck className="h-6 w-6 shrink-0 text-ok" />
              {getQualification(id)?.name ?? id}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          A prep reminder only — not an authorization decision.
        </p>
      </Section>

      <Section title="Getting there">
        <div className="grid gap-2">
          {site.routes.map((route, i) => (
            <RouteCard key={i} route={route} />
          ))}
        </div>
      </Section>

      <Disclaimer />
    </AppShell>
  );
}

// The first of the two taps that start a trip, or "Add to this trip" when a
// trip is under way or coming up. Waits for storage before showing anything.
function TripAction({ siteId }: { siteId: string }) {
  const trips = useTrips();
  const today = useToday();
  if (trips === null) return <div className="mt-3 min-h-16" />;
  const trip = currentTrip(trips, today);
  const big =
    "mt-3 flex min-h-16 w-full items-center justify-center gap-3 rounded-lg px-4 text-lg font-bold uppercase active:translate-y-0.5";

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
          onClick={() => updateTrip(trip.id, (t) => addStop(t, siteId))}
          className={`${big} bg-primary text-primary-foreground`}
        >
          <Plus className="h-6 w-6" />
          Add to this trip
        </button>
        <p className="mt-1 text-sm text-muted-foreground">
          {tripTitle(trip)}, {dateRangeLabel(trip)}
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
      Plan a trip
    </Link>
  );
}

// One way in: who takes you (or "Drive yourself"), when it works and how.
function RouteCard({ route }: { route: SiteRoute }) {
  const operator = route.operatorId ? getOperator(route.operatorId) : undefined;
  const body = (
    <>
      <div className="flex items-center gap-3 font-semibold">
        <ModeIcon mode={route.mode} className="h-5 w-5 shrink-0 text-accent" />
        <span className="min-w-0 flex-1">{operator?.name ?? "Drive yourself"}</span>
        <span className="shrink-0 rounded-sm bg-secondary px-2 py-0.5 font-mono text-xs uppercase">
          {monthsLabel(route.months)}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{route.how}</p>
    </>
  );
  const className = "block min-h-16 rounded-lg border-2 border-border bg-card p-4";
  return operator ? (
    <Link
      to="/operators/$id"
      params={{ id: operator.id }}
      className={`${className} active:bg-secondary`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

// Hands the coordinates to the phone's own maps app. The href is the web
// fallback; on a phone the click handler swaps in the native maps link.
function OpenInMaps({ lat, lng }: { lat: number; lng: number }) {
  return (
    <a
      href={mapsUrl("other", lat, lng)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        const platform = platformFrom(navigator.userAgent, navigator.maxTouchPoints);
        if (platform === "other") return;
        e.preventDefault();
        window.location.href = mapsUrl(platform, lat, lng);
      }}
      className="mt-4 flex min-h-16 items-center justify-center gap-3 rounded-lg border-2 border-accent px-4 text-lg font-bold uppercase text-accent active:bg-secondary"
    >
      <MapPin className="h-6 w-6" />
      Open in maps
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-display text-lg uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
