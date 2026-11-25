import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ExternalLink, ListChecks, MapPin, RadioTower, Search } from "lucide-react";
import { AppShell, Disclaimer } from "@/components/fo";
import { officialLinks, operators, regions } from "@/lib/data";
import { useSites } from "@/lib/site-store";
import { useSaved } from "@/lib/store";
import { useToday } from "@/lib/offline";
import { useTrips } from "@/lib/trip-store";
import {
  currentTrip,
  dateRangeLabel,
  nextStep,
  STATUS_LABEL,
  stepLabel,
  tripStatus,
  tripTitle,
} from "@/lib/trips";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FieldOps Alaska — Field companion for telecom techs" },
      {
        name: "description",
        content:
          "Plan trips to your Alaska telecom sites, with operators and checklists — works offline.",
      },
      { property: "og:title", content: "FieldOps Alaska" },
      { property: "og:description", content: "Reach the site, get in, get the job done, get out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { saved } = useSaved();
  const sites = useSites();
  const savedOperators = operators.filter((o) => saved.includes(o.id)).length;
  return (
    <AppShell title="FieldOps Alaska">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase text-muted-foreground">Remote field companion</p>
        <p className="font-display text-4xl uppercase leading-tight text-primary">Alaska</p>
      </div>

      <Link
        to="/trips"
        className="flex min-h-20 items-center gap-4 rounded-lg border-b-4 border-accent bg-foreground px-5 text-lg font-bold text-background active:translate-y-0.5"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-background text-primary">
          <ListChecks className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <span>Trips & checklists</span>
      </Link>
      <TripNow />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link
          to="/sites"
          className="flex min-h-16 items-center justify-center gap-2 rounded-lg bg-primary px-3 font-bold uppercase text-primary-foreground active:translate-y-0.5"
        >
          <RadioTower className="h-6 w-6 shrink-0" strokeWidth={2.5} />
          Your sites
        </Link>
        <Link
          to="/directory"
          className="flex min-h-16 items-center justify-center gap-2 rounded-lg border-2 border-border bg-card px-3 font-bold uppercase active:bg-secondary"
        >
          <Search className="h-6 w-6 shrink-0" strokeWidth={2.5} />
          Operators
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat n={sites === null ? "–" : String(sites.length)} label="Your sites" />
        <Stat n={String(operators.length)} label="Operators" />
        <Stat n={String(savedOperators)} label="Saved" />
      </div>

      <h2 className="mt-8 font-display text-lg uppercase text-foreground">Operators by region</h2>
      <div className="mt-2 grid gap-2">
        {regions.map((r) => (
          <Link
            key={r}
            to="/directory"
            search={{ region: r }}
            className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 border-border bg-card px-4 font-bold text-card-foreground active:bg-secondary"
          >
            <span className="flex min-w-0 items-center gap-3">
              <MapPin className="h-6 w-6 shrink-0 text-primary" strokeWidth={2.5} />
              {r}
            </span>
            <span className="shrink-0 font-mono text-sm text-accent">
              {operators.filter((o) => o.regions.includes(r)).length} operators
            </span>
          </Link>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg uppercase text-foreground">Official conditions</h2>
      <p className="text-sm text-muted-foreground">
        Live status isn't in the app yet — check these official sources.
      </p>
      <div className="mt-2 grid gap-2">
        {officialLinks.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-16 items-center justify-between gap-3 rounded-lg border-2 border-border px-4 text-base font-semibold active:bg-secondary"
          >
            {l.label} <ExternalLink className="h-5 w-5 shrink-0 text-accent" />
          </a>
        ))}
      </div>
      <Disclaimer />
    </AppShell>
  );
}

// The trip under way or coming up next, and its next step, one tap away.
function TripNow() {
  const trips = useTrips();
  const sites = useSites();
  const today = useToday();
  if (trips === null || sites === null) return null;
  const trip = currentTrip(trips, today);
  if (!trip) return null;
  const next = nextStep(trip);
  const label = next ? stepLabel(trip, next, sites) : undefined;
  return (
    <Link
      to="/trip"
      search={{ id: trip.id }}
      className="mt-3 grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 border-primary bg-card p-4 active:bg-secondary"
    >
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase text-muted-foreground">
          {STATUS_LABEL[tripStatus(trip, today)]} · {dateRangeLabel(trip)}
        </span>
        <span className="block break-words font-bold">{tripTitle(trip, sites)}</span>
        {label && (
          <span className="block break-words text-sm font-semibold text-primary">
            Next: {label.title} · {label.where}
          </span>
        )}
      </span>
      <ChevronRight className="h-6 w-6 text-muted-foreground" />
    </Link>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-lg border-2 border-border bg-card p-3 text-center">
      <div className="font-display text-3xl text-foreground">{n}</div>
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
