// Trips are kept in the browser's local storage on this phone only.
import { useSyncExternalStore } from "react";
import { legacyTripCount, readTrips, type Trip } from "./trips";

// Trips planned on the invented sample sites stay under the old key, which is
// never written again, so a tick on a new trip can't erase them before the
// technician has seen the notice about them.
const KEY = "fo-trips-v2";
const LEGACY_KEY = "fo-trips";
const CHANGE_EVENT = "fo-trips";

let cachedRaw: string | null | undefined;
let cachedTrips: Trip[] = [];

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Storage blocked: behave as if nothing is stored.
    return null;
  }
}

// Re-parse only when the stored text changes, so the snapshot is stable.
function snapshot(): Trip[] {
  const raw = read(KEY);
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

/** How many old trips planned on the sample sites are still stored. Zero until hydrated. */
export function useLegacyTripCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => legacyTripCount(read(LEGACY_KEY)),
    () => 0,
  );
}

export function clearLegacyTrips() {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Storage blocked: nothing to clear.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function save(trips: Trip[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(trips));
  } catch {
    // Storage full or blocked: nothing more can be done on this phone.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** The trips as stored right now, for use in event handlers. */
export const currentTrips = (): Trip[] => snapshot();

export const addTrip = (trip: Trip) => save([...snapshot(), trip]);

export const updateTrip = (id: string, change: (trip: Trip) => Trip) =>
  save(snapshot().map((t) => (t.id === id ? change(t) : t)));

/** Applies a change to every stored trip at once, such as after a site's details change. */
export const updateAllTrips = (change: (trip: Trip) => Trip) => save(snapshot().map(change));

export const deleteTrip = (id: string) => save(snapshot().filter((t) => t.id !== id));

export function newTripId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
