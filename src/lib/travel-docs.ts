// Travel documents: images a technician keeps with a trip, such as a boarding
// pass. They are theirs, not records, and stay on this phone: never in a
// shared plan or a feedback note. Each belongs to one travel step of a trip.
//
// The pure rules are here; the files themselves live in IndexedDB
// (doc-store.ts), never in the trip's own storage, which is too small for
// photos and would stop saving ticks once full.
import type { Trip } from "./trips";

export type DocKind = "boarding-pass" | "shipping" | "permit" | "other";

export const DOC_KINDS: DocKind[] = ["boarding-pass", "shipping", "permit", "other"];

export const DOC_LABEL: Record<DocKind, string> = {
  "boarding-pass": "Boarding pass",
  shipping: "Shipping paper",
  permit: "Permit",
  other: "Other",
};

/** Files a technician can add: images only. */
export const isDocType = (type: string) => /^image\//.test(type);

/** The largest file kept, so one photo can't fill the phone's storage for the app. */
export const MAX_DOC_BYTES = 15 * 1024 * 1024;

export interface TravelDocMeta {
  id: string;
  tripId: string;
  /** The travel step it belongs to: `travel:<siteId>` or `travel-home`. */
  stepKey: string;
  kind: DocKind;
  /** When it was added, as milliseconds since 1970. */
  added: number;
}

/** The keys of a trip's travel steps, which are the steps documents belong to. */
export function travelStepKeys(trip: Pick<Trip, "stops">): string[] {
  return [...trip.stops.map((s) => `travel:${s.siteId}`), "travel-home"];
}

/**
 * The documents no trip on this phone still has a travel step for: their
 * trip was deleted, or their site was taken off the trip.
 */
export function orphanDocs(
  docs: Pick<TravelDocMeta, "id" | "tripId" | "stepKey">[],
  trips: Pick<Trip, "id" | "stops">[],
): string[] {
  const keys = new Map(trips.map((t) => [t.id, new Set(travelStepKeys(t))]));
  return docs.filter((d) => !keys.get(d.tripId)?.has(d.stepKey)).map((d) => d.id);
}

export const isDocKind = (v: unknown): v is DocKind => DOC_KINDS.includes(v as DocKind);
