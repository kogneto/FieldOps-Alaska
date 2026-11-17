// Trips are kept in the browser's local storage on this phone only.
import { useSyncExternalStore } from "react";
import { readTrips, type Trip } from "./trips";

const KEY = "fo-trips";
const CHANGE_EVENT = "fo-trips";

let cachedRaw: string | null | undefined;
let cachedTrips: Trip[] = [];

// Re-parse only when the stored text changes, so the snapshot is stable.
function snapshot(): Trip[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Storage blocked: behave as if there are no trips.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedTrips = readTrips(raw);
  }
  return cachedTrips;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Every stored trip, or null until storage has been read (pages built ahead of time). */
export function useTrips(): Trip[] | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

function save(trips: Trip[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(trips));
  } catch {
    // Storage full or blocked: nothing more can be done on this phone.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const addTrip = (trip: Trip) => save([...snapshot(), trip]);

export const updateTrip = (id: string, change: (trip: Trip) => Trip) =>
  save(snapshot().map((t) => (t.id === id ? change(t) : t)));

export const deleteTrip = (id: string) => save(snapshot().filter((t) => t.id !== id));

export function newTripId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
