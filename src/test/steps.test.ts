import { describe, expect, it } from "vitest";
import { createSite } from "@/lib/sites";
import {
  createTrip,
  currentTrip,
  isFinished,
  isStarted,
  moveStop,
  nextStep,
  readTrips,
  removeStop,
  addStop,
  setStepDone,
  stepLabel,
  tripStatus,
  tripSteps,
  type Trip,
} from "@/lib/trips";

const sites = [
  createSite({ id: "a", name: "Bethel" })!,
  createSite({ id: "b", name: "Kasigluk" })!,
];

const twoSites = (id = "t", start = "2026-11-24", days = 3): Trip =>
  addStop(createTrip({ id, siteId: "a", start, days, sites }), "b", sites);

const mark = (trip: Trip, ...keys: string[]) =>
  keys.reduce((t, k) => setStepDone(t, k, true), trip);

describe("a trip's steps", () => {
  it("run from getting ready to the return checklist, four per site in order", () => {
    expect(tripSteps(twoSites()).map((s) => s.key)).toEqual([
      "ready",
      "pre",
      "travel:a",
      "arrive:a",
      "work:a",
      "depart:a",
      "travel:b",
      "arrive:b",
      "work:b",
      "depart:b",
      "travel-home",
      "return",
    ]);
  });

  it("follow the sites when they are reordered", () => {
    const t = moveStop(twoSites(), "b", -1);
    expect(tripSteps(t)[2]?.key).toBe("travel:b");
  });
});

describe("the next step", () => {
  it("starts at getting ready and moves on as steps are marked done", () => {
    let t = twoSites();
    expect(nextStep(t)?.key).toBe("ready");
    t = mark(t, "ready", "pre");
    expect(nextStep(t)?.key).toBe("travel:a");
  });

  it("is after the furthest step marked, so a forgotten mark doesn't hold the trip back", () => {
    const t = mark(twoSites(), "arrive:a");
    expect(nextStep(t)?.key).toBe("work:a");
  });

  it("can be taken back", () => {
    const t = setStepDone(mark(twoSites(), "ready"), "ready", false);
    expect(nextStep(t)?.key).toBe("ready");
    expect(isStarted(t)).toBe(false);
  });

  it("is gone once the return checklist is marked done, even with steps skipped", () => {
    const t = mark(twoSites(), "work:a", "return");
    expect(nextStep(t)).toBeUndefined();
    expect(isFinished(t)).toBe(true);
  });

  it("follows a reorder after some steps are marked", () => {
    const t = moveStop(mark(twoSites(), "ready", "pre"), "b", -1);
    expect(nextStep(t)?.key).toBe("travel:b");
  });
});

describe("trip status with steps", () => {
  const start = "2026-11-24";

  it("goes by the dates while nothing is marked", () => {
    const t = twoSites("t", start, 3);
    expect(tripStatus(t, "2026-11-23")).toBe("upcoming");
    expect(tripStatus(t, "2026-11-25")).toBe("current");
    expect(tripStatus(t, "2026-11-30")).toBe("past");
  });

  it("stays under way through a weather hold once a step is marked", () => {
    const t = mark(twoSites("t", start, 3), "ready");
    expect(tripStatus(t, "2026-11-23")).toBe("current");
    expect(tripStatus(t, "2026-12-15")).toBe("current");
  });

  it("is done once the return checklist is marked, whatever the dates", () => {
    const t = mark(twoSites("t", start, 3), "return");
    expect(tripStatus(t, "2026-11-24")).toBe("past");
  });

  it("picks the trip under way with the latest first day", () => {
    const abandoned = mark(twoSites("old", "2026-10-01"), "ready");
    const now = mark(twoSites("new", "2026-11-20"), "ready");
    const later = twoSites("later", "2026-12-20");
    expect(currentTrip([abandoned, now, later], "2026-11-24")?.id).toBe("new");
  });
});

describe("step marks", () => {
  it("are dropped with a removed site", () => {
    const t = removeStop(mark(twoSites(), "ready", "travel:a", "arrive:b"), "a");
    expect(t.done).toEqual(["ready", "arrive:b"]);
  });

  it("never change any ticks", () => {
    const t = twoSites();
    expect(mark(t, "pre", "arrive:a").loadout).toEqual(t.loadout);
  });

  it("read back from storage, each once, and default to none", () => {
    const t = mark(twoSites(), "ready", "pre");
    expect(readTrips(JSON.stringify([t]))[0]?.done).toEqual(["ready", "pre"]);
    const raw = JSON.stringify([
      { ...t, done: ["ready", "ready", 7] },
      { ...t, id: "u", done: "x" },
    ]);
    expect(readTrips(raw).map((x) => x.done)).toEqual([["ready"], []]);
  });
});

describe("step labels", () => {
  it("name each step and where it happens", () => {
    let t = twoSites();
    t = {
      ...t,
      stops: t.stops.map((s) => (s.siteId === "a" ? { ...s, route: { by: "self" } } : s)),
    };
    const labels = tripSteps(t).map((s) => stepLabel(t, s, sites));
    expect(labels.slice(0, 6)).toEqual([
      { title: "Get ready", where: "Prep checklists and qualifications" },
      { title: "Build and ship the loadout", where: "Pre-loadout at home base" },
      { title: "Travel to Bethel", where: "Drive yourself" },
      { title: "Arrival checklist", where: "Bethel" },
      { title: "Do the job", where: "Bethel" },
      { title: "Departure pre-loadout", where: "Bethel" },
    ]);
    expect(labels[6]).toEqual({ title: "Travel to Kasigluk", where: "Choose how to get there" });
    expect(labels.at(-1)).toEqual({ title: "Return checklist", where: "Home base" });
  });
});
