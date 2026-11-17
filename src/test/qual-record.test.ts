import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addMonths,
  emptyRecord,
  monthLabel,
  needsAttention,
  qualStatus,
  readQualRecord,
  setExpiry,
  setHeld,
  statusLabel,
  type QualRecord,
} from "@/lib/qual-record";
import { tripEnd } from "@/lib/trips";

const originalTz = process.env["TZ"];
beforeAll(() => {
  process.env["TZ"] = "America/Anchorage";
});
afterAll(() => {
  process.env["TZ"] = originalTz;
});

const record = (expires: string | null): QualRecord =>
  setExpiry(setHeld(emptyRecord(), "q-tower-climb", true), "q-tower-climb", expires);

describe("months", () => {
  it("steps across year ends and labels them", () => {
    expect(addMonths("2026-11", 2)).toBe("2027-01");
    expect(addMonths("2027-01", -1)).toBe("2026-12");
    expect(addMonths("2026-11", -23)).toBe("2024-12");
    expect(monthLabel("2027-03")).toBe("Mar 2027");
  });
});

describe("qualStatus", () => {
  // A trip from 28 Nov to 2 Dec 2026, looked at on 17 Nov.
  const end = tripEnd({ start: "2026-11-28", days: 5 });
  const today = "2026-11-17";

  it("ends on the right local day in Alaska", () => {
    expect(end).toBe("2026-12-02");
  });

  it("counts an expiry in the trip's last month as valid", () => {
    expect(qualStatus(record("2026-12"), "q-tower-climb", end, today)).toEqual({
      kind: "valid",
      expires: "2026-12",
    });
  });

  it("flags an expiry before the trip ends, and one already past", () => {
    const during = qualStatus(record("2026-11"), "q-tower-climb", end, today);
    expect(during).toEqual({ kind: "expires-during", expires: "2026-11" });
    expect(statusLabel(during)).toBe("Expires Nov 2026, before this trip ends");
    const past = qualStatus(record("2026-10"), "q-tower-climb", end, today);
    expect(past).toEqual({ kind: "expired", expires: "2026-10" });
    expect([during, past].every(needsAttention)).toBe(true);
  });

  it("knows a qualification with no expiry, and one not recorded", () => {
    expect(statusLabel(qualStatus(record(null), "q-tower-climb", end, today))).toBe(
      "In your record",
    );
    expect(statusLabel(qualStatus(record(null), "q-medical", end, today))).toBe(
      "Not in your record",
    );
  });

  it("never says anyone is cleared", () => {
    const labels = ["2026-10", "2026-11", "2026-12", null].map((e) =>
      statusLabel(qualStatus(record(e), "q-tower-climb", end, today)),
    );
    expect(labels.join(" ").toLowerCase()).not.toMatch(/clear|ok to go|approved/);
  });
});

describe("changing the record", () => {
  it("adds, dates and removes a qualification", () => {
    let r = setHeld(emptyRecord(), "q-medical", true);
    r = setExpiry(r, "q-medical", "2027-06");
    expect(r.held).toEqual([{ id: "q-medical", expires: "2027-06" }]);
    expect(setExpiry(r, "q-medical", "June").held[0]?.expires).toBe("2027-06");
    expect(setHeld(r, "q-medical", false).held).toEqual([]);
  });
});

describe("readQualRecord", () => {
  it("keeps known qualifications once each and drops the rest", () => {
    const raw = JSON.stringify({
      v: 1,
      held: [
        { id: "q-medical", expires: "2027-06" },
        { id: "q-medical", expires: "2028-01" },
        { id: "q-nowhere", expires: null },
        { id: "q-first-aid", expires: "soon" },
        "nonsense",
      ],
    });
    expect(readQualRecord(raw).held).toEqual([
      { id: "q-medical", expires: "2027-06" },
      { id: "q-first-aid", expires: null },
    ]);
  });

  it("survives empty, broken or old storage", () => {
    expect(readQualRecord(null)).toEqual(emptyRecord());
    expect(readQualRecord("{not json")).toEqual(emptyRecord());
    expect(readQualRecord(JSON.stringify({ v: 0, held: [] }))).toEqual(emptyRecord());
  });
});
