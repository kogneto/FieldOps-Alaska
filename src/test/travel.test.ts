import { describe, expect, it } from "vitest";
import {
  directionsUrl,
  formatCoords,
  MAX_PLACE_WHERE,
  parseCoords,
  placeOrNull,
  readPlace,
  typedPlace,
} from "@/lib/places";
import { createSite, readSites, setSiteWhere } from "@/lib/sites";
import { isDocKind, isDocType, orphanDocs, travelStepKeys } from "@/lib/travel-docs";
import {
  addStop,
  createTrip,
  readTrips,
  removeStop,
  setLodging,
  setMeet,
  setRoute,
  shareText,
  type Trip,
} from "@/lib/trips";

const sites = [
  createSite({ id: "a", name: "Bethel tower", community: "Bethel" })!,
  createSite({ id: "b", name: "Kasigluk", community: "Kasigluk" })!,
];
const trip = (): Trip =>
  addStop(createTrip({ id: "t", siteId: "a", start: "2026-11-24", days: 3, sites }), "b", sites);

describe("places", () => {
  it("are kept as typed, on one line each, and empty when nothing is typed", () => {
    expect(typedPlace("  Kuskokwim  Inn", "Bethel\n AK")).toEqual({
      name: "Kuskokwim Inn",
      where: "Bethel AK",
    });
    expect(typedPlace("", "x".repeat(500)).where).toHaveLength(MAX_PLACE_WHERE);
    expect(placeOrNull(typedPlace(" ", " "))).toBeNull();
    expect(readPlace({ name: 5, where: "60.79, -161.76" })).toEqual({
      name: "",
      where: "60.79, -161.76",
    });
    expect(readPlace(null)).toBeNull();
  });

  it("read coordinates, and treat anything else as an address", () => {
    expect(parseCoords("60.79, -161.76")).toEqual({ lat: 60.79, lng: -161.76 });
    expect(parseCoords("60.79 -161.76")).toEqual({ lat: 60.79, lng: -161.76 });
    expect(parseCoords("95, 10")).toBeNull();
    expect(parseCoords("1 Main St")).toBeNull();
    expect(formatCoords(60.792312, -161.755801)).toBe("60.79231, -161.75580");
  });

  it("open the maps app at coordinates, or searching for an address", () => {
    expect(directionsUrl("android", "60.79, -161.76")).toBe("geo:60.79,-161.76?q=60.79,-161.76");
    expect(directionsUrl("ios", "60.79, -161.76")).toBe("maps://?ll=60.79,-161.76&q=60.79,-161.76");
    expect(directionsUrl("android", "Bethel Airport")).toBe("geo:0,0?q=Bethel%20Airport");
    expect(directionsUrl("ios", "Bethel Airport")).toBe("maps://?q=Bethel%20Airport");
    expect(directionsUrl("other", "Bethel Airport")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Bethel%20Airport",
    );
    expect(directionsUrl("other", "  ")).toBeNull();
  });
});

describe("where a site is", () => {
  it("is empty until typed in, and read back from storage", () => {
    const site = setSiteWhere(sites[0]!, "60.79, -161.76");
    expect(sites[0]!.where).toBe("");
    expect(readSites(JSON.stringify([site]))[0]?.where).toBe("60.79, -161.76");
  });
});

describe("travel on a trip", () => {
  it("starts with no meeting places or lodging", () => {
    const t = trip();
    expect(t.stops.map((s) => [s.meet, s.lodging])).toEqual([
      [null, null],
      [null, null],
    ]);
    expect(t.homeMeet).toBeNull();
  });

  it("keeps where the operator is met and the lodging for each site, and for the trip home", () => {
    let t = setMeet(trip(), "a", typedPlace("Bethel airport", "Bethel Airport"));
    t = setLodging(t, "a", typedPlace("Kuskokwim Inn", ""));
    t = setMeet(t, null, typedPlace("Bethel airport", ""));
    t = setMeet(t, "b", typedPlace(" ", " "));
    expect(t.stops[0]).toMatchObject({
      meet: { name: "Bethel airport", where: "Bethel Airport" },
      lodging: { name: "Kuskokwim Inn", where: "" },
    });
    expect(t.stops[1]?.meet).toBeNull();
    expect(t.homeMeet).toEqual({ name: "Bethel airport", where: "" });
    expect(readTrips(JSON.stringify([t]))[0]).toEqual(t);
  });

  it("puts them in a shared plan", () => {
    let t = setRoute(trip(), "a", { by: "operator", operatorId: "op-grant-aviation" });
    t = setMeet(t, "a", typedPlace("Bethel airport", "Bethel Airport"));
    t = setLodging(t, "a", typedPlace("Kuskokwim Inn", ""));
    const text = shareText(t, sites);
    expect(text).toContain("Meeting the operator at: Bethel airport, Bethel Airport.");
    expect(text).toContain("Staying at: Kuskokwim Inn.");
  });
});

describe("travel documents", () => {
  it("belong to a trip's travel steps", () => {
    expect(travelStepKeys(trip())).toEqual(["travel:a", "travel:b", "travel-home"]);
  });

  it("are orphaned when their trip is deleted or their site taken off the trip", () => {
    const docs = [
      { id: "1", tripId: "t", stepKey: "travel:a" },
      { id: "2", tripId: "t", stepKey: "travel:b" },
      { id: "3", tripId: "t", stepKey: "travel-home" },
      { id: "4", tripId: "gone", stepKey: "travel-home" },
    ];
    expect(orphanDocs(docs, [trip()])).toEqual(["4"]);
    expect(orphanDocs(docs, [removeStop(trip(), "b")])).toEqual(["2", "4"]);
    expect(orphanDocs(docs, [])).toEqual(["1", "2", "3", "4"]);
  });

  it("are images of a fixed kind", () => {
    expect(isDocType("image/png")).toBe(true);
    expect(isDocType("application/pdf")).toBe(false);
    expect(isDocKind("boarding-pass")).toBe(true);
    expect(isDocKind("selfie")).toBe(false);
  });
});
