import { describe, expect, it } from "vitest";
import {
  createSite,
  filterSites,
  MAX_SITE_NAME,
  readSites,
  renameSite,
  setConfidentiality,
  setKind,
  siteSummary,
  toggleSiteQualification,
  type Site,
} from "@/lib/sites";

const bethel = (): Site => createSite({ id: "s1", name: "Bethel job", community: "Bethel" })!;

describe("typing in a site", () => {
  it("starts confidential, with no kind and no qualifications", () => {
    expect(bethel()).toEqual({
      id: "s1",
      name: "Bethel job",
      community: "Bethel",
      kind: null,
      qualificationIds: [],
      confidentiality: "confidential",
      where: "",
    });
  });

  it("tidies what was typed and refuses an empty name", () => {
    const site = createSite({ id: "s2", name: "  Ridge   repeater \n", community: "  " });
    expect(site?.name).toBe("Ridge repeater");
    expect(site?.community).toBe("");
    expect(createSite({ id: "s3", name: "   " })).toBeNull();
    expect(createSite({ id: "s4", name: "x".repeat(200) })?.name).toHaveLength(MAX_SITE_NAME);
  });

  it("keeps the old name when a rename is empty", () => {
    expect(renameSite(bethel(), " ", "Napaskiak").name).toBe("Bethel job");
    expect(renameSite(bethel(), "Tower 2", "Napaskiak")).toMatchObject({
      name: "Tower 2",
      community: "Napaskiak",
    });
  });

  it("sets a kind, confidentiality and qualifications from the named list only", () => {
    let site = setKind(bethel(), "Cell tower");
    site = setConfidentiality(site, "open");
    site = toggleSiteQualification(site, "q-tower-climb");
    site = toggleSiteQualification(site, "q-made-up");
    expect(site).toMatchObject({
      kind: "Cell tower",
      confidentiality: "open",
      qualificationIds: ["q-tower-climb"],
    });
    expect(toggleSiteQualification(site, "q-tower-climb").qualificationIds).toEqual([]);
  });

  it("summarises a site by whatever is known", () => {
    expect(siteSummary(bethel())).toBe("Bethel");
    expect(siteSummary(setKind(bethel(), "Cell tower"))).toBe("Cell tower · Bethel");
    expect(siteSummary(createSite({ id: "s5", name: "Somewhere" })!)).toBe("");
  });

  it("finds sites by name, community or kind", () => {
    const list = [bethel(), setKind(createSite({ id: "s6", name: "Hill" })!, "Radio repeater")];
    expect(filterSites(list, "beth").map((s) => s.id)).toEqual(["s1"]);
    expect(filterSites(list, "RADIO").map((s) => s.id)).toEqual(["s6"]);
    expect(filterSites(list, "  ")).toHaveLength(2);
  });
});

describe("readSites", () => {
  it("round-trips sites through storage", () => {
    const site = toggleSiteQualification(setKind(bethel(), "Cell tower"), "q-first-aid");
    expect(readSites(JSON.stringify([site]))).toEqual([site]);
  });

  it("keeps what it understands, fills in what is missing and drops the rest", () => {
    const raw = JSON.stringify([
      { id: "a", name: "Only a name" },
      { id: "a", name: "Same id again" },
      { id: "b", name: "" },
      { name: "No id" },
      {
        id: "c",
        name: "Odd fields",
        kind: "Castle",
        confidentiality: "public",
        qualificationIds: ["q-medical", "q-medical", "q-made-up", 7],
      },
      "nonsense",
    ]);
    expect(readSites(raw)).toEqual([
      {
        id: "a",
        name: "Only a name",
        community: "",
        kind: null,
        qualificationIds: [],
        confidentiality: "confidential",
        where: "",
      },
      {
        id: "c",
        name: "Odd fields",
        community: "",
        kind: null,
        qualificationIds: ["q-medical"],
        confidentiality: "confidential",
        where: "",
      },
    ]);
  });

  it("survives empty or broken storage", () => {
    expect(readSites(null)).toEqual([]);
    expect(readSites("{not json")).toEqual([]);
    expect(readSites('{"a":1}')).toEqual([]);
  });
});
