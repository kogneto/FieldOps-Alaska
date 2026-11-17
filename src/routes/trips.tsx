import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { AppShell } from "@/components/fo";
import { useToday } from "@/lib/offline";
import { useTrips } from "@/lib/trip-store";
import {
  checklistProgress,
  dateRangeLabel,
  STATUS_LABEL,
  tripStatus,
  tripTitle,
  type Trip,
} from "@/lib/trips";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { title: "Trips — FieldOps Alaska" },
      {
        name: "description",
        content: "Your trips: sites, how to get there, qualifications and prep checklists.",
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
  const today = useToday();

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
        and your prep checklists. Trips stay on this phone.
      </p>
      <Link
        to="/directory"
        className="mt-4 flex min-h-16 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-lg font-bold uppercase text-primary-foreground active:translate-y-0.5"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
        Plan a new trip
      </Link>
      <p className="mt-1 text-sm text-muted-foreground">Pick a site, then tap Plan a trip.</p>

      {trips === null ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : trips.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">No trips yet.</p>
      ) : (
        <>
          {active.length > 0 && <TripList title="Coming up" trips={active} today={today} />}
          {past.length > 0 && <TripList title="Past trips" trips={past} today={today} />}
        </>
      )}
    </AppShell>
  );
}

function TripList({ title, trips, today }: { title: string; trips: Trip[]; today: string }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 font-display text-lg uppercase text-muted-foreground">{title}</h2>
      <div className="grid gap-2">
        {trips.map((trip) => {
          const { done, total } = checklistProgress(trip);
          return (
            <Link
              key={trip.id}
              to="/trip"
              search={{ id: trip.id }}
              className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 border-border bg-card p-4 active:bg-secondary"
            >
              <span className="min-w-0">
                <span className="block font-bold">{tripTitle(trip)}</span>
                <span className="block text-sm text-muted-foreground">
                  {dateRangeLabel(trip)} · {STATUS_LABEL[tripStatus(trip, today)]}
                </span>
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
