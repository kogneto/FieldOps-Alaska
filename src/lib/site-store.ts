// A technician's own sites are kept in the browser's local storage on this
// phone only.
import { useSyncExternalStore } from "react";
import { readSites, type Site } from "./sites";

const KEY = "fo-sites";
const CHANGE_EVENT = "fo-sites";

let cachedRaw: string | null | undefined;
let cachedSites: Site[] = [];

// Re-parse only when the stored text changes, so the snapshot is stable.
function snapshot(): Site[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Storage blocked: behave as if there are no sites.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSites = readSites(raw);
  }
  return cachedSites;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Every site on this phone, or null until storage has been read (pages built ahead of time). */
export function useSites(): Site[] | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

/** The sites as stored right now, for use in event handlers. */
export const currentSites = (): Site[] => snapshot();

function save(sites: Site[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sites));
  } catch {
    // Storage full or blocked: nothing more can be done on this phone.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const addSite = (site: Site) => save([...snapshot(), site]);

export const updateSite = (id: string, change: (site: Site) => Site) =>
  save(snapshot().map((s) => (s.id === id ? change(s) : s)));

export const deleteSite = (id: string) => save(snapshot().filter((s) => s.id !== id));

export function newSiteId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
