import { describe, expect, it } from "vitest";
import {
  dateDaysBefore,
  filterOperators,
  filterSites,
  getOperator,
  isStale,
  operators,
  sites,
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
    const all = [...sites, ...operators].map((r) => isStale(r.source));
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

describe("filterSites", () => {
  it("filters by region and query together", () => {
    expect(filterSites(sites, "Interior", "").map((s) => s.id)).toEqual([
      "site-coldfoot",
      "site-fort-yukon",
    ]);
    expect(filterSites(sites, undefined, "repeater").map((s) => s.id)).toEqual([
      "site-gravina-rpt",
      "site-hatcher-rpt",
    ]);
  });
});

describe("sample data", () => {
  it("links every site only to operators that exist and serve its region", () => {
    for (const site of sites) {
      for (const id of site.reachBy) {
        const operator = getOperator(id);
        expect(operator, `${site.id} → ${id}`).toBeDefined();
        expect(operator?.regions, `${site.id} → ${id}`).toContain(site.region);
      }
    }
  });
});
