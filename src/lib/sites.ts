// A technician's own sites. Every site is typed in on this phone and kept only
// here: no site is ever a record, and the app never sends one anywhere.
//
// A site has no free-text notes on purpose. FieldOps has no place to write
// down an access secret, and a notes box would be one.
import { getQualification, siteKinds, type Confidentiality, type SiteKind } from "./data";
import { typedPlace } from "./places";

export const MAX_SITE_NAME = 80;
export const MAX_COMMUNITY = 60;

export interface Site {
  id: string;
  name: string;
  /** The village or town it is in or nearest to. May be empty. */
  community: string;
  /** Null until the technician says what kind of site it is. */
  kind: SiteKind | null;
  /** Ids from `qualifications`: what a technician must hold to work there. */
  qualificationIds: string[];
  confidentiality: Confidentiality;
  /** Where it is: an address or coordinates, for directions. Empty until typed in. */
  where: string;
}

/** One line of typed text: trimmed, runs of whitespace collapsed, cut to a length. */
export const tidy = (text: string, max: number) => text.replace(/\s+/g, " ").trim().slice(0, max);

/**
 * A new site, or null when the name is empty. It starts Confidential, the
 * safer of the two until the technician knows what the client has said.
 */
export function createSite(options: { id: string; name: string; community?: string }): Site | null {
  const name = tidy(options.name, MAX_SITE_NAME);
  if (!name) return null;
  return {
    id: options.id,
    name,
    community: tidy(options.community ?? "", MAX_COMMUNITY),
    kind: null,
    qualificationIds: [],
    confidentiality: "confidential",
    where: "",
  };
}

/** New name and community. An empty name leaves the site as it was. */
export function renameSite(site: Site, name: string, community: string): Site {
  const tidied = tidy(name, MAX_SITE_NAME);
  if (!tidied) return site;
  return { ...site, name: tidied, community: tidy(community, MAX_COMMUNITY) };
}

export const setKind = (site: Site, kind: SiteKind | null): Site => ({ ...site, kind });

export const setConfidentiality = (site: Site, confidentiality: Confidentiality): Site => ({
  ...site,
  confidentiality,
});

export function toggleSiteQualification(site: Site, qualId: string): Site {
  if (!getQualification(qualId)) return site;
  return {
    ...site,
    qualificationIds: site.qualificationIds.includes(qualId)
      ? site.qualificationIds.filter((q) => q !== qualId)
      : [...site.qualificationIds, qualId],
  };
}

/** "Cell tower · Bethel", or whichever of the two is known. Empty when neither is. */
export const siteSummary = (site: Site) =>
  [site.kind, site.community].filter((part) => part).join(" · ");

/** Sites whose name, community or kind contains the query. */
export function filterSites(list: Site[], query: string): Site[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((s) =>
    [s.name, s.community, s.kind ?? ""].some((field) => field.toLowerCase().includes(q)),
  );
}

// ---- Storage ---------------------------------------------------------------

const isKind = (v: unknown): v is SiteKind => siteKinds.includes(v as SiteKind);

function readSite(v: unknown): Site | null {
  if (typeof v !== "object" || v === null) return null;
  const s = v as Record<string, unknown>;
  const id = s["id"];
  if (typeof id !== "string" || id.length === 0 || id.length > 64) return null;
  const name = typeof s["name"] === "string" ? tidy(s["name"], MAX_SITE_NAME) : "";
  if (!name) return null;
  const quals = Array.isArray(s["qualificationIds"]) ? s["qualificationIds"] : [];
  return {
    id,
    name,
    community: typeof s["community"] === "string" ? tidy(s["community"], MAX_COMMUNITY) : "",
    kind: isKind(s["kind"]) ? s["kind"] : null,
    qualificationIds: [
      ...new Set(quals.filter((q): q is string => typeof q === "string" && !!getQualification(q))),
    ],
    // Anything but a clear "open" reads as confidential.
    confidentiality: s["confidentiality"] === "open" ? "open" : "confidential",
    where: typeof s["where"] === "string" ? typedPlace("", s["where"]).where : "",
  };
}

/**
 * Reads stored sites, keeping every site it can understand, each id once, and
 * filling in anything missing, so old or damaged storage never breaks a page.
 */
export function readSites(raw: string | null): Site[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const sites: Site[] = [];
    for (const entry of parsed) {
      const site = readSite(entry);
      if (site && !sites.some((s) => s.id === site.id)) sites.push(site);
    }
    return sites;
  } catch {
    return [];
  }
}

/** Where the site is, as typed: an address or coordinates. */
export const setSiteWhere = (site: Site, where: string): Site => ({
  ...site,
  where: typedPlace("", where).where,
});
