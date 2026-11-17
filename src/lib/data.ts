// SAMPLE DATA ONLY — invented for the prototype. Not verified, not for field use.
//
// vite.config.ts imports this file to list the pages to build, so keep it free
// of `@/` imports and build-time constants.
export type Region = "Southeast" | "Southcentral" | "Interior";
export type Mode = "air" | "sea" | "land";
export type Confidence = "high" | "medium" | "low";
export type Confidentiality = "open" | "confidential";

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

export interface Site {
  id: string;
  name: string;
  kind: string;
  region: Region;
  community: string;
  lat: number;
  lng: number;
  access: string[];
  escort: boolean;
  seasonal: string;
  confidentiality: Confidentiality;
  /** Ids from `qualifications`. */
  qualificationIds: string[];
  /** Every way of reaching the site, in order of preference. */
  routes: Route[];
  source: Source;
}

/** A month of the year, 1 = January. */
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** One way of reaching a site: an operator (or driving yourself), a mode, and the months it works. */
export interface Route {
  /** Null when the crew drives themselves. */
  operatorId: string | null;
  mode: Mode;
  months: Month[];
  how: string;
}

export interface Qualification {
  id: string;
  name: string;
}

export interface Checklist {
  id: string;
  title: string;
  category: "Crew" | "PPE" | "Parts" | "Paperwork";
  items: string[];
}

/** What a technician should do with a record, by its confidence. */
export const confidenceAdvice: Record<Confidence, string> = {
  high: "Act on it.",
  medium: "Confirm by phone before committing travel or money.",
  low: "A lead only. Confirm it before relying on it.",
};

/** How a site's record may be shared, by its confidentiality. */
export const confidentialityRule: Record<Confidentiality, string> = {
  open: "May be shared freely.",
  confidential:
    "Stays inside the crew. An operator may be told the place and date needed to get there, never what the site is or who the client is.",
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

export const sites: Site[] = [
  {
    id: "site-gravina-rpt",
    name: "Gravina Ridge Repeater",
    kind: "Microwave repeater",
    region: "Southeast",
    community: "Ketchikan",
    lat: 55.33,
    lng: -131.7,
    access: [
      "Float plane to cove, 1.2 mi trail climb",
      "Trail slick above 800 ft Oct–Apr",
      "Bear spray required by host",
    ],
    escort: false,
    seasonal: "Snow load on trail Dec–Mar; plan helicopter.",
    confidentiality: "confidential",
    qualificationIds: ["q-tower-climb", "q-first-aid"],
    routes: [
      {
        operatorId: "op-tongass-air",
        mode: "air",
        months: [4, 5, 6, 7, 8, 9, 10, 11],
        how: "Float plane to the cove, then a 1.2 mi trail climb",
      },
      {
        operatorId: "op-revilla-rotor",
        mode: "air",
        months: [12, 1, 2, 3],
        how: "Helicopter to the ridge while snow loads the trail",
      },
    ],
    source: { label: "Field capture (photo)", verifiedDaysAgo: 21, confidence: "high" },
  },
  {
    id: "site-douglas-hut",
    name: "Douglas Fiber Hut 3",
    kind: "Fiber regen hut",
    region: "Southeast",
    community: "Juneau",
    lat: 58.27,
    lng: -134.39,
    access: ["Road access, pullout at mile 4", "Locked enclosure — get key from client dispatch"],
    escort: false,
    seasonal: "Avalanche path above road; check DOT closures.",
    confidentiality: "confidential",
    qualificationIds: ["q-fiber-safety"],
    routes: [
      {
        operatorId: "op-amhs",
        mode: "sea",
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        how: "Ferry to Juneau, then road to the mile 4 pullout",
      },
    ],
    source: { label: "Client dispatcher", verifiedDaysAgo: 5, confidence: "high" },
  },
  {
    id: "site-thompson-pass",
    name: "Thompson Pass Cell Site",
    kind: "Cell tower",
    region: "Southcentral",
    community: "Valdez",
    lat: 61.13,
    lng: -145.74,
    access: ["Richardson Hwy mile 26, gated spur", "Escort required from landowner"],
    escort: true,
    seasonal: "Extreme snowfall; spur unplowed Nov–Apr.",
    confidentiality: "confidential",
    qualificationIds: ["q-tower-climb", "q-rf-awareness", "q-site-badge"],
    routes: [
      {
        operatorId: null,
        mode: "land",
        months: [5, 6, 7, 8, 9, 10],
        how: "Drive the Richardson Hwy to mile 26, then the gated spur",
      },
      {
        operatorId: "op-chugach-heli",
        mode: "air",
        months: [11, 12, 1, 2, 3, 4],
        how: "Helicopter while the spur is unplowed",
      },
    ],
    source: { label: "Operator email", verifiedDaysAgo: 40, confidence: "medium" },
  },
  {
    id: "site-hatcher-rpt",
    name: "Hatcher Pass Repeater",
    kind: "Radio repeater",
    region: "Southcentral",
    community: "Palmer",
    lat: 61.77,
    lng: -149.28,
    access: ["Summer: road to summit lot, 0.3 mi walk", "Winter: snow machine only"],
    escort: false,
    seasonal: "Road closed roughly Oct–Jul.",
    confidentiality: "open",
    qualificationIds: ["q-avalanche"],
    routes: [
      {
        operatorId: "op-matsu-haul",
        mode: "land",
        months: [7, 8, 9],
        how: "Road to the summit lot, then a 0.3 mi walk",
      },
      {
        operatorId: "op-matsu-haul",
        mode: "land",
        months: [10, 11, 12, 1, 2, 3, 4, 5, 6],
        how: "Snow machine from the gate, trailered by Mat-Su Hotshot",
      },
    ],
    source: { label: "Crew report", verifiedDaysAgo: 93, confidence: "low" },
  },
  {
    id: "site-cooper-landing",
    name: "Cooper Landing Shelter",
    kind: "Equipment shelter",
    region: "Southcentral",
    community: "Cooper Landing",
    lat: 60.49,
    lng: -149.83,
    access: ["Sterling Hwy pullout, 200 yd gravel spur"],
    escort: false,
    seasonal: "Spur muddy during breakup.",
    confidentiality: "open",
    qualificationIds: ["q-site-badge"],
    routes: [
      {
        operatorId: "op-matsu-haul",
        mode: "land",
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        how: "Hotshot freight down the Sterling Hwy to the pullout",
      },
      {
        operatorId: "op-kenai-air",
        mode: "air",
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        how: "Charter from Soldotna",
      },
    ],
    source: { label: "Operator phone call", verifiedDaysAgo: 26, confidence: "medium" },
  },
  {
    id: "site-coldfoot",
    name: "Coldfoot Microwave Site",
    kind: "Microwave relay",
    region: "Interior",
    community: "Coldfoot",
    lat: 67.25,
    lng: -150.17,
    access: ["Dalton Hwy mile 175", "Check in with camp on arrival", "No fuel north for 240 mi"],
    escort: false,
    seasonal: "−40° operations Dec–Feb; cold-weather kit mandatory.",
    confidentiality: "confidential",
    qualificationIds: ["q-cold-weather", "q-tower-climb", "q-medical"],
    routes: [
      {
        operatorId: "op-dalton-freight",
        mode: "land",
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        how: "Dalton Hwy to mile 175 (chain law Oct–Apr)",
      },
    ],
    source: { label: "Operator phone call", verifiedDaysAgo: 6, confidence: "high" },
  },
  {
    id: "site-fort-yukon",
    name: "Fort Yukon Earth Station",
    kind: "Satellite earth station",
    region: "Interior",
    community: "Fort Yukon",
    lat: 66.56,
    lng: -145.25,
    access: ["Fly-in only; strip to site by village truck", "Escort by local tech required"],
    escort: true,
    seasonal: "Breakup closes strip intermittently late Apr–May.",
    confidentiality: "confidential",
    qualificationIds: ["q-rf-awareness", "q-site-badge"],
    routes: [
      {
        operatorId: "op-yukon-air",
        mode: "air",
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        how: "Fly in, then the village truck from the strip (strip closes at times late Apr–May)",
      },
    ],
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

/** Every operator that appears in a site's routes, without repeats. */
export function operatorIdsFor(site: Site): string[] {
  return [...new Set(site.routes.flatMap((r) => (r.operatorId ? [r.operatorId] : [])))];
}

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
export const getSite = (id: string) => sites.find((s) => s.id === id);

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

/** Sites in a region (or all regions) whose name, community or kind contains the query. */
export function filterSites(list: Site[], region: Region | undefined, query: string) {
  return list.filter(
    (s) => (!region || s.region === region) && matches(query, [s.name, s.community, s.kind]),
  );
}

/** Operators serving a region (or any region) whose name, community or a service contains the query. */
export function filterOperators(list: Operator[], region: Region | undefined, query: string) {
  return list.filter(
    (o) =>
      (!region || o.regions.includes(region)) &&
      matches(query, [o.name, o.community, ...o.services]),
  );
}
