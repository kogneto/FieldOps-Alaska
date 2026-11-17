import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getSite } from "@/lib/data";
import {
  addDays,
  addStop,
  checklistProgress,
  chooseRoute,
  createTrip,
  currentTrip,
  dateRangeLabel,
  formatLocalDate,
  parseLocalDate,
  readTrips,
  setDates,
  setRoute,
  shareText,
  toggleItem,
  toggleQual,
  toggleSkip,
  todayString,
  tripMonths,
  tripQualifications,
  tripStatus,
  tripTitle,
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

const trip = (siteId: string, start: string, days = 1): Trip =>
  createTrip({ id: `t-${siteId}-${start}`, siteId, start, days });

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
    const past = trip("site-coldfoot", "2026-10-01");
    const later = trip("site-coldfoot", "2026-12-20");
    const sooner = trip("site-fort-yukon", "2026-12-01");
    const now = trip("site-hatcher-rpt", "2026-11-16", 2);
    expect(currentTrip([past, later, sooner], "2026-11-16")?.id).toBe(sooner.id);
    expect(currentTrip([past, later, sooner, now], "2026-11-17")?.id).toBe(now.id);
    expect(currentTrip([past], "2026-11-16")).toBeUndefined();
  });
});

describe("routes", () => {
  const gravina = getSite("site-gravina-rpt")!;
  const thompson = getSite("site-thompson-pass")!;

  it("picks the route that works in the trip's months", () => {
    expect(chooseRoute(gravina, [7])).toBe(0); // float plane in summer
    expect(chooseRoute(gravina, [1])).toBe(1); // helicopter in winter
    expect(chooseRoute(thompson, [5])).toBe(0); // drive yourself
    expect(chooseRoute(thompson, [12])).toBe(1); // helicopter
  });

  it("falls back to the first month's route when none covers the whole trip", () => {
    expect(tripMonths({ start: "2026-11-29", days: 4 })).toEqual([11, 12]);
    expect(chooseRoute(gravina, [11, 12])).toBe(0);
  });

  it("reroutes a stop when new dates rule its route out, and keeps a choice that still works", () => {
    const summer = trip("site-gravina-rpt", "2026-07-10");
    expect(summer.stops[0]?.routeIndex).toBe(0);
    expect(setDates(summer, "2027-01-10", 2).stops[0]?.routeIndex).toBe(1);

    const cooper = setRoute(trip("site-cooper-landing", "2026-07-10"), "site-cooper-landing", 1);
    expect(setDates(cooper, "2027-01-10", 2).stops[0]?.routeIndex).toBe(1);
  });
});

describe("building a trip", () => {
  it("starts with one site and its own copy of every checklist", () => {
    const t = trip("site-coldfoot", "2026-11-16", 3);
    expect(t.stops).toEqual([{ siteId: "site-coldfoot", routeIndex: 0 }]);
    expect(t.checklists).toHaveLength(4);
    expect(t.checklists.every((c) => c.ticks.every((x) => !x) && !c.skipped)).toBe(true);
    expect(tripTitle(t)).toBe("Coldfoot Microwave Site");
  });

  it("adds a site once and names the trip after the first", () => {
    let t = trip("site-thompson-pass", "2026-07-10");
    t = addStop(addStop(t, "site-coldfoot"), "site-coldfoot");
    expect(t.stops.map((s) => s.siteId)).toEqual(["site-thompson-pass", "site-coldfoot"]);
    expect(tripTitle(t)).toBe("Thompson Pass Cell Site + 1 more");
  });

  it("lists each qualification once across all the trip's sites", () => {
    const t = addStop(trip("site-thompson-pass", "2026-07-10"), "site-coldfoot");
    expect(tripQualifications(t)).toEqual([
      "q-tower-climb",
      "q-rf-awareness",
      "q-site-badge",
      "q-cold-weather",
      "q-medical",
    ]);
    expect(toggleQual(toggleQual(t, "q-medical"), "q-medical").quals).toEqual([]);
  });

  it("counts ticks only in checklists that aren't skipped", () => {
    let t = trip("site-coldfoot", "2026-11-16");
    t = toggleItem(toggleItem(t, "cl-crew", 0), "cl-ppe", 1);
    expect(checklistProgress(t)).toEqual({ done: 2, total: 22 });
    t = toggleSkip(t, "cl-ppe");
    expect(checklistProgress(t)).toEqual({ done: 1, total: 16 });
  });
});

describe("shareText", () => {
  it("warns when any site is confidential and says how to get there", () => {
    const t = addStop(trip("site-hatcher-rpt", "2026-07-10"), "site-thompson-pass");
    const text = shareText(t);
    expect(text.startsWith("CONFIDENTIAL — share inside the crew only.")).toBe(true);
    expect(text).toContain("Thompson Pass Cell Site — Valdez, Southcentral");
    expect(text).toContain("Getting there: Drive yourself.");
    expect(text).toContain("Escort required.");
  });

  it("has no warning when every site is open", () => {
    const text = shareText(addStop(trip("site-hatcher-rpt", "2026-07-10"), "site-cooper-landing"));
    expect(text).not.toContain("CONFIDENTIAL");
    expect(text).toContain("Mat-Su Hotshot Hauling, 907-555-0189");
  });
});

describe("readTrips", () => {
  it("keeps every trip it understands and drops the rest", () => {
    const good = trip("site-coldfoot", "2026-11-16");
    const raw = JSON.stringify([
      good,
      { ...good, id: "old", v: 0 },
      { ...good, id: "bad-date", start: "2026-02-30" },
      { ...good, id: "gone-site", stops: [{ siteId: "site-nowhere", routeIndex: 0 }] },
      "nonsense",
    ]);
    const trips = readTrips(raw);
    expect(trips.map((t) => t.id)).toEqual([good.id, "gone-site"]);
    expect(trips[1]?.stops).toEqual([]);
  });

  it("survives empty or broken storage", () => {
    expect(readTrips(null)).toEqual([]);
    expect(readTrips("{not json")).toEqual([]);
    expect(readTrips('{"a":1}')).toEqual([]);
  });

  it("repairs a stop whose route no longer exists", () => {
    const good = trip("site-coldfoot", "2026-11-16");
    const raw = JSON.stringify([{ ...good, stops: [{ siteId: "site-coldfoot", routeIndex: 9 }] }]);
    expect(readTrips(raw)[0]?.stops).toEqual([{ siteId: "site-coldfoot", routeIndex: 0 }]);
  });
});
