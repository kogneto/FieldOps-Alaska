// Places a technician types in to get directions: where they meet the
// operator, their lodging, and where a site is. A place is a name and one
// line of "where": an address, or coordinates such as "60.79, -161.76".
//
// Directions hand only the "where" line to the phone's maps app, never a
// site's name, so a confidential site's name doesn't reach the maps provider.
import { mapsUrl, type Platform } from "./maps";

export const MAX_PLACE_NAME = 60;
export const MAX_PLACE_WHERE = 120;

export interface Place {
  /** What it is, such as "Bethel airport, freight counter" or "Kuskokwim Inn". */
  name: string;
  /** An address, or coordinates as "lat, lng". */
  where: string;
}

const line = (text: string, max: number) => text.replace(/\s+/g, " ").trimStart().slice(0, max);

/** A place as typed: single lines, capped. Kept while being typed, so trailing spaces stay. */
export const typedPlace = (name: string, where: string): Place => ({
  name: line(name, MAX_PLACE_NAME),
  where: line(where, MAX_PLACE_WHERE),
});

/** Null when nothing has been typed into either line. */
export function placeOrNull(place: Place): Place | null {
  return place.name.trim() || place.where.trim() ? place : null;
}

const COORDS = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

/** Coordinates in a "where" line, or null when it is an address or out of range. */
export function parseCoords(where: string): { lat: number; lng: number } | null {
  const m = COORDS.exec(where);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/** "60.79230, -161.75580" from a position, five decimal places (about a metre). */
export const formatCoords = (lat: number, lng: number) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

/**
 * A link that opens the phone's maps app at a "where" line: at the
 * coordinates, or searching for the address. Null when the line is empty.
 */
export function directionsUrl(platform: Platform, where: string): string | null {
  const text = where.trim();
  if (!text) return null;
  const coords = parseCoords(text);
  if (coords) return mapsUrl(platform, coords.lat, coords.lng);
  const q = encodeURIComponent(text);
  if (platform === "ios") return `maps://?q=${q}`;
  if (platform === "android") return `geo:0,0?q=${q}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** Reads a stored place, or null when there is nothing usable. */
export function readPlace(v: unknown): Place | null {
  if (typeof v !== "object" || v === null) return null;
  const p = v as Record<string, unknown>;
  const name = typeof p["name"] === "string" ? p["name"] : "";
  const where = typeof p["where"] === "string" ? p["where"] : "";
  return placeOrNull(typedPlace(name, where));
}
