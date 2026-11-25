import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addItem, emptyLoadout, setWaybill, toggleTick } from "@/lib/loadout";
import {
  createSite,
  setConfidentiality,
  setKind,
  toggleSiteQualification,
  type Site,
} from "@/lib/sites";
import {
  addDays,
  addStop,
  checklistDefinition,
  checklistProgress,
  createTrip,
  currentTrip,
  dateRangeLabel,
  formatLocalDate,
  includeNeeded,
  legacyTripCount,
  moveStop,
  neededWhenLabel,
  parseLocalDate,
  readTrips,
  removeStop,
  routeLabel,
  setDates,
  setRoute,
  shareText,
  sitesNotOnTrip,
  todayString,
  toggleItem,
  toggleQual,
  toggleSkip,
  tripMonths,
  tripQualifications,
  tripsUsingSite,
  tripStatus,
  tripTitle,
  tripChecks,
  TRIP_VERSION,
  type Trip,
} from "@/lib/trips";

// Run the date tests in Alaska time, where reading "YYYY-MM-DD" as UTC would
// land on the previous day.
const originalTz = process.env["TZ"];
beforeAll(() => {
  process.env["TZ"] = "America/Anchorage";
});
afterAll(() => {
  process.env["TZ"] = originalTz;
});

function site(id: string, name: string, kind: Site["kind"], quals: string[] = []): Site {
  let s = setKind(createSite({ id, name, community: "Bethel" })!, kind);
  for (const q of quals) s = toggleSiteQualification(s, q);
  return s;
}

const tower = site("tower", "Bethel cell tower", "Cell tower", ["q-tower-climb", "q-rf-awareness"]);
const hut = setConfidentiality(
  site("hut", "Fiber hut", "Fiber regen hut", ["q-fiber-safety"]),
  "open",
);
const relay = site("relay", "Ridge relay", "Microwave relay", ["q-cold-weather", "q-medical"]);
const bare = createSite({ id: "bare", name: "Somewhere new" })!;
const sites = [tower, hut, relay, bare];

const trip = (siteId: string, start: string, days = 1): Trip =>
  createTrip({ id: `t-${siteId}-${start}`, siteId, start, days, sites });

describe("local dates", () => {
  it("round-trips a date and never slips a day in Alaska", () => {
    expect(formatLocalDate(parseLocalDate("2026-11-16"))).toBe("2026-11-16");
    expect(formatLocalDate(parseLocalDate("2026-03-08"))).toBe("2026-03-08"); // DST starts
  });

  it("adds days across months, years and daylight-saving changes", () => {
    expect(addDays("2026-11-30", 2)).toBe("2026-12-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
    expect(addDays("2026-11-16", -16)).toBe("2026-10-31");
  });

  it("takes today from local time, not UTC", () => {
    // 07:00 UTC on 16 Nov is 22:00 on 15 Nov in Anchorage.
    expect(todayString(Date.UTC(2026, 10, 16, 7, 0))).toBe("2026-11-15");
  });

  it("labels date ranges", () => {
    expect(dateRangeLabel({ start: "2026-11-16", days: 1 })).toBe("16 Nov 2026");
    expect(dateRangeLabel({ start: "2026-11-16", days: 3 })).toBe("16–18 Nov 2026");
    expect(dateRangeLabel({ start: "2026-11-30", days: 3 })).toBe("30 Nov – 2 Dec 2026");
    expect(dateRangeLabel({ start: "2026-12-31", days: 2 })).toBe("31 Dec 2026 – 1 Jan 2027");
  });

  it("lists every month a trip touches", () => {
    expect(tripMonths({ start: "2026-11-29", days: 4 })).toEqual([11, 12]);
  });
});

describe("trip status", () => {
  const t = { start: "2026-11-16", days: 3 };
  it("is upcoming, current or past against today's date", () => {
    expect(tripStatus(t, "2026-11-15")).toBe("upcoming");
    expect(tripStatus(t, "2026-11-16")).toBe("current");
    expect(tripStatus(t, "2026-11-18")).toBe("current");
    expect(tripStatus(t, "2026-11-19")).toBe("past");
  });

  it("finds the trip under way, else the soonest upcoming one", () => {
    const past = trip("tower", "2026-10-01");
    const later = trip("tower", "2026-12-20");
    const sooner = trip("hut", "2026-12-01");
    const now = trip("relay", "2026-11-16", 2);
    expect(currentTrip([past, later, sooner], "2026-11-16")?.id).toBe(sooner.id);
    expect(currentTrip([past, later, sooner, now], "2026-11-17")?.id).toBe(now.id);
    expect(currentTrip([past], "2026-11-16")).toBeUndefined();
  });
});

describe("building a trip", () => {
  it("starts with one site, no way there chosen and its own copy of every checklist", () => {
    const t = trip("tower", "2026-11-16", 3);
    expect(t.v).toBe(TRIP_VERSION);
    expect(t.stops).toEqual([{ siteId: "tower", route: null, meet: null, lodging: null }]);
    expect(t.checklists).toHaveLength(4);
    expect(t.checklists.every((c) => c.ticks.every((x) => !x) && !c.skipped)).toBe(true);
    expect(tripTitle(t, sites)).toBe("Bethel cell tower");
  });

  it("adds each of the technician's sites once, in order, and only theirs", () => {
    let t = trip("hut", "2026-07-10");
    t = addStop(addStop(addStop(t, "tower", sites), "tower", sites), "not-a-site", sites);
    expect(t.stops.map((s) => s.siteId)).toEqual(["hut", "tower"]);
    expect(tripTitle(t, sites)).toBe("Fiber hut + 1 more");
    expect(sitesNotOnTrip(t, sites).map((s) => s.id)).toEqual(["relay", "bare"]);
  });

  it("moves a site earlier or later and ignores a move off either end", () => {
    let t = addStop(addStop(trip("hut", "2026-07-10"), "tower", sites), "relay", sites);
    t = moveStop(t, "relay", -1);
    expect(t.stops.map((s) => s.siteId)).toEqual(["hut", "relay", "tower"]);
    expect(moveStop(t, "hut", -1)).toBe(t);
    expect(moveStop(t, "tower", 1)).toBe(t);
  });

  it("names a trip whose sites were all deleted", () => {
    expect(tripTitle(trip("tower", "2026-07-10"), [])).toBe("Trip with no sites");
  });

  it("finds the trips a site is on", () => {
    const a = trip("tower", "2026-07-10");
    const b = addStop(trip("hut", "2026-08-10"), "tower", sites);
    const c = trip("relay", "2026-09-10");
    expect(tripsUsingSite([a, b, c], "tower").map((t) => t.id)).toEqual([a.id, b.id]);
    expect(tripsUsingSite([a, b, c], "bare")).toEqual([]);
  });

  it("lists each qualification once across all the trip's sites", () => {
    const t = addStop(addStop(trip("tower", "2026-07-10"), "relay", sites), "bare", sites);
    expect(tripQualifications(t, sites)).toEqual([
      "q-tower-climb",
      "q-rf-awareness",
      "q-cold-weather",
      "q-medical",
    ]);
    expect(toggleQual(toggleQual(t, "q-medical"), "q-medical").quals).toEqual([]);
  });

  it("counts ticks only in checklists that aren't skipped", () => {
    let t = trip("tower", "2026-11-16");
    t = toggleItem(toggleItem(t, "cl-crew", 0), "cl-ppe", 1);
    expect(checklistProgress(t)).toEqual({ done: 2, total: 22 });
    t = toggleSkip(t, "cl-ppe");
    expect(checklistProgress(t)).toEqual({ done: 1, total: 16 });
  });
});

describe("getting there", () => {
  it("is chosen by hand: an operator, driving yourself, or nothing yet", () => {
    let t = trip("tower", "2026-07-10");
    expect(routeLabel(t.stops[0]!.route)).toBe("");
    t = setRoute(t, "tower", { by: "operator", operatorId: "op-grant-aviation" });
    expect(routeLabel(t.stops[0]!.route)).toBe("Grant Aviation");
    t = setRoute(t, "tower", { by: "self" });
    expect(routeLabel(t.stops[0]!.route)).toBe("Drive yourself");
  });

  it("is kept when the dates change", () => {
    const t = setRoute(trip("tower", "2026-07-10"), "tower", { by: "self" });
    expect(setDates(t, "2027-01-10", 2, sites).stops[0]?.route).toEqual({ by: "self" });
  });
});

describe("checklists by site and season", () => {
  const state = (t: Trip) =>
    Object.fromEntries(
      t.checklists.map((c) => [c.id, c.skipped ? (c.autoSkipped ? "auto" : "user") : "in"]),
    );

  it("starts a trip with the lists its sites and months don't need skipped", () => {
    // A fiber hut in summer: no climb, no cold, no radio site.
    expect(state(trip("hut", "2026-07-10"))).toEqual({
      "cl-crew": "in",
      "cl-ppe": "auto",
      "cl-parts": "auto",
      "cl-paper": "in",
    });
    // A cell tower that needs a climb, in November, needs everything.
    expect(Object.values(state(trip("tower", "2026-11-16")))).toEqual(["in", "in", "in", "in"]);
  });

  it("counts any month the trip touches, not just the first", () => {
    // 28 Sep – 2 Oct reaches October, a cold month.
    expect(state(trip("hut", "2026-09-28", 5))["cl-ppe"]).toBe("in");
  });

  it("includes a list again when a new site or new dates need it", () => {
    const summer = trip("hut", "2026-07-10");
    expect(state(addStop(summer, "tower", sites))).toMatchObject({
      "cl-ppe": "in",
      "cl-parts": "in",
    });
    expect(state(setDates(summer, "2026-12-01", 2, sites))).toMatchObject({
      "cl-ppe": "in",
      "cl-parts": "auto",
    });
  });

  it("includes a list again when a site on the trip is given a kind that needs it", () => {
    const t = trip("bare", "2026-07-10");
    expect(state(t)["cl-parts"]).toBe("auto");
    const nowATower = sites.map((s) => (s.id === "bare" ? setKind(s, "Cell tower") : s));
    expect(state(includeNeeded(t, nowATower))["cl-parts"]).toBe("in");
  });

  it("never skips a list after the trip is created", () => {
    let t = trip("tower", "2026-11-16");
    t = setDates(addStop(removeStop(t, "tower"), "hut", sites), "2027-07-10", 1, sites);
    expect(Object.values(state(t))).toEqual(["in", "in", "in", "in"]);
  });

  it("leaves a list alone once the user has skipped or included it", () => {
    let t = trip("hut", "2026-07-10");
    t = toggleSkip(toggleSkip(t, "cl-ppe"), "cl-ppe"); // included, then skipped again by hand
    expect(state(t)["cl-ppe"]).toBe("user");
    expect(state(addStop(t, "tower", sites))["cl-ppe"]).toBe("user");
  });

  it("says when a list is needed", () => {
    expect(neededWhenLabel(checklistDefinition("cl-ppe")!)).toBe(
      "a site needs Tower climb cert or Cold-weather ops, or the trip falls in Oct–Apr",
    );
    expect(neededWhenLabel(checklistDefinition("cl-parts")!)).toBe(
      "a site is a microwave repeater, cell tower, radio repeater or microwave relay",
    );
  });
});

describe("the loadout on a trip", () => {
  it("starts empty and drops a removed site's ticks", () => {
    let t = addStop(trip("tower", "2026-07-10"), "hut", sites);
    expect(t.loadout).toEqual(emptyLoadout());
    t = {
      ...t,
      loadout: toggleTick(
        toggleTick(addItem(t.loadout, { id: "a", name: "Tape" }), "pre", "a"),
        "arrive:hut",
        "a",
      ),
    };
    expect(tripChecks(t).map((c) => c.key)).toContain("arrive:hut");
    expect(Object.keys(removeStop(t, "hut").loadout.ticks)).toEqual(["pre"]);
  });

  it("is summed up in a shared plan, with each waybill", () => {
    let t = trip("hut", "2026-07-10");
    let l = addItem(t.loadout, { id: "a", name: "Fuel", dangerous: true });
    l = setWaybill(addItem(l, { id: "b", name: "Tape" }), "pre", "027 1234");
    t = { ...t, loadout: l };
    const text = shareText(t, sites);
    expect(text).toContain("Loadout: 2 items; 1 to declare as dangerous goods.");
    expect(text).toContain("Shipped from home base: waybill 027 1234.");
  });

  it("counts dangerous goods picked up at a site in a shared plan", () => {
    let t = trip("hut", "2026-07-10");
    const l = addItem(t.loadout, { id: "a", name: "Fuel", dangerous: true }, "arrive:hut");
    t = { ...t, loadout: l };
    expect(shareText(t, sites)).toContain("1 to declare as dangerous goods");
  });
});

describe("shareText", () => {
  it("warns when any site is confidential and says how to get there", () => {
    let t = addStop(trip("tower", "2026-07-10"), "hut", sites);
    t = setRoute(setRoute(t, "tower", { by: "operator", operatorId: "op-grant-aviation" }), "hut", {
      by: "self",
    });
    const text = shareText(t, sites);
    expect(text.startsWith("CONFIDENTIAL — keep this plan with the technicians")).toBe(true);
    expect(text).toContain("1. Bethel cell tower — Bethel");
    expect(text).toContain("Getting there: Grant Aviation, 1-888-359-4726");
    expect(text).toContain("Getting there: drive yourself.");
    expect(text).not.toMatch(/sample/i);
  });

  it("has no warning for open sites", () => {
    const text = shareText(setRoute(trip("hut", "2026-07-10"), "hut", { by: "self" }), sites);
    expect(text).not.toContain("CONFIDENTIAL");
    expect(text).not.toMatch(/sample/i);
    expect(text).not.toContain("crew");
  });
});

describe("readTrips", () => {
  it("round-trips a trip through storage", () => {
    const t = setRoute(trip("tower", "2026-07-10"), "tower", { by: "self" });
    expect(readTrips(JSON.stringify([t]))).toEqual([t]);
  });

  it("keeps every trip it understands and drops the rest", () => {
    const good = trip("tower", "2026-11-16");
    const raw = JSON.stringify([
      good,
      { ...good, id: "old", v: 1 },
      { ...good, id: "bad-date", start: "2026-02-30" },
      "nonsense",
    ]);
    expect(readTrips(raw).map((t) => t.id)).toEqual([good.id]);
  });

  it("fills in anything missing, so a field added later never drops a trip", () => {
    const [t] = readTrips(JSON.stringify([{ v: TRIP_VERSION, id: "x", start: "2026-11-16" }]));
    expect(t).toEqual({
      v: TRIP_VERSION,
      id: "x",
      start: "2026-11-16",
      days: 1,
      stops: [],
      checklists: [],
      quals: [],
      loadout: { pieces: [], items: [], ticks: {}, waybills: {} },
      homeMeet: null,
      done: [],
    });
  });

  it("reads an operator that has left the records as not chosen, and keeps each site once", () => {
    const raw = JSON.stringify([
      {
        ...trip("tower", "2026-11-16"),
        stops: [
          { siteId: "tower", route: { by: "operator", operatorId: "op-gone" } },
          { siteId: "tower", route: { by: "self" } },
          { siteId: "hut", route: { by: "teleport" } },
        ],
      },
    ]);
    expect(readTrips(raw)[0]?.stops).toEqual([
      { siteId: "tower", route: null, meet: null, lodging: null },
      { siteId: "hut", route: null, meet: null, lodging: null },
    ]);
  });

  it("survives empty or broken storage", () => {
    expect(readTrips(null)).toEqual([]);
    expect(readTrips("{not json")).toEqual([]);
    expect(readTrips('{"a":1}')).toEqual([]);
  });

  it("counts the old trips planned on the sample sites", () => {
    expect(legacyTripCount(null)).toBe(0);
    expect(legacyTripCount("{broken")).toBe(0);
    expect(legacyTripCount(JSON.stringify([{ v: 1 }, { v: 1 }]))).toBe(2);
  });
});
