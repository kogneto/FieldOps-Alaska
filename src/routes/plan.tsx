import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { AppShell, ModeIcon } from "@/components/fo";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { getOperator, getSite } from "@/lib/data";
import { useHydrated, useToday } from "@/lib/offline";
import { addTrip, newTripId } from "@/lib/trip-store";
import {
  addDays,
  chooseRoute,
  createTrip,
  dateRangeLabel,
  MAX_TRIP_DAYS,
  shortDate,
  tripMonths,
} from "@/lib/trips";

type Search = { site?: string | undefined };

export const Route = createFileRoute("/plan")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const site = s["site"];
    return { site: typeof site === "string" && getSite(site) ? site : undefined };
  },
  head: () => ({
    meta: [
      { title: "Plan a trip — FieldOps Alaska" },
      { name: "description", content: "Pick the dates for a trip to a site." },
      { property: "og:title", content: "Plan a trip — FieldOps Alaska" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PlanPage,
});

// The second of the two taps that start a trip: the site page's "Plan a trip"
// opens this with today and one day filled in, and "Start trip" creates it.
function PlanPage() {
  const search = Route.useSearch();
  const hydrated = useHydrated();
  const today = useToday();
  const navigate = useNavigate();
  const [chosenStart, setChosenStart] = useState<string | null>(null);
  const [days, setDays] = useState(1);

  const site = hydrated && search.site ? getSite(search.site) : undefined;
  if (!hydrated) {
    return (
      <AppShell title="Plan a trip">
        <p className="text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }
  if (!site) {
    return (
      <AppShell title="Plan a trip">
        <p className="text-base text-muted-foreground">
          Trips start from a site. Find one, then tap Plan a trip.
        </p>
        <Link
          to="/directory"
          className="mt-4 flex min-h-16 items-center justify-center rounded-lg bg-primary px-4 text-lg font-bold uppercase text-primary-foreground"
        >
          Find a site
        </Link>
      </AppShell>
    );
  }

  // Never earlier than today; if today moves past a chosen start, follow it.
  const start = chosenStart && chosenStart >= today ? chosenStart : today;
  const route = site.routes[chooseRoute(site, tripMonths({ start, days }))];
  const operator = route?.operatorId ? getOperator(route.operatorId) : undefined;

  function startTrip() {
    if (!site) return;
    const trip = createTrip({ id: newTripId(), siteId: site.id, start, days });
    addTrip(trip);
    void navigate({ to: "/trip", search: { id: trip.id } });
  }

  return (
    <AppShell
      title="Plan a trip"
      back={
        <Link
          to="/sites/$id"
          params={{ id: site.id }}
          className="mb-2 flex min-h-14 items-center gap-2 text-base font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          {site.name}
        </Link>
      }
    >
      <p className="text-lg font-bold">{site.name}</p>
      <p className="text-muted-foreground">
        {site.community}, {site.region}
      </p>

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

      {route && (
        <div className="mt-4 rounded-lg border-2 border-border bg-card p-4">
          <div className="text-xs font-bold uppercase text-muted-foreground">Getting there</div>
          <div className="mt-1 flex items-center gap-2 font-semibold">
            <ModeIcon mode={route.mode} className="h-5 w-5 text-accent" />
            {operator?.name ?? "Drive yourself"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{route.how}</p>
        </div>
      )}

      <Button size="lg" onClick={startTrip} className="mt-6 w-full uppercase">
        <Play className="h-5 w-5" />
        Start trip
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">
        You can change the dates, add sites and choose how to get there on the trip.
      </p>
    </AppShell>
  );
}
