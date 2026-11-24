import { describe, expect, it } from "vitest";
import {
  dateDaysBefore,
  filterOperators,
  checklists,
  getQualification,
  isStale,
  monthsLabel,
  operators,
  siteKinds,
  STALE_AFTER_DAYS,
} from "@/lib/data";

const source = (verifiedDaysAgo: number) => ({
  label: "Test",
  verifiedDaysAgo,
  confidence: "high" as const,
});

describe("isStale", () => {
  it("marks records verified more than 60 days ago as stale", () => {
    expect(isStale(source(STALE_AFTER_DAYS))).toBe(false);
    expect(isStale(source(STALE_AFTER_DAYS + 1))).toBe(true);
  });

  it("keeps a mix of fresh and stale records in the sample set", () => {
    const all = operators.map((r) => isStale(r.source));
    expect(all).toContain(true);
    expect(all).toContain(false);
  });
});

describe("dateDaysBefore", () => {
  it("counts back in local calendar days", () => {
    const now = new Date(2026, 10, 16, 9, 30).getTime(); // 16 Nov 2026
    expect(dateDaysBefore(now, 0)).toBe("2026-11-16");
    expect(dateDaysBefore(now, 16)).toBe("2026-10-31");
    expect(dateDaysBefore(now, 365)).toBe("2025-11-16");
  });
});

describe("filterOperators", () => {
  it("includes an operator in every region it serves", () => {
    const southcentral = filterOperators(operators, "Southcentral", "").map((o) => o.id);
    const southeast = filterOperators(operators, "Southeast", "").map((o) => o.id);
    expect(southcentral).toContain("op-amhs");
    expect(southeast).toContain("op-amhs");
    expect(filterOperators(operators, "Interior", "").map((o) => o.id)).not.toContain("op-amhs");
  });

  it("matches the query against name, community and services, ignoring case", () => {
    expect(filterOperators(operators, undefined, "SLING").map((o) => o.id)).toEqual([
      "op-revilla-rotor",
      "op-chugach-heli",
    ]);
    expect(filterOperators(operators, "Southeast", "sling").map((o) => o.id)).toEqual([
      "op-revilla-rotor",
    ]);
  });
});

describe("operator records", () => {
  it("give every operator a unique id", () => {
    const ids = operators.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
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
