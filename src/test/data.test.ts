import { describe, expect, it } from "vitest";
import {
  checklists,
  communitiesLabel,
  daysSince,
  filterOperators,
  getQualification,
  isStale,
  meetingPlaces,
  monthsLabel,
  operators,
  regions,
  siteKinds,
  STALE_AFTER_DAYS,
} from "@/lib/data";

const source = (verified: string) => ({ label: "Test", verified, confidence: "high" as const });

describe("isStale", () => {
  const now = new Date(2026, 10, 25, 23, 30).getTime(); // 25 Nov 2026, late evening

  it("counts local calendar days, whatever the time of day", () => {
    expect(daysSince("2026-11-25", now)).toBe(0);
    expect(daysSince("2026-11-24", now)).toBe(1);
    expect(daysSince("2026-03-01", now)).toBe(269); // across a daylight saving change
  });

  it("marks records verified more than 60 days ago as stale", () => {
    expect(isStale(source("2026-09-26"), now)).toBe(false); // 60 days
    expect(isStale(source("2026-09-25"), now)).toBe(true); // 61 days
  });
});

const ids = (region: (typeof regions)[number] | undefined, query: string) =>
  filterOperators(operators, region, query).map((o) => o.id);

describe("filterOperators", () => {
  it("includes an operator in every region it serves", () => {
    expect(ids("Southeast", "")).toContain("op-alaska-marine-highway");
    expect(ids("Southwest", "")).toContain("op-alaska-marine-highway");
    expect(ids("Northwest", "")).not.toContain("op-alaska-marine-highway");
  });

  it("finds operators by a hub, a village they reach, or the company running an office", () => {
    expect(ids(undefined, "bethel")).toContain("op-northern-air-cargo");
    expect(ids(undefined, "Hooper Bay")).toEqual([
      "op-everts-air-cargo",
      "op-grant-aviation",
      "op-ryan-air",
      "op-yute-commuter-service",
    ]);
    expect(ids(undefined, "dependable freight")).toEqual(["op-everts-air-cargo"]);
  });

  it("ignores case and accents", () => {
    expect(ids("Northwest", "UTQIAGVIK")).toContain("op-alaska-air-cargo");
    expect(ids(undefined, "Utqiaġvik")).toContain("op-wright-air-service");
  });
});

describe("communitiesLabel", () => {
  it("names a few communities, and counts the rest", () => {
    expect(communitiesLabel(["Bethel"])).toBe("Bethel");
    expect(communitiesLabel(["A", "B", "C", "D"])).toBe("A, B, C, D");
    expect(communitiesLabel(["A", "B", "C", "D", "E"])).toBe("A, B, C and 2 more");
  });
});

// The record-format check: what every record must hold before it ships.
describe("operator records", () => {
  const now = Date.now();

  it("give every operator a unique id the feedback endpoint accepts", () => {
    const all = operators.map((o) => o.id);
    expect(new Set(all).size).toBe(all.length);
    for (const id of all) expect(id).toMatch(/^op-[a-z0-9-]{1,60}$/);
  });

  it("are real: no invented numbers, addresses or websites", () => {
    for (const o of operators) {
      const text = JSON.stringify(o);
      expect(text, o.id).not.toMatch(/555-01\d\d|example\.(com|org)/);
      expect(o.website, o.id).toMatch(/^https:\/\//);
    }
  });

  it("each have a region, a community, a phone and a service", () => {
    for (const o of operators) {
      expect(o.regions.length, o.id).toBeGreaterThan(0);
      for (const r of o.regions) expect(regions, o.id).toContain(r);
      expect(o.communities.length, o.id).toBeGreaterThan(0);
      expect(o.phone, o.id).toMatch(/^(1-\d{3}|\d{3})-\d{3}-\d{4}$/);
      expect(o.services.length, o.id).toBeGreaterThan(0);
    }
  });

  it("carry a source and a verified date that isn't in the future", () => {
    for (const o of operators) {
      expect(o.source.label, o.id).not.toBe("");
      expect(o.source.verified, o.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(daysSince(o.source.verified, now), o.id).toBeGreaterThanOrEqual(0);
    }
  });

  it("give every office a community, a distinct name and well-formed contacts", () => {
    for (const o of operators) {
      const keys = o.offices.map((office) => `${office.community}/${office.name}`);
      expect(new Set(keys).size, o.id).toBe(keys.length);
      for (const office of o.offices) {
        expect(office.community, o.id).not.toBe("");
        if (office.phone) expect(office.phone, o.id).toMatch(/^(1-\d{3}|\d{3})-\d{3}-\d{4}$/);
        if (office.email) expect(office.email, o.id).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/i);
        // A meeting place is a street address, never a mailbox.
        if (office.where) expect(office.where, o.id).not.toMatch(/P\.?\s?O\.? Box/i);
      }
    }
  });
});

describe("meetingPlaces", () => {
  it("offers only the offices with an address", () => {
    const aml = operators.find((o) => o.id === "op-alaska-marine-lines");
    const places = aml ? meetingPlaces(aml) : [];
    expect(places.map((p) => p.community)).toContain("Bethel");
    expect(places.map((p) => p.community)).not.toContain("Kotzebue");
  });
});

describe("checklist conditions", () => {
  it("point only at real qualifications, months and site kinds", () => {
    for (const c of checklists) {
      for (const id of c.neededWhen?.qualificationIds ?? []) {
        expect(getQualification(id), `${c.id} → ${id}`).toBeDefined();
      }
      for (const m of c.neededWhen?.months ?? []) expect(m >= 1 && m <= 12, c.id).toBe(true);
      for (const k of c.neededWhen?.siteKinds ?? []) expect(siteKinds, c.id).toContain(k);
    }
  });

  it("still number four sample lists", () => {
    expect(checklists.map((c) => c.id)).toEqual(["cl-crew", "cl-ppe", "cl-parts", "cl-paper"]);
  });
});

describe("monthsLabel", () => {
  it("names a whole year, one run, a run across New Year, and scattered months", () => {
    expect(monthsLabel([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toBe("All year");
    expect(monthsLabel([4, 5, 6, 7, 8, 9, 10, 11])).toBe("Apr–Nov");
    expect(monthsLabel([12, 1, 2, 3])).toBe("Dec–Mar");
    expect(monthsLabel([7])).toBe("Jul");
    expect(monthsLabel([1, 3, 5])).toBe("Jan, Mar, May");
  });
});
