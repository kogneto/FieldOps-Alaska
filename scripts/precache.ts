import { createHash } from "node:crypto";

/**
 * The URL the service worker should cache a built file under, or null to leave
 * it out. Pages built ahead of time are cached under their route
 * (`sites/x.html` → `/sites/x`), since that is the URL a technician opens.
 */
export function urlForFile(relativePath: string): string | null {
  const path = relativePath.replaceAll("\\", "/");
  if (path === "_headers" || path === "sw.js" || path === "robots.txt") return null;
  // Every supported browser takes woff2, so the woff fallbacks would only double the download.
  if (path.endsWith(".woff")) return null;
  if (path.endsWith(".html")) {
    const route = path.slice(0, -".html".length).replace(/(^|\/)index$/, "");
    return `/${route}`;
  }
  return `/${path}`;
}

export interface BuiltFile {
  path: string;
  content: Uint8Array;
}

/** A version that changes whenever any cached file's name or content changes. */
export function precacheVersion(files: BuiltFile[]): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(file.path);
    hash.update("\0");
    hash.update(file.content);
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}

const CACHE_RULES: [path: string, header: string][] = [
  // Asset names carry a content hash, so they never change.
  ["/assets/*", "cache-control: public, max-age=31536000, immutable"],
  // Phones must always re-check the service worker to find a new version.
  ["/sw.js", "cache-control: no-cache"],
];

/** Adds Cloudflare `_headers` cache rules for assets and the service worker, once each. */
export function withCacheHeaders(existing: string): string {
  let headers = existing.length === 0 || existing.endsWith("\n") ? existing : `${existing}\n`;
  for (const [path, header] of CACHE_RULES) {
    if (!headers.split(/\r?\n/).includes(path)) headers += `${path}\n  ${header}\n`;
  }
  return headers;
}
