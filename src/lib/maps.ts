export type Platform = "ios" | "android" | "other";

/** Which maps app to hand coordinates to, from the browser's user agent. */
export function platformFrom(userAgent: string, maxTouchPoints = 0): Platform {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  // iPadOS reports itself as a Mac; touch support gives it away.
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return "ios";
  if (/Android/.test(userAgent)) return "android";
  return "other";
}

/**
 * A link that opens the phone's own maps app at the coordinates. It carries
 * only the coordinates, never the site's name: the maps provider is outside
 * the crew, and a confidential site's name must not reach it.
 */
export function mapsUrl(platform: Platform, lat: number, lng: number): string {
  const point = `${lat},${lng}`;
  if (platform === "ios") return `maps://?ll=${point}&q=${point}`;
  if (platform === "android") return `geo:${point}?q=${point}`;
  return `https://www.google.com/maps/search/?api=1&query=${point}`;
}
