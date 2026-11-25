// The maintainer's data: the record format, the operator records (in
// operators.ts), and the checklists and qualification list. The operators are
// real; the checklists and qualifications are still the prototype's own lists.
//
// vite.config.ts imports this file to list the pages to build, so keep it free
// of `@/` imports and build-time constants.
import { operators } from "./operators";

export { operators };

/** The State's transportation area plans that cover the hubs. */
export type Region = "Southeast" | "Southwest" | "Northwest" | "Yukon-Kuskokwim Delta";
export type Mode = "air" | "sea" | "land";
export type Confidence = "high" | "medium" | "low";
export type Confidentiality = "open" | "confidential";
/** The kinds a technician can give a site they type in. */
export const siteKinds = [
  "Microwave repeater",
  "Fiber regen hut",
  "Cell tower",
  "Radio repeater",
  "Equipment shelter",
  "Microwave relay",
  "Satellite earth station",
] as const;
export type SiteKind = (typeof siteKinds)[number];

export interface Source {
  /** Where the record was read, such as "Operator's website". */
  label: string;
  /** The verified date: the local date (YYYY-MM-DD) the whole record was last confirmed. */
  verified: string;
  confidence: Confidence;
}

/**
 * One place an operator lists in a community: a cargo station, a terminal, an
 * office. One with an address is somewhere a technician can meet the operator.
 */
export interface Office {
  community: string;
  /** What it is, in the operator's words, such as "Cargo station" or "Terminal 1". */
  name: string;
  /** The company that runs it for the operator, when it isn't the operator itself. */
  runBy?: string;
  /** A street address for directions. Absent when the operator publishes none. */
  where?: string;
  phone?: string;
  email?: string;
  hours?: string;
  /** The communities the operator lists as reached from here. */
  onTo?: string[];
  note?: string;
}

export interface Operator {
  id: string;
  name: string;
  mode: Mode;
  /** Every region the operator serves. */
  regions: Region[];
  /** The hubs and towns it works from, Anchorage first when it starts there. */
  communities: string[];
  phone: string;
  email?: string;
  website: string;
  /** Hours for the main phone line. Absent when the operator publishes none. */
  hours?: string;
  /** Absent when the operator publishes no seasonal limits. */
  seasonal?: string;
  services: string[];
  /** Anything else a technician should know, in a sentence or two. */
  note?: string;
  offices: Office[];
  source: Source;
}

/** A month of the year, 1 = January. */
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface Qualification {
  id: string;
  name: string;
}

export const checklistCategories = ["Comms", "PPE", "Parts", "Paperwork"] as const;
export type ChecklistCategory = (typeof checklistCategories)[number];

export interface Checklist {
  /** Kept when a list is reworded, since trips on a phone refer to it. "cl-crew" is the comms list. */
  id: string;
  title: string;
  category: ChecklistCategory;
  items: string[];
  /**
   * When the list is needed. Without this it is always needed; with it, the
   * list is needed when any one condition matches a site on the trip or a
   * month the trip touches. A trip starts with lists that aren't needed
   * skipped, and can include them again.
   */
  neededWhen?: {
    qualificationIds?: string[];
    months?: Month[];
    siteKinds?: SiteKind[];
  };
}

/** What a technician should do with a record, by its confidence. */
export const confidenceAdvice: Record<Confidence, string> = {
  high: "Act on it.",
  medium: "Confirm by phone before committing travel or money.",
  low: "A lead only. Confirm it before relying on it.",
};

/** How a site may be talked about, by its confidentiality. */
export const confidentialityRule: Record<Confidentiality, string> = {
  open: "May be named freely.",
  confidential:
    "Stays with the technicians working it. An operator may be told the place and date needed to get there, never what the site is or who the client is.",
};

export const checklists: Checklist[] = [
  {
    id: "cl-crew",
    title: "Comms & safety before wheels-up",
    category: "Comms",
    items: [
      "Trip plan shared with someone at home base",
      "Satellite messenger charged & tested",
      "Escalation contact confirmed",
      "Second person confirmed for any climb",
      "Weather window reviewed (NWS)",
    ],
  },
  {
    id: "cl-ppe",
    title: "Cold-weather & climb PPE",
    category: "PPE",
    neededWhen: {
      qualificationIds: ["q-tower-climb", "q-cold-weather"],
      months: [10, 11, 12, 1, 2, 3, 4],
    },
    items: [
      "Harness inspected, in date",
      "Lanyards & rescue kit",
      "Hard hat with chin strap",
      "Insulated gloves + liners",
      "Bear spray",
      "Extra base layers in dry bag",
    ],
  },
  {
    id: "cl-parts",
    title: "Tower site parts kit",
    category: "Parts",
    neededWhen: {
      siteKinds: ["Microwave repeater", "Cell tower", "Radio repeater", "Microwave relay"],
    },
    items: [
      "Spare radio module",
      "Jumpers & connectors",
      "Weatherproofing tape & mastic",
      "Fuses & breakers",
      "Grounding kit",
      "Small generator fuel",
    ],
  },
  {
    id: "cl-paper",
    title: "Paperwork",
    category: "Paperwork",
    items: [
      "Work order printed / offline",
      "Site access permission",
      "Qualifications current (badge, climb, medical)",
      "Landowner contact",
      "Hazard assessment form",
    ],
  },
];

export const regions: Region[] = ["Southeast", "Southwest", "Yukon-Kuskokwim Delta", "Northwest"];

/** The one named list sites pick their qualifications from. */
export const qualifications: Qualification[] = [
  { id: "q-tower-climb", name: "Tower climb cert" },
  { id: "q-first-aid", name: "First aid / CPR" },
  { id: "q-fiber-safety", name: "Fiber safety training" },
  { id: "q-rf-awareness", name: "RF awareness" },
  { id: "q-site-badge", name: "Site badge" },
  { id: "q-avalanche", name: "Avalanche awareness (winter)" },
  { id: "q-cold-weather", name: "Cold-weather ops" },
  { id: "q-medical", name: "Medical clearance" },
];

export const getQualification = (id: string) => qualifications.find((q) => q.id === id);

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const monthName = (month: number) => MONTH_NAMES[(month - 1 + 12) % 12] ?? "";

/**
 * A short label for a set of months: "All year", one run such as "Apr–Nov" or
 * "Dec–Mar" (wrapping the year end), or a list when the months aren't one run.
 */
export function monthsLabel(months: Month[]): string {
  const set = new Set<number>(months);
  if (set.size === 0) return "Never";
  if (set.size === 12) return "All year";
  const next = (m: number) => (m % 12) + 1;
  const prev = (m: number) => ((m + 10) % 12) + 1;
  const starts = [...set].filter((m) => !set.has(prev(m)));
  if (starts.length === 1) {
    const start = starts[0] ?? 1;
    let end = start;
    while (set.has(next(end))) end = next(end);
    return start === end ? monthName(start) : `${monthName(start)}–${monthName(end)}`;
  }
  return [...set]
    .sort((a, b) => a - b)
    .map(monthName)
    .join(", ");
}

export const officialLinks = [
  { label: "National Weather Service — Alaska", url: "https://www.weather.gov/afc/" },
  { label: "Alaska 511 road conditions", url: "https://511.alaska.gov/" },
  { label: "Alaska Marine Highway (AMHS)", url: "https://dot.alaska.gov/amhs/" },
];

export const getOperator = (id: string) => operators.find((o) => o.id === id);

/** Records verified longer ago than this are stale. */
export const STALE_AFTER_DAYS = 60;

const DAY_MS = 86_400_000;

/** Midday on a local calendar date, so whole days count the same across daylight saving. */
const middayOf = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day, 12).getTime();

/** Calendar days from a local date (YYYY-MM-DD) to the local date of `now`. */
export function daysSince(date: string, now: number): number {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  const today = new Date(now);
  const todayMidday = middayOf(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return Math.round((todayMidday - middayOf(year, month, day)) / DAY_MS);
}

/** Whether a record's verified date is more than STALE_AFTER_DAYS before `now`. */
export const isStale = (source: Source, now: number) =>
  daysSince(source.verified, now) > STALE_AFTER_DAYS;

/** Lower case with accents dropped, so "utqiagvik" finds "Utqiaġvik". */
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const matches = (query: string, fields: string[]) => {
  const q = fold(query.trim());
  return q === "" || fields.some((field) => fold(field).includes(q));
};

/** Every community a record names: where it works from, its offices, and where they reach. */
export const operatorCommunities = (o: Operator) => [
  ...o.communities,
  ...o.offices.flatMap((office) => [office.community, ...(office.onTo ?? [])]),
];

/**
 * Operators serving a region (or any region) whose name, a community it
 * names, a company running one of its offices, or a service contains the query.
 */
export function filterOperators(list: Operator[], region: Region | undefined, query: string) {
  return list.filter(
    (o) =>
      (!region || o.regions.includes(region)) &&
      matches(query, [
        o.name,
        ...operatorCommunities(o),
        ...o.offices.flatMap((office) => (office.runBy ? [office.runBy] : [])),
        ...o.services,
      ]),
  );
}

/** "Anchorage, Bethel, Nome" or, past `max`, "Anchorage, Juneau, Ketchikan and 8 more". */
export function communitiesLabel(communities: string[], max = 4): string {
  if (communities.length <= max) return communities.join(", ");
  const shown = communities.slice(0, max - 1);
  return `${shown.join(", ")} and ${communities.length - shown.length} more`;
}

/** The offices a technician can get directions to: those with an address. */
export const meetingPlaces = (o: Operator) => o.offices.filter((office) => office.where);
