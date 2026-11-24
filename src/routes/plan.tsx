import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Play, RadioTower } from "lucide-react";
import { AppShell } from "@/components/fo";
import { NewSiteForm } from "@/components/site-form";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { useHydrated, useToday } from "@/lib/offline";
import { currentSites, useSites } from "@/lib/site-store";
import { siteSummary, type Site } from "@/lib/sites";
import { addTrip, newTripId } from "@/lib/trip-store";
import { addDays, createTrip, dateRangeLabel, MAX_TRIP_DAYS, shortDate } from "@/lib/trips";

type Search = { site?: string | undefined };

export const Route = createFileRoute("/plan")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const site = s["site"];
    return { site: typeof site === "string" && site.length <= 64 ? site : undefined };
  },
  head: () => ({
    meta: [
      { title: "Plan a trip — FieldOps Alaska" },
      { name: "description", content: "Pick a site and the dates for a trip." },
      { property: "og:title", content: "Plan a trip — FieldOps Alaska" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PlanPage,
});

// Starting a trip: pick one of your sites (or type in a new one), then the
// dates, then "Start trip". A site page's "Plan a trip here" skips the pick.
function PlanPage() {
  const search = Route.useSearch();
  const hydrated = useHydrated();
  const sites = useSites();

  if (!hydrated || sites === null) {
    return (
      <AppShell title="Plan a trip">
        <p className="text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }
  const site = sites.find((s) => s.id === search.site);
  return site ? <PickDates site={site} /> : <PickSite sites={sites} />;
}

function PickSite({ sites }: { sites: Site[] }) {
  const navigate = useNavigate();
  const pick = (id: string) => void navigate({ to: "/plan", search: { site: id } });
  return (
    <AppShell
      title="Plan a trip"
      back={
        <Link
          to="/trips"
          className="mb-2 flex min-h-14 items-center gap-2 text-base font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Trips
        </Link>
      }
    >
      <p className="text-base text-muted-foreground">
        Which site is first? You can add more sites on the trip.
      </p>
      {sites.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {sites.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => pick(s.id)}
                className="flex min-h-16 w-full items-center gap-3 rounded-lg border-2 border-border bg-card px-4 py-2 text-left active:bg-secondary"
              >
                <RadioTower className="h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block font-bold break-words">{s.name}</span>
                  {siteSummary(s) && (
                    <span className="block text-sm text-muted-foreground">{siteSummary(s)}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <section className="mt-8">
        <h2 className="mb-2 font-display text-lg uppercase text-muted-foreground">
          {sites.length > 0 ? "Or type in a new site" : "Type in the site"}
        </h2>
        <NewSiteForm submitLabel="Add and continue" onAdded={(s) => pick(s.id)} />
      </section>
    </AppShell>
  );
}

function PickDates({ site }: { site: Site }) {
  const today = useToday();
  const navigate = useNavigate();
  const [chosenStart, setChosenStart] = useState<string | null>(null);
  const [days, setDays] = useState(1);

  // Never earlier than today; if today moves past a chosen start, follow it.
  const start = chosenStart && chosenStart >= today ? chosenStart : today;

  function startTrip() {
    const trip = createTrip({
      id: newTripId(),
      siteId: site.id,
      start,
      days,
      sites: currentSites(),
    });
    addTrip(trip);
    void navigate({ to: "/trip", search: { id: trip.id } });
  }

  return (
    <AppShell
      title="Plan a trip"
      back={
        <Link
          to="/plan"
          className="mb-2 flex min-h-14 items-center gap-2 text-base font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Pick another site
        </Link>
      }
    >
      <p className="text-lg font-bold break-words">{site.name}</p>
      {siteSummary(site) && <p className="text-muted-foreground">{siteSummary(site)}</p>}

      <div className="mt-5 grid gap-4">
        <Stepper
          label="First day"
          value={start === today ? `Today, ${shortDate(start)}` : shortDate(start)}
          onMinus={() => setChosenStart(addDays(start, -1))}
          onPlus={() => setChosenStart(addDays(start, 1))}
          minusDisabled={start <= today}
        />
        <Stepper
          label="Length"
          value={`${days} day${days === 1 ? "" : "s"}`}
          onMinus={() => setDays(days - 1)}
          onPlus={() => setDays(days + 1)}
          minusDisabled={days <= 1}
          plusDisabled={days >= MAX_TRIP_DAYS}
        />
      </div>
      <p className="mt-3 text-base">{dateRangeLabel({ start, days })}</p>

      <Button size="lg" onClick={startTrip} className="mt-6 w-full uppercase">
        <Play className="h-5 w-5" />
        Start trip
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">
        On the trip you can change the dates, add sites and choose how to get to each.
      </p>
    </AppShell>
  );
}
