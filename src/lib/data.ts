// SAMPLE DATA ONLY — invented for the prototype. Not verified, not for field use.
//
// vite.config.ts imports this file to list the pages to build, so keep it free
// of `@/` imports and build-time constants.
export type Region = "Southeast" | "Southcentral" | "Interior";
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
  label: string;
  /**
   * Sample data only: how many days before the app is opened the record was
   * verified, so the demo always shows a mix of fresh and stale records. Real
   * records will carry a verified date.
   */
  verifiedDaysAgo: number;
  confidence: Confidence;
}

export interface Operator {
  id: string;
  name: string;
  mode: Mode;
  /** Every region the operator serves. */
  regions: Region[];
  community: string;
  phone: string;
  email?: string;
  website?: string;
  hours: string;
  seasonal: string;
  services: string[];
  source: Source;
}

/** A month of the year, 1 = January. */
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface Qualification {
  id: string;
  name: string;
}

export interface Checklist {
  id: string;
  title: string;
  category: "Crew" | "PPE" | "Parts" | "Paperwork";
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

export const operators: Operator[] = [
  {
    id: "op-tongass-air",
    name: "Tongass Float Air",
    mode: "air",
    regions: ["Southeast"],
    community: "Ketchikan",
    phone: "907-555-0141",
    email: "dispatch@example.com",
    website: "https://example.com",
    hours: "Daily 7:00–19:00 (summer), 9:00–16:00 (winter)",
    seasonal: "Float ops pause during freeze-up; wheel charters only Dec–Feb.",
    services: ["Charter", "Freight to 600 lb", "Tower drop-offs"],
    source: { label: "Operator phone call", verifiedDaysAgo: 10, confidence: "high" },
  },
  {
    id: "op-revilla-rotor",
    name: "Revilla Rotor Services",
    mode: "air",
    regions: ["Southeast"],
    community: "Ketchikan",
    phone: "907-555-0148",
    hours: "Daily 8:00–17:00",
    seasonal: "Winter flights weather-dependent; book ahead Dec–Mar.",
    services: ["Helicopter sling", "Ridge-top crew moves"],
    source: { label: "Operator phone call", verifiedDaysAgo: 24, confidence: "medium" },
  },
  {
    id: "op-inside-barge",
    name: "Inside Passage Barge Co.",
    mode: "sea",
    regions: ["Southeast"],
    community: "Juneau",
    phone: "907-555-0177",
    hours: "Mon–Fri 8:00–17:00",
    seasonal: "Weekly sailing Apr–Oct, biweekly Nov–Mar.",
    services: ["Heavy freight", "Shelter & generator moves"],
    source: { label: "Published schedule", verifiedDaysAgo: 32, confidence: "medium" },
  },
  {
    id: "op-amhs",
    name: "Alaska Marine Highway (AMHS)",
    mode: "sea",
    regions: ["Southeast", "Southcentral"],
    community: "Statewide",
    phone: "800-555-0100",
    website: "https://dot.alaska.gov/amhs/",
    hours: "Reservations Mon–Fri 8:00–17:00",
    seasonal: "Reduced winter schedule; check official site.",
    services: ["Vehicle ferry", "Passenger"],
    source: { label: "Official site", verifiedDaysAgo: 3, confidence: "high" },
  },
  {
    id: "op-chugach-heli",
    name: "Chugach Rotor Services",
    mode: "air",
    regions: ["Southcentral"],
    community: "Valdez",
    phone: "907-555-0122",
    email: "ops@example.com",
    hours: "On call 24/7, office 8:00–17:00",
    seasonal: "Ridge sites weather-limited Nov–Mar.",
    services: ["Helicopter sling", "Ridge-top crew moves"],
    source: { label: "Operator email", verifiedDaysAgo: 19, confidence: "high" },
  },
  {
    id: "op-matsu-haul",
    name: "Mat-Su Hotshot Hauling",
    mode: "land",
    regions: ["Southcentral"],
    community: "Wasilla",
    phone: "907-555-0189",
    hours: "Mon–Sat 6:00–20:00",
    seasonal: "Hatcher Pass road closed in winter.",
    services: ["Hotshot freight", "Snow-machine trailer"],
    source: { label: "Crew report", verifiedDaysAgo: 89, confidence: "low" },
  },
  {
    id: "op-kenai-air",
    name: "Kenai Bush Air",
    mode: "air",
    regions: ["Southcentral"],
    community: "Soldotna",
    phone: "907-555-0133",
    hours: "Daily 8:00–18:00",
    seasonal: "Ski ops Jan–Mar.",
    services: ["Charter", "Freight"],
    source: { label: "Operator phone call", verifiedDaysAgo: 29, confidence: "medium" },
  },
  {
    id: "op-dalton-freight",
    name: "Dalton Line Freight",
    mode: "land",
    regions: ["Interior"],
    community: "Fairbanks",
    phone: "907-555-0155",
    hours: "Mon–Fri 7:00–18:00",
    seasonal: "Chain law Oct–Apr on Dalton Hwy.",
    services: ["Haul road freight", "Fuel drums"],
    source: { label: "Operator phone call", verifiedDaysAgo: 6, confidence: "high" },
  },
  {
    id: "op-yukon-air",
    name: "Yukon Flats Air",
    mode: "air",
    regions: ["Interior"],
    community: "Fairbanks",
    phone: "907-555-0166",
    website: "https://example.com",
    hours: "Daily 7:30–17:30",
    seasonal: "Breakup (late Apr–May) closes gravel strips intermittently.",
    services: ["Scheduled village runs", "Charter"],
    source: { label: "Published schedule", verifiedDaysAgo: 13, confidence: "medium" },
  },
];

export const checklists: Checklist[] = [
  {
    id: "cl-crew",
    title: "Crew & comms before wheels-up",
    category: "Crew",
    items: [
      "Travel plan left with dispatcher",
      "Satellite messenger charged & tested",
      "Escalation contact confirmed",
      "Second crew member confirmed (climbs)",
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

export const regions: Region[] = ["Southeast", "Southcentral", "Interior"];

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

export const isStale = (source: Source) => source.verifiedDaysAgo > STALE_AFTER_DAYS;

/** The local date (YYYY-MM-DD) a number of days before `now`. */
export function dateDaysBefore(now: number, days: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const matches = (query: string, fields: string[]) => {
  const q = query.trim().toLowerCase();
  return q === "" || fields.some((field) => field.toLowerCase().includes(q));
};

/** Operators serving a region (or any region) whose name, community or a service contains the query. */
export function filterOperators(list: Operator[], region: Region | undefined, query: string) {
  return list.filter(
    (o) =>
      (!region || o.regions.includes(region)) &&
      matches(query, [o.name, o.community, ...o.services]),
  );
}
