// A technician's own record of the qualifications they hold and when each
// expires. It is optional, asks for no name, and stays on this phone: it is
// never part of a feedback note or a shared trip plan.
//
// It is a prep reminder only. A trip can say a qualification is in the record
// or expires before the trip ends; it never says anyone is cleared to go.
import { useSyncExternalStore } from "react";
import { getQualification, monthName } from "./data";

export const QUAL_RECORD_VERSION = 1;

export interface HeldQualification {
  id: string;
  /** "YYYY-MM": valid through the end of that month. Null when it doesn't expire. */
  expires: string | null;
}

export interface QualRecord {
  v: typeof QUAL_RECORD_VERSION;
  held: HeldQualification[];
}

export const emptyRecord = (): QualRecord => ({ v: QUAL_RECORD_VERSION, held: [] });

// ---- Months ------------------------------------------------------------------

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const isMonth = (month: string) => MONTH.test(month);

/** "2026-11-17" → "2026-11" */
export const monthOf = (date: string) => date.slice(0, 7);

export function addMonths(month: string, n: number): string {
  const m = MONTH.exec(month);
  if (!m) return month;
  const index = Number(m[1]) * 12 + (Number(m[2]) - 1) + n;
  const year = Math.floor(index / 12);
  return `${year}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** "2027-03" → "Mar 2027" */
export function monthLabel(month: string): string {
  const m = MONTH.exec(month);
  return m ? `${monthName(Number(m[2]))} ${m[1]}` : month;
}

// ---- Status against a trip ---------------------------------------------------------

export type QualStatus =
  | { kind: "not-recorded" }
  | { kind: "no-expiry" }
  | { kind: "valid"; expires: string }
  | { kind: "expires-during"; expires: string }
  | { kind: "expired"; expires: string };

/**
 * Where a qualification stands for a trip ending on `tripEnd` ("YYYY-MM-DD"),
 * as of `today`. Expiring in the trip's last month counts as valid, since
 * the month runs to its end.
 */
export function qualStatus(
  record: QualRecord,
  qualId: string,
  tripEnd: string,
  today: string,
): QualStatus {
  const held = record.held.find((h) => h.id === qualId);
  if (!held) return { kind: "not-recorded" };
  if (held.expires === null) return { kind: "no-expiry" };
  if (held.expires < monthOf(today)) return { kind: "expired", expires: held.expires };
  if (held.expires < monthOf(tripEnd)) return { kind: "expires-during", expires: held.expires };
  return { kind: "valid", expires: held.expires };
}

export function statusLabel(status: QualStatus): string {
  switch (status.kind) {
    case "not-recorded":
      return "Not in your record";
    case "no-expiry":
      return "In your record";
    case "valid":
      return `In your record, valid to ${monthLabel(status.expires)}`;
    case "expires-during":
      return `Expires ${monthLabel(status.expires)}, before this trip ends`;
    case "expired":
      return `Expired ${monthLabel(status.expires)}`;
  }
}

/** Statuses a technician should look at before the trip. */
export const needsAttention = (status: QualStatus) =>
  status.kind === "expires-during" || status.kind === "expired";

// ---- Changing the record -------------------------------------------------------

export function setHeld(record: QualRecord, qualId: string, held: boolean): QualRecord {
  const others = record.held.filter((h) => h.id !== qualId);
  return {
    ...record,
    held: held ? [...others, { id: qualId, expires: null }] : others,
  };
}

export function setExpiry(record: QualRecord, qualId: string, expires: string | null): QualRecord {
  if (expires !== null && !isMonth(expires)) return record;
  return {
    ...record,
    held: record.held.map((h) => (h.id === qualId ? { ...h, expires } : h)),
  };
}

// ---- Storage -------------------------------------------------------------------

/**
 * Reads the stored record, keeping every entry it understands: known
 * qualifications, each once, with a valid month or no expiry. Anything else
 * reads as an empty record, so damaged storage never breaks a page.
 */
export function readQualRecord(raw: string | null): QualRecord {
  if (!raw) return emptyRecord();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptyRecord();
    const r = parsed as Record<string, unknown>;
    if (r["v"] !== QUAL_RECORD_VERSION || !Array.isArray(r["held"])) return emptyRecord();
    const held: HeldQualification[] = [];
    for (const entry of r["held"]) {
      if (typeof entry !== "object" || entry === null) continue;
      const { id, expires } = entry as Record<string, unknown>;
      if (typeof id !== "string" || !getQualification(id) || held.some((h) => h.id === id)) {
        continue;
      }
      held.push({ id, expires: typeof expires === "string" && isMonth(expires) ? expires : null });
    }
    return { v: QUAL_RECORD_VERSION, held };
  } catch {
    return emptyRecord();
  }
}

const KEY = "fo-qual-record";
const CHANGE_EVENT = "fo-qual-record";

let cachedRaw: string | null | undefined;
let cachedRecord: QualRecord = emptyRecord();

function snapshot(): QualRecord {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Storage blocked: behave as if nothing is recorded.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedRecord = readQualRecord(raw);
  }
  return cachedRecord;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The record, or null until storage has been read (pages built ahead of time). */
export function useQualRecord(): QualRecord | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

export function saveQualRecord(record: QualRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // Storage full or blocked: nothing more can be done on this phone.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const updateQualRecord = (change: (record: QualRecord) => QualRecord) =>
  saveQualRecord(change(snapshot()));
