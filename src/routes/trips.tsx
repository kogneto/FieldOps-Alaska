import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { AppShell } from "@/components/fo";
import { useToday } from "@/lib/offline";
import { useSites } from "@/lib/site-store";
import type { Site } from "@/lib/sites";
import { clearLegacyTrips, useLegacyTripCount, useTrips } from "@/lib/trip-store";
import {
  checklistProgress,
  dateRangeLabel,
  STATUS_LABEL,
  tripStatus,
  tripTitle,
  nextStep,
  stepLabel,
  type Trip,
} from "@/lib/trips";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { title: "Trips — FieldOps Alaska" },
      {
        name: "description",
        content: "Your trips: sites, how to get there, qualifications and checklists.",
      },
      { property: "og:title", content: "Trips — FieldOps Alaska" },
      { property: "og:description", content: "Glove-friendly trip planning that works offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TripsPage,
});

function TripsPage() {
  const trips = useTrips();
  const sites = useSites();
  const today = useToday();
  const legacy = useLegacyTripCount();

  const active = (trips ?? [])
    .filter((t) => tripStatus(t, today) !== "past")
    .sort((a, b) => a.start.localeCompare(b.start));
  const past = (trips ?? [])
    .filter((t) => tripStatus(t, today) === "past")
    .sort((a, b) => b.start.localeCompare(a.start));

  return (
    <AppShell title="Trips">
      <p className="text-base text-muted-foreground">
        A trip gathers the sites you're going to, how you'll get there, the qualifications they need
        and your checklists. Trips stay on this phone.
      </p>
      <Link
        to="/plan"
        className="mt-4 flex min-h-16 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-lg font-bold uppercase text-primary-foreground active:translate-y-0.5"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
        Plan a new trip
      </Link>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          to="/sites"
          className="flex min-h-14 items-center justify-center rounded-lg border-2 border-border px-3 text-center font-semibold active:bg-secondary"
        >
          Your sites
        </Link>
        <Link
          to="/qualifications"
          className="flex min-h-14 items-center justify-center rounded-lg border-2 border-border px-3 text-center font-semibold active:bg-secondary"
        >
          Your qualifications
        </Link>
      </div>

      {legacy > 0 && (
        <div className="mt-6 rounded-lg border-2 border-caution p-4">
          <p className="text-base">
            {legacy === 1 ? "1 older trip was" : `${legacy} older trips were`} planned on the sample
            sites, which are gone now that you type in your own. {legacy === 1 ? "It" : "They"}{" "}
            can't be opened.
          </p>
          <button
            type="button"
            onClick={clearLegacyTrips}
            className="mt-3 flex min-h-14 w-full items-center justify-center rounded-lg border-2 border-border px-4 font-bold uppercase active:bg-secondary"
          >
            Clear {legacy === 1 ? "it" : "them"}
          </button>
        </div>
      )}

      {trips === null || sites === null ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : trips.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">No trips yet.</p>
      ) : (
        <>
          {active.length > 0 && (
            <TripList title="Coming up" trips={active} sites={sites} today={today} />
          )}
          {past.length > 0 && (
            <TripList title="Past trips" trips={past} sites={sites} today={today} />
          )}
        </>
      )}
    </AppShell>
  );
}

function TripList({
  title,
  trips,
  sites,
  today,
}: {
  title: string;
  trips: Trip[];
  sites: Site[];
  today: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 font-display text-lg uppercase text-muted-foreground">{title}</h2>
      <div className="grid gap-2">
        {trips.map((trip) => {
          const { done, total } = checklistProgress(trip);
          const next = tripStatus(trip, today) === "past" ? undefined : nextStep(trip);
          const nextLabel = next ? stepLabel(trip, next, sites) : undefined;
          return (
            <Link
              key={trip.id}
              to="/trip"
              search={{ id: trip.id }}
              className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 border-border bg-card p-4 active:bg-secondary"
            >
              <span className="min-w-0">
                <span className="block break-words font-bold">{tripTitle(trip, sites)}</span>
                <span className="block text-sm text-muted-foreground">
                  {dateRangeLabel(trip)} · {STATUS_LABEL[tripStatus(trip, today)]}
                </span>
                {nextLabel && (
                  <span className="block break-words text-sm font-semibold">
                    Next: {nextLabel.title} · {nextLabel.where}
                  </span>
                )}
                <span className="block text-sm text-muted-foreground">
                  {trip.stops.length} site{trip.stops.length === 1 ? "" : "s"} · {done} of {total}{" "}
                  checklist items
                </span>
              </span>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
