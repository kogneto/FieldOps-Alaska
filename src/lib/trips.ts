// Trips: one outing by a technician. They live only on the phone, in local
// storage, so everything here is pure and works on plain values.
//
// A trip names its sites by id. The sites are the technician's own (sites.ts),
// so anything here that needs to know about a site is handed the list of them.
//
// Dates are local calendar dates as "YYYY-MM-DD" strings. They are never
// parsed with `new Date("YYYY-MM-DD")`, which reads them as UTC midnight and
// lands on the previous day in Alaska.
import {
  checklistCategories,
  checklists as sampleChecklists,
  getOperator,
  getQualification,
  monthName,
  monthsLabel,
  type Checklist,
  type ChecklistCategory,
  type Month,
} from "./data";
import {
  emptyLoadout,
  forgetChecks,
  loadoutChecks,
  loadoutSummary,
  readLoadout,
  shipsAt,
  type Check,
  type Loadout,
} from "./loadout";
import { placeOrNull, readPlace, type Place } from "./places";
import type { Site } from "./sites";

export const TRIP_VERSION = 2;
export const MAX_TRIP_DAYS = 60;

/**
 * How the technician reaches a site: with an operator from the records, or
 * driving themselves. Null until they choose.
 */
export type TripRoute = { by: "operator"; operatorId: string } | { by: "self" } | null;

export interface TripStop {
  siteId: string;
  route: TripRoute;
  /** Where the technician meets the operator on the way to this site: an airport, a port, a dog sled team. */
  meet: Place | null;
  /** The hotel or cabin they stay in while working this site. */
  lodging: Place | null;
}

/** A trip's own copy of a checklist, taken when the trip is created. */
export interface TripChecklist {
  id: string;
  title: string;
  category: Checklist["category"];
  items: string[];
  ticks: boolean[];
  skipped: boolean;
  /**
   * True while the list is skipped only because the trip didn't need it when
   * it was created. Such a list is included again if a later site or date
   * change makes it needed; skipping or including it by hand clears this.
   */
  autoSkipped?: boolean;
}

export interface Trip {
  v: typeof TRIP_VERSION;
  id: string;
  /** First day, local date "YYYY-MM-DD". */
  start: string;
  days: number;
  /** The sites in the order they are worked. */
  stops: TripStop[];
  checklists: TripChecklist[];
  /** Ids of qualifications ticked off for this trip. */
  quals: string[];
  /** The tools and parts the trip needs, and the ticks of the checklists that run over them. */
  loadout: Loadout;
  /** Where the technician meets the operator for the trip home. */
  homeMeet: Place | null;
  /** Keys of the steps the technician has marked done. */
  done: string[];
}

export type StepKind =
  "ready" | "loadout" | "travel" | "arrival" | "work" | "departure" | "travel-home" | "return";

/**
 * One step of a trip, in order. The four loadout checklist steps share their
 * checklist's key (`pre`, `arrive:…`, `depart:…`, `return`).
 */
export interface Step {
  key: string;
  kind: StepKind;
  /** The site it happens at or on the way to, or null at home base. */
  siteId: string | null;
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

/**
 * Where a trip stands. Once a step is marked it follows the steps, not the
 * calendar: Done once the return checklist is marked done, Under way until
 * then, so a weather hold never ends a trip. A trip with nothing marked goes
 * by its dates.
 */
export function tripStatus(
  trip: Pick<Trip, "start" | "days"> & Partial<Pick<Trip, "stops" | "done">>,
  today: string,
): TripStatus {
  if (trip.stops && trip.done) {
    const marked = { stops: trip.stops, done: trip.done };
    if (isFinished(marked)) return "past";
    if (isStarted(marked)) return "current";
  }
  if (today < trip.start) return "upcoming";
  if (today > tripEnd(trip)) return "past";
  return "current";
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
  /** The technician's sites, which must include `siteId`. */
  sites: Site[];
  checklists?: Checklist[];
}): Trip {
  const { id, siteId, start, sites } = options;
  const days = clampDays(options.days);
  const trip: Trip = {
    v: TRIP_VERSION,
    id,
    start,
    days,
    stops: [],
    checklists: (options.checklists ?? sampleChecklists).map(copyChecklist),
    quals: [],
    loadout: emptyLoadout(),
    homeMeet: null,
    done: [],
  };
  // Decide what's needed once the first site is on the trip. This is the only
  // time a list is skipped automatically.
  const withSite = addStop(trip, siteId, sites);
  const definitions = options.checklists ?? sampleChecklists;
  return {
    ...withSite,
    checklists: withSite.checklists.map((c) => {
      const definition = definitions.find((d) => d.id === c.id);
      return definition && !isNeeded(definition, withSite, sites)
        ? { ...c, skipped: true, autoSkipped: true }
        : c;
    }),
  };
}

export const checklistDefinition = (id: string) => sampleChecklists.find((c) => c.id === id);

/** The trip's sites in order, leaving out any that are no longer on this phone. */
export function tripSites(trip: Pick<Trip, "stops">, sites: Site[]): Site[] {
  return trip.stops.flatMap((stop) => sites.find((s) => s.id === stop.siteId) ?? []);
}

/** Whether a checklist is needed for the trip's sites and the months it touches. */
export function isNeeded(
  definition: Checklist,
  trip: Pick<Trip, "stops" | "start" | "days">,
  sites: Site[],
) {
  const when = definition.neededWhen;
  if (!when) return true;
  const onTrip = tripSites(trip, sites);
  const months = tripMonths(trip);
  return (
    (when.qualificationIds ?? []).some((q) => onTrip.some((s) => s.qualificationIds.includes(q))) ||
    (when.months ?? []).some((m) => months.includes(m)) ||
    (when.siteKinds ?? []).some((k) => onTrip.some((s) => s.kind === k))
  );
}

/** "a site needs Tower climb cert or Cold-weather ops, or the trip falls in Oct–Apr" */
export function neededWhenLabel(definition: Checklist): string {
  const when = definition.neededWhen;
  if (!when) return "always";
  const or = (words: string[]) =>
    words.length <= 1 ? (words[0] ?? "") : `${words.slice(0, -1).join(", ")} or ${words.at(-1)}`;
  const parts: string[] = [];
  const quals = (when.qualificationIds ?? []).map((id) => getQualification(id)?.name ?? id);
  if (quals.length) parts.push(`a site needs ${or(quals)}`);
  const kinds = (when.siteKinds ?? []).map((k) => k.toLowerCase());
  if (kinds.length) parts.push(`a site is a ${or(kinds)}`);
  if (when.months?.length) parts.push(`the trip falls in ${monthsLabel(when.months)}`);
  return parts.join(", or ");
}

/**
 * Includes again any list that was skipped automatically and is now needed.
 * Lists are never skipped automatically after a trip is created. Call it after
 * a site on the trip changes its kind or qualifications, too.
 */
export function includeNeeded(trip: Trip, sites: Site[]): Trip {
  return {
    ...trip,
    checklists: trip.checklists.map((c) => {
      const definition = checklistDefinition(c.id);
      return c.skipped && c.autoSkipped && definition && isNeeded(definition, trip, sites)
        ? { ...c, skipped: false, autoSkipped: false }
        : c;
    }),
  };
}

const clampDays = (days: number) => Math.min(MAX_TRIP_DAYS, Math.max(1, Math.round(days)));

/** Adds one of the technician's sites to the end of the trip, once. How to get there is chosen afterwards. */
export function addStop(trip: Trip, siteId: string, sites: Site[]): Trip {
  if (!sites.some((s) => s.id === siteId) || trip.stops.some((s) => s.siteId === siteId)) {
    return trip;
  }
  return includeNeeded(
    { ...trip, stops: [...trip.stops, { siteId, route: null, meet: null, lodging: null }] },
    sites,
  );
}

/** The loadout checks the trip runs, in order: pre-loadout, arrival and departure at each site, return. */
export const tripChecks = (trip: Pick<Trip, "stops">): Check[] =>
  loadoutChecks(trip.stops.map((s) => s.siteId));

/** Takes a site off the trip, with its checklist ticks, waybills and step marks. */
export function removeStop(trip: Trip, siteId: string): Trip {
  const stops = trip.stops.filter((s) => s.siteId !== siteId);
  const keys = new Set(tripSteps({ stops }).map((s) => s.key));
  return {
    ...trip,
    stops,
    loadout: forgetChecks(trip.loadout, tripChecks({ stops })),
    done: trip.done.filter((k) => keys.has(k)),
  };
}

// ---- Steps ---------------------------------------------------------------------

/**
 * The trip's steps in order: get ready, build and ship the loadout, then at
 * each site in turn travel there, the arrival checklist, the job and the
 * departure pre-loadout, then travel home and the return checklist.
 */
export function tripSteps(trip: Pick<Trip, "stops">): Step[] {
  return [
    { key: "ready", kind: "ready", siteId: null },
    { key: "pre", kind: "loadout", siteId: null },
    ...trip.stops.flatMap(({ siteId }): Step[] => [
      { key: `travel:${siteId}`, kind: "travel", siteId },
      { key: `arrive:${siteId}`, kind: "arrival", siteId },
      { key: `work:${siteId}`, kind: "work", siteId },
      { key: `depart:${siteId}`, kind: "departure", siteId },
    ]),
    { key: "travel-home", kind: "travel-home", siteId: null },
    { key: "return", kind: "return", siteId: null },
  ];
}

/** The marks that still belong to a step of the trip. */
function marked(trip: Pick<Trip, "stops" | "done">): Set<string> {
  const keys = new Set(tripSteps(trip).map((s) => s.key));
  return new Set(trip.done.filter((k) => keys.has(k)));
}

export const isStarted = (trip: Pick<Trip, "stops" | "done">) => marked(trip).size > 0;

/** Done once the return checklist step is marked, whatever else was skipped. */
export const isFinished = (trip: Pick<Trip, "stops" | "done">) => marked(trip).has("return");

export const isStepDone = (trip: Pick<Trip, "done">, key: string) => trip.done.includes(key);

/**
 * The step the technician is on: the first unmarked step after the furthest
 * one marked, so a step they forgot to mark doesn't hold the trip back.
 * Undefined once the trip is finished.
 */
export function nextStep(trip: Pick<Trip, "stops" | "done">): Step | undefined {
  const steps = tripSteps(trip);
  const done = marked(trip);
  if (done.has("return")) return undefined;
  let furthest = -1;
  steps.forEach((s, i) => {
    if (done.has(s.key)) furthest = i;
  });
  return steps.slice(furthest + 1).find((s) => !done.has(s.key));
}

/** A step's title and where it happens, as the trip page and lists show it. */
export function stepLabel(
  trip: Pick<Trip, "stops">,
  step: Step,
  sites: Site[],
): { title: string; where: string } {
  const site = step.siteId ? sites.find((s) => s.id === step.siteId) : undefined;
  const name = site?.name ?? "a site no longer on this phone";
  switch (step.kind) {
    case "ready":
      return { title: "Get ready", where: "Prep checklists and qualifications" };
    case "loadout":
      return { title: "Build and ship the loadout", where: "Pre-loadout at home base" };
    case "travel": {
      const route = trip.stops.find((s) => s.siteId === step.siteId)?.route ?? null;
      return { title: `Travel to ${name}`, where: routeLabel(route) || "Choose how to get there" };
    }
    case "arrival":
      return { title: "Arrival checklist", where: site?.name ?? name };
    case "work":
      return { title: "Do the job", where: site?.name ?? name };
    case "departure":
      return { title: "Departure pre-loadout", where: site?.name ?? name };
    case "travel-home":
      return { title: "Travel home", where: "Back to home base" };
    case "return":
      return { title: "Return checklist", where: "Home base" };
  }
}

/** Marks a step done, or takes the mark back. Ticks are never changed. */
export function setStepDone(trip: Trip, key: string, done: boolean): Trip {
  const others = trip.done.filter((k) => k !== key);
  return { ...trip, done: done ? [...others, key] : others };
}

/** Moves a site one place earlier (-1) or later (+1) in the order it is worked. */
export function moveStop(trip: Trip, siteId: string, by: -1 | 1): Trip {
  const from = trip.stops.findIndex((s) => s.siteId === siteId);
  const to = from + by;
  if (from < 0 || to < 0 || to >= trip.stops.length) return trip;
  const stops = [...trip.stops];
  const [stop] = stops.splice(from, 1);
  if (stop) stops.splice(to, 0, stop);
  return { ...trip, stops };
}

/** Where the operator is met on the way to a site, or for the trip home when `siteId` is null. */
export function setMeet(trip: Trip, siteId: string | null, place: Place): Trip {
  const meet = placeOrNull(place);
  if (siteId === null) return { ...trip, homeMeet: meet };
  return {
    ...trip,
    stops: trip.stops.map((s) => (s.siteId === siteId ? { ...s, meet } : s)),
  };
}

export function setLodging(trip: Trip, siteId: string, place: Place): Trip {
  const lodging = placeOrNull(place);
  return {
    ...trip,
    stops: trip.stops.map((s) => (s.siteId === siteId ? { ...s, lodging } : s)),
  };
}

export function setRoute(trip: Trip, siteId: string, route: TripRoute): Trip {
  return {
    ...trip,
    stops: trip.stops.map((s) => (s.siteId === siteId ? { ...s, route } : s)),
  };
}

/** New dates. Lists the new months need are included again. */
export function setDates(trip: Trip, start: string, days: number, sites: Site[]): Trip {
  return includeNeeded({ ...trip, start, days: clampDays(days) }, sites);
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
      c.id === checklistId ? { ...c, skipped: !c.skipped, autoSkipped: false } : c,
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

/** The technician's sites that could still be added to this trip. */
export function sitesNotOnTrip(trip: Trip, sites: Site[]): Site[] {
  const on = new Set(trip.stops.map((s) => s.siteId));
  return sites.filter((site) => !on.has(site.id));
}

/** The trips a site is on. A site can't be deleted while this isn't empty. */
export const tripsUsingSite = (trips: Trip[], siteId: string): Trip[] =>
  trips.filter((t) => t.stops.some((s) => s.siteId === siteId));

/** One list of the qualifications every site on the trip needs, without repeats. */
export function tripQualifications(trip: Trip, sites: Site[]): string[] {
  return [...new Set(tripSites(trip, sites).flatMap((s) => s.qualificationIds))];
}

/** Ticked and total items across the checklists that aren't skipped. */
export function checklistProgress(trip: Trip): { done: number; total: number } {
  const active = trip.checklists.filter((c) => !c.skipped);
  return {
    done: active.reduce((n, c) => n + c.ticks.filter(Boolean).length, 0),
    total: active.reduce((n, c) => n + c.items.length, 0),
  };
}

/** "Bethel cell tower", or "Bethel cell tower + 2 more". */
export function tripTitle(trip: Trip, sites: Site[]): string {
  const onTrip = tripSites(trip, sites);
  const first = onTrip[0]?.name;
  if (!first) return "Trip with no sites";
  const more = onTrip.length - 1;
  return more > 0 ? `${first} + ${more} more` : first;
}

/**
 * The trip under way, else the next one coming up. When several are under
 * way, such as one left unfinished, the one with the latest first day.
 */
export function currentTrip(trips: Trip[], today: string): Trip | undefined {
  const current = trips
    .filter((t) => tripStatus(t, today) === "current")
    .sort((a, b) => b.start.localeCompare(a.start))[0];
  if (current) return current;
  return trips
    .filter((t) => tripStatus(t, today) === "upcoming")
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}

/** "Grant Aviation" or "Drive yourself"; empty until chosen. */
export function routeLabel(route: TripRoute): string {
  if (route?.by === "self") return "Drive yourself";
  if (route?.by === "operator") return getOperator(route.operatorId)?.name ?? "";
  return "";
}

/**
 * Plain text for the phone's share sheet. It names the trip's sites, which is
 * the technician's own choice to share; the app sends it nowhere itself.
 */
export function shareText(trip: Trip, sites: Site[]): string {
  const stops = trip.stops.flatMap((stop) => {
    const site = sites.find((s) => s.id === stop.siteId);
    return site ? [{ site, route: stop.route, meet: stop.meet, lodging: stop.lodging }] : [];
  });
  const placeLine = (label: string, place: Place | null) =>
    place
      ? [`   ${label}: ${[place.name.trim(), place.where.trim()].filter(Boolean).join(", ")}.`]
      : [];
  const lines: string[] = [];
  if (stops.some(({ site }) => site.confidentiality === "confidential")) {
    lines.push("CONFIDENTIAL — keep this plan with the technicians working these sites.", "");
  }
  lines.push(
    `FieldOps trip: ${dateRangeLabel(trip)} (${trip.days} day${trip.days === 1 ? "" : "s"})`,
  );
  stops.forEach(({ site, route, meet, lodging }, i) => {
    lines.push("", `${i + 1}. ${site.name}${site.community ? ` — ${site.community}` : ""}`);
    const operator = route?.by === "operator" ? getOperator(route.operatorId) : undefined;
    if (operator) {
      lines.push(`   Getting there: ${operator.name}, ${operator.phone}.`);
      lines.push(...placeLine("Meeting the operator at", meet));
    } else if (route?.by === "self") {
      lines.push("   Getting there: drive yourself.");
    }
    lines.push(...placeLine("Staying at", lodging));
  });
  if (trip.homeMeet) lines.push("", ...placeLine("Home: meeting the operator at", trip.homeMeet));
  const quals = tripQualifications(trip, sites).map((id) => getQualification(id)?.name ?? id);
  if (quals.length > 0) lines.push("", `Qualifications: ${quals.join(", ")}.`);
  const { done, total } = checklistProgress(trip);
  const skipped = trip.checklists.filter((c) => c.skipped).map((c) => c.title);
  lines.push(
    `Checklists: ${done} of ${total} items ticked${skipped.length ? `; skipped ${skipped.join(", ")}` : ""}.`,
  );
  if (trip.loadout.items.length > 0) {
    const checks = tripChecks(trip);
    const dangerous = trip.loadout.items.filter((i) => i.dangerous).length;
    lines.push(
      `Loadout: ${loadoutSummary(trip.loadout)}${dangerous ? `; ${dangerous} to declare as dangerous goods` : ""}.`,
    );
    for (const check of checks.filter(shipsAt)) {
      const waybill = trip.loadout.waybills[check.key];
      if (!waybill) continue;
      const site = check.siteId ? sites.find((s) => s.id === check.siteId) : undefined;
      lines.push(`Shipped from ${site?.name ?? "home base"}: waybill ${waybill.trim()}.`);
    }
  }
  return lines.join("\n");
}

// ---- Storage ---------------------------------------------------------------

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

// The comms list once spoke of a crew. A trip saved before it was reworded
// gets the new wording for these exact lines; the order and ticks are kept.
const REWORDED: Record<string, string> = {
  "Crew & comms before wheels-up": "Comms & safety before wheels-up",
  "Travel plan left with dispatcher": "Trip plan shared with someone at home base",
  "Second crew member confirmed (climbs)": "Second person confirmed for any climb",
};
const reworded = (text: string) => REWORDED[text] ?? text;

function readChecklist(v: unknown): TripChecklist | null {
  if (typeof v !== "object" || v === null) return null;
  const c = v as Record<string, unknown>;
  if (typeof c["id"] !== "string" || typeof c["title"] !== "string") return null;
  if (!isStringArray(c["items"]) || !Array.isArray(c["ticks"])) return null;
  const items = c["items"].map(reworded);
  const ticks = items.map((_, i) => (c["ticks"] as unknown[])[i] === true);
  const category = c["category"];
  return {
    id: c["id"],
    title: reworded(c["title"]),
    // "Crew" was the comms list's category before it was reworded.
    category: checklistCategories.includes(category as ChecklistCategory)
      ? (category as ChecklistCategory)
      : "Comms",
    items,
    ticks,
    skipped: c["skipped"] === true,
    ...(c["autoSkipped"] === true ? { autoSkipped: true } : {}),
  };
}

function readRoute(v: unknown): TripRoute {
  if (typeof v !== "object" || v === null) return null;
  const r = v as Record<string, unknown>;
  if (r["by"] === "self") return { by: "self" };
  const operatorId = r["operatorId"];
  // An operator that has left the records reads as not chosen yet.
  if (r["by"] === "operator" && typeof operatorId === "string" && getOperator(operatorId)) {
    return { by: "operator", operatorId };
  }
  return null;
}

// A trip needs only an id and a first day to be kept. Everything else is
// filled in when missing, so a field added later never drops stored trips.
function readTrip(v: unknown): Trip | null {
  if (typeof v !== "object" || v === null) return null;
  const t = v as Record<string, unknown>;
  if (t["v"] !== TRIP_VERSION || typeof t["id"] !== "string") return null;
  if (typeof t["start"] !== "string" || !isValidDate(t["start"])) return null;
  const stops: TripStop[] = [];
  for (const s of Array.isArray(t["stops"]) ? t["stops"] : []) {
    if (typeof s !== "object" || s === null) continue;
    const { siteId, route, meet, lodging } = s as Record<string, unknown>;
    if (typeof siteId !== "string" || stops.some((x) => x.siteId === siteId)) continue;
    stops.push({
      siteId,
      route: readRoute(route),
      meet: readPlace(meet),
      lodging: readPlace(lodging),
    });
  }
  const days = t["days"];
  const checklists = Array.isArray(t["checklists"]) ? t["checklists"] : [];
  return {
    v: TRIP_VERSION,
    id: t["id"],
    start: t["start"],
    days: clampDays(typeof days === "number" && Number.isFinite(days) ? days : 1),
    stops,
    checklists: checklists.flatMap((c) => readChecklist(c) ?? []),
    quals: isStringArray(t["quals"]) ? t["quals"] : [],
    loadout: readLoadout(t["loadout"]),
    homeMeet: readPlace(t["homeMeet"]),
    done: Array.isArray(t["done"])
      ? [...new Set(t["done"].filter((k): k is string => typeof k === "string"))]
      : [],
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

/**
 * How many trips are left over from before sites were typed in. They were
 * planned on the invented sample sites, which are gone, so they can't be
 * opened; the Trips screen says so and offers to clear them.
 */
export function legacyTripCount(raw: string | null): number {
  if (!raw) return 0;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
