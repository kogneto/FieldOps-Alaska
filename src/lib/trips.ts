// Trips: one outing by a technician. They live only on the phone, in local
// storage, so everything here is pure and works on plain values.
//
// Dates are local calendar dates as "YYYY-MM-DD" strings. They are never
// parsed with `new Date("YYYY-MM-DD")`, which reads them as UTC midnight and
// lands on the previous day in Alaska.
import {
  checklists as sampleChecklists,
  sites as sampleSites,
  getOperator,
  getQualification,
  getSite,
  monthName,
  type Checklist,
  type Month,
  type Route,
  type Site,
} from "./data";

export const TRIP_VERSION = 1;
export const MAX_TRIP_DAYS = 60;

export interface TripStop {
  siteId: string;
  /** Index into the site's routes. */
  routeIndex: number;
}

/** A trip's own copy of a checklist, taken when the trip is created. */
export interface TripChecklist {
  id: string;
  title: string;
  category: Checklist["category"];
  items: string[];
  ticks: boolean[];
  skipped: boolean;
}

export interface Trip {
  v: typeof TRIP_VERSION;
  id: string;
  /** First day, local date "YYYY-MM-DD". */
  start: string;
  days: number;
  stops: TripStop[];
  checklists: TripChecklist[];
  /** Ids of qualifications ticked off for this trip. */
  quals: string[];
}

export type TripStatus = "upcoming" | "current" | "past";

export const STATUS_LABEL: Record<TripStatus, string> = {
  upcoming: "Coming up",
  current: "Under way",
  past: "Done",
};

// ---- Local dates ---------------------------------------------------------

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A local date at noon, so daylight-saving shifts never change the day. */
export function parseLocalDate(date: string): Date {
  const m = DATE.exec(date);
  if (!m) return new Date(NaN);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
}

export function formatLocalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const isValidDate = (date: string) =>
  DATE.test(date) && formatLocalDate(parseLocalDate(date)) === date;

export function addDays(date: string, days: number): string {
  const d = parseLocalDate(date);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export const todayString = (now: number) => formatLocalDate(new Date(now));

/** Last day of the trip. */
export const tripEnd = (trip: Pick<Trip, "start" | "days">) => addDays(trip.start, trip.days - 1);

/** "Mon 16 Nov" */
export function shortDate(date: string): string {
  const d = parseLocalDate(date);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${weekday} ${d.getDate()} ${monthName(d.getMonth() + 1)}`;
}

/** "16–18 Nov 2026", "30 Nov – 2 Dec 2026" or "16 Nov 2026". */
export function dateRangeLabel(trip: Pick<Trip, "start" | "days">): string {
  const a = parseLocalDate(trip.start);
  const b = parseLocalDate(tripEnd(trip));
  const mon = (d: Date) => monthName(d.getMonth() + 1);
  if (trip.days === 1) return `${a.getDate()} ${mon(a)} ${a.getFullYear()}`;
  if (a.getFullYear() !== b.getFullYear()) {
    return `${a.getDate()} ${mon(a)} ${a.getFullYear()} – ${b.getDate()} ${mon(b)} ${b.getFullYear()}`;
  }
  if (a.getMonth() !== b.getMonth()) {
    return `${a.getDate()} ${mon(a)} – ${b.getDate()} ${mon(b)} ${b.getFullYear()}`;
  }
  return `${a.getDate()}–${b.getDate()} ${mon(b)} ${b.getFullYear()}`;
}

/** Every month the trip touches, in order. */
export function tripMonths(trip: Pick<Trip, "start" | "days">): Month[] {
  const months: Month[] = [];
  for (let i = 0; i < trip.days; i++) {
    const m = (parseLocalDate(addDays(trip.start, i)).getMonth() + 1) as Month;
    if (!months.includes(m)) months.push(m);
  }
  return months;
}

export function tripStatus(trip: Pick<Trip, "start" | "days">, today: string): TripStatus {
  if (today < trip.start) return "upcoming";
  if (today > tripEnd(trip)) return "past";
  return "current";
}

// ---- Routes ----------------------------------------------------------------

export const routeCovers = (route: Route, months: Month[]) =>
  months.every((m) => route.months.includes(m));

/**
 * The route to use for a site on a trip: the first that works for every month
 * of the trip, else the first that works in its first month, else the first
 * route the site has.
 */
export function chooseRoute(site: Site, months: Month[]): number {
  const all = site.routes.findIndex((r) => routeCovers(r, months));
  if (all >= 0) return all;
  const first = months[0];
  const start = site.routes.findIndex((r) => first !== undefined && r.months.includes(first));
  return start >= 0 ? start : 0;
}

// ---- Building and changing trips -------------------------------------------

const copyChecklist = (c: Checklist): TripChecklist => ({
  id: c.id,
  title: c.title,
  category: c.category,
  items: [...c.items],
  ticks: c.items.map(() => false),
  skipped: false,
});

export function createTrip(options: {
  id: string;
  siteId: string;
  start: string;
  days: number;
  checklists?: Checklist[];
}): Trip {
  const { id, siteId, start } = options;
  const days = clampDays(options.days);
  const trip: Trip = {
    v: TRIP_VERSION,
    id,
    start,
    days,
    stops: [],
    checklists: (options.checklists ?? sampleChecklists).map(copyChecklist),
    quals: [],
  };
  return addStop(trip, siteId);
}

const clampDays = (days: number) => Math.min(MAX_TRIP_DAYS, Math.max(1, Math.round(days)));

export function addStop(trip: Trip, siteId: string): Trip {
  const site = getSite(siteId);
  if (!site || trip.stops.some((s) => s.siteId === siteId)) return trip;
  return {
    ...trip,
    stops: [...trip.stops, { siteId, routeIndex: chooseRoute(site, tripMonths(trip)) }],
  };
}

export const removeStop = (trip: Trip, siteId: string): Trip => ({
  ...trip,
  stops: trip.stops.filter((s) => s.siteId !== siteId),
});

export function setRoute(trip: Trip, siteId: string, routeIndex: number): Trip {
  return {
    ...trip,
    stops: trip.stops.map((s) => (s.siteId === siteId ? { ...s, routeIndex } : s)),
  };
}

/**
 * New dates. A stop keeps its chosen route while that route still works for
 * every month of the trip; otherwise it switches to the best one.
 */
export function setDates(trip: Trip, start: string, days: number): Trip {
  const next = { ...trip, start, days: clampDays(days) };
  const months = tripMonths(next);
  return {
    ...next,
    stops: next.stops.map((stop) => {
      const site = getSite(stop.siteId);
      const route = site?.routes[stop.routeIndex];
      if (!site || (route && routeCovers(route, months))) return stop;
      return { ...stop, routeIndex: chooseRoute(site, months) };
    }),
  };
}

export function toggleItem(trip: Trip, checklistId: string, item: number): Trip {
  return {
    ...trip,
    checklists: trip.checklists.map((c) =>
      c.id === checklistId ? { ...c, ticks: c.ticks.map((t, i) => (i === item ? !t : t)) } : c,
    ),
  };
}

export function toggleSkip(trip: Trip, checklistId: string): Trip {
  return {
    ...trip,
    checklists: trip.checklists.map((c) =>
      c.id === checklistId ? { ...c, skipped: !c.skipped } : c,
    ),
  };
}

export function toggleQual(trip: Trip, qualId: string): Trip {
  return {
    ...trip,
    quals: trip.quals.includes(qualId)
      ? trip.quals.filter((q) => q !== qualId)
      : [...trip.quals, qualId],
  };
}

// ---- Reading trips ---------------------------------------------------------

/** Sites that could still be added to this trip, in directory order. */
export function sitesNotOnTrip(trip: Trip): Site[] {
  const on = new Set(trip.stops.map((s) => s.siteId));
  return sampleSites.filter((site) => !on.has(site.id));
}

/** One list of the qualifications every site on the trip needs, without repeats. */
export function tripQualifications(trip: Trip): string[] {
  const ids = trip.stops.flatMap((s) => getSite(s.siteId)?.qualificationIds ?? []);
  return [...new Set(ids)];
}

/** Ticked and total items across the checklists that aren't skipped. */
export function checklistProgress(trip: Trip): { done: number; total: number } {
  const active = trip.checklists.filter((c) => !c.skipped);
  return {
    done: active.reduce((n, c) => n + c.ticks.filter(Boolean).length, 0),
    total: active.reduce((n, c) => n + c.items.length, 0),
  };
}

/** "Coldfoot Microwave Site", or "Coldfoot Microwave Site + 2 more". */
export function tripTitle(trip: Trip): string {
  const first = trip.stops[0] ? getSite(trip.stops[0].siteId)?.name : undefined;
  if (!first) return "Trip with no sites";
  const more = trip.stops.length - 1;
  return more > 0 ? `${first} + ${more} more` : first;
}

/** The trip under way today, else the next one coming up. */
export function currentTrip(trips: Trip[], today: string): Trip | undefined {
  const current = trips.find((t) => tripStatus(t, today) === "current");
  if (current) return current;
  return trips
    .filter((t) => tripStatus(t, today) === "upcoming")
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}

/** Plain text for the phone's share sheet. */
export function shareText(trip: Trip): string {
  const sites = trip.stops.flatMap((s) => {
    const site = getSite(s.siteId);
    return site ? [{ site, route: site.routes[s.routeIndex] }] : [];
  });
  const lines: string[] = [];
  if (sites.some(({ site }) => site.confidentiality === "confidential")) {
    lines.push("CONFIDENTIAL — share inside the crew only.", "");
  }
  lines.push(
    `FieldOps trip: ${dateRangeLabel(trip)} (${trip.days} day${trip.days === 1 ? "" : "s"})`,
  );
  sites.forEach(({ site, route }, i) => {
    lines.push("", `${i + 1}. ${site.name} — ${site.community}, ${site.region}`);
    if (route) {
      const operator = route.operatorId ? getOperator(route.operatorId) : undefined;
      const who = operator ? `${operator.name}, ${operator.phone}` : "Drive yourself";
      lines.push(`   Getting there: ${who}. ${route.how}.`);
    }
    if (site.escort) lines.push("   Escort required.");
  });
  const quals = tripQualifications(trip).map((id) => getQualification(id)?.name ?? id);
  if (quals.length > 0) lines.push("", `Qualifications: ${quals.join(", ")}.`);
  const { done, total } = checklistProgress(trip);
  const skipped = trip.checklists.filter((c) => c.skipped).map((c) => c.title);
  lines.push(
    `Checklists: ${done} of ${total} items ticked${skipped.length ? `; skipped ${skipped.join(", ")}` : ""}.`,
  );
  lines.push("", "Sample data — not for field use.");
  return lines.join("\n");
}

// ---- Storage ---------------------------------------------------------------

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

function readChecklist(v: unknown): TripChecklist | null {
  if (typeof v !== "object" || v === null) return null;
  const c = v as Record<string, unknown>;
  if (typeof c["id"] !== "string" || typeof c["title"] !== "string") return null;
  if (!isStringArray(c["items"]) || !Array.isArray(c["ticks"])) return null;
  const items = c["items"];
  const ticks = items.map((_, i) => (c["ticks"] as unknown[])[i] === true);
  const category = c["category"];
  return {
    id: c["id"],
    title: c["title"],
    category:
      category === "Crew" || category === "PPE" || category === "Parts" || category === "Paperwork"
        ? category
        : "Crew",
    items,
    ticks,
    skipped: c["skipped"] === true,
  };
}

function readTrip(v: unknown): Trip | null {
  if (typeof v !== "object" || v === null) return null;
  const t = v as Record<string, unknown>;
  if (t["v"] !== TRIP_VERSION || typeof t["id"] !== "string") return null;
  if (typeof t["start"] !== "string" || !isValidDate(t["start"])) return null;
  if (typeof t["days"] !== "number" || !Number.isFinite(t["days"])) return null;
  if (!Array.isArray(t["stops"]) || !Array.isArray(t["checklists"])) return null;
  const stops = t["stops"].flatMap((s): TripStop[] => {
    if (typeof s !== "object" || s === null) return [];
    const { siteId, routeIndex } = s as Record<string, unknown>;
    const site = typeof siteId === "string" ? getSite(siteId) : undefined;
    if (!site) return [];
    const index =
      typeof routeIndex === "number" && site.routes[routeIndex] !== undefined ? routeIndex : 0;
    return [{ siteId: site.id, routeIndex: index }];
  });
  return {
    v: TRIP_VERSION,
    id: t["id"],
    start: t["start"],
    days: clampDays(t["days"]),
    stops,
    checklists: t["checklists"].flatMap((c) => readChecklist(c) ?? []),
    quals: isStringArray(t["quals"]) ? t["quals"] : [],
  };
}

/**
 * Reads stored trips, keeping every trip it can understand and dropping the
 * rest, so old or damaged storage never breaks a page.
 */
export function readTrips(raw: string | null): Trip[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.flatMap((t) => readTrip(t) ?? []) : [];
  } catch {
    return [];
  }
}
