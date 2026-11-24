import { describe, expect, it } from "vitest";
import {
  addItem,
  addPiece,
  checkProgress,
  copyLoadout,
  coverage,
  dangerousAt,
  emptyLoadout,
  forgetChecks,
  loadoutChecks,
  loadoutSummary,
  MAX_ITEM_NAME,
  pieceName,
  readLoadout,
  removeItem,
  removePiece,
  setWaybill,
  shippedFrom,
  toggleTick,
  togglePieceTicks,
  updateItem,
  type Loadout,
} from "@/lib/loadout";

// Home base → Bethel → Kasigluk → home base.
const checks = loadoutChecks(["bethel", "kasigluk"]);
const keys = checks.map((c) => c.key);

function built(): Loadout {
  let l = addPiece(addPiece(emptyLoadout(), "p1", "pallet"), "t1", "tub");
  l = addItem(l, { id: "radio", name: "Spare radio module", pieceId: "t1" });
  l = addItem(l, { id: "jumpers", name: "Jumpers", qty: 12, pieceId: "t1" });
  l = addItem(l, { id: "fuel", name: "Generator fuel", pieceId: "p1", dangerous: true });
  l = addItem(l, { id: "ladder", name: "Ladder" });
  return l;
}

const tick = (l: Loadout, key: string, ...ids: string[]) =>
  ids.reduce((acc, id) => toggleTick(acc, key, id), l);

const listed = (l: Loadout, key: string) => coverage(l, checks, key).ids;

describe("the checks a trip runs", () => {
  it("are the pre-loadout, an arrival and a departure per site in order, then the return", () => {
    expect(keys).toEqual([
      "pre",
      "arrive:bethel",
      "depart:bethel",
      "arrive:kasigluk",
      "depart:kasigluk",
      "return",
    ]);
  });

  it("know which shipment arrives where", () => {
    expect(shippedFrom(checks, "arrive:bethel")?.key).toBe("pre");
    expect(shippedFrom(checks, "arrive:kasigluk")?.key).toBe("depart:bethel");
    expect(shippedFrom(checks, "return")?.key).toBe("depart:kasigluk");
    expect(shippedFrom(checks, "depart:bethel")).toBeUndefined();
  });
});

describe("what a check lists", () => {
  it("starts with the whole loadout at the pre-loadout", () => {
    expect(listed(built(), "pre")).toEqual(["radio", "jumpers", "fuel", "ladder"]);
  });

  it("carries forward only what was ticked at the check before", () => {
    let l = tick(built(), "pre", "radio", "jumpers", "fuel");
    expect(listed(l, "arrive:bethel")).toEqual(["radio", "jumpers", "fuel"]);
    l = tick(l, "arrive:bethel", "radio", "jumpers", "fuel");
    // The jumpers were used at Bethel, so they aren't packed to go on.
    l = tick(l, "depart:bethel", "radio", "fuel");
    expect(listed(l, "arrive:kasigluk")).toEqual(["radio", "fuel"]);
    l = tick(l, "arrive:kasigluk", "radio", "fuel");
    l = tick(l, "depart:kasigluk", "radio");
    expect(listed(l, "return")).toEqual(["radio"]);
  });

  it("shrinks later checks when an earlier tick is taken back", () => {
    let l = tick(built(), "pre", "radio", "jumpers");
    l = tick(l, "arrive:bethel", "radio", "jumpers");
    expect(checkProgress(l, checks, "arrive:bethel")).toEqual({ done: 2, total: 2 });
    l = toggleTick(l, "pre", "jumpers");
    // The stranded jumpers tick at Bethel no longer counts.
    expect(listed(l, "arrive:bethel")).toEqual(["radio"]);
    expect(checkProgress(l, checks, "arrive:bethel")).toEqual({ done: 1, total: 1 });
  });

  it("lists what the check before listed when nothing was ticked there, and says so", () => {
    const l = tick(built(), "pre", "radio", "fuel");
    const skipped = coverage(l, checks, "depart:bethel");
    expect(skipped).toEqual({ ids: ["radio", "fuel"], fellThrough: true });
    expect(coverage(l, checks, "arrive:bethel").fellThrough).toBe(false);
    expect(coverage(built(), checks, "pre").fellThrough).toBe(false);
  });

  it("lists an item added at a site from there on, ticked, so it rides home", () => {
    let l = tick(built(), "pre", "radio");
    l = addItem(l, { id: "spare", name: "Part bought in Bethel" }, "arrive:bethel");
    expect(listed(l, "pre")).not.toContain("spare");
    expect(listed(l, "arrive:bethel")).toEqual(["radio", "spare"]);
    expect(l.ticks["arrive:bethel"]).toEqual(["spare"]);
    l = tick(l, "depart:bethel", "spare");
    l = tick(l, "arrive:kasigluk", "spare");
    l = tick(l, "depart:kasigluk", "spare");
    expect(listed(l, "return")).toEqual(["spare"]);
  });

  it("follows the sites when they are reordered", () => {
    const reordered = loadoutChecks(["kasigluk", "bethel"]);
    let l = tick(built(), "pre", "radio");
    l = tick(l, "arrive:kasigluk", "radio");
    l = tick(l, "depart:kasigluk", "radio");
    expect(coverage(l, reordered, "arrive:bethel").ids).toEqual(["radio"]);
  });

  it("forgets a removed site's ticks but keeps the items added there", () => {
    let l = addItem(tick(built(), "pre", "radio"), { id: "spare", name: "Spare" }, "arrive:bethel");
    l = setWaybill(l, "depart:bethel", "027 1234 5678");
    const onlyKasigluk = loadoutChecks(["kasigluk"]);
    l = forgetChecks(l, onlyKasigluk);
    expect(Object.keys(l.ticks)).toEqual(["pre"]);
    expect(l.waybills).toEqual({});
    // With Bethel gone the spare counts as part of the loadout from the start.
    expect(coverage(l, onlyKasigluk, "pre").ids).toContain("spare");
  });

  it("counts the dangerous goods in a shipment", () => {
    const l = tick(built(), "pre", "radio");
    expect(dangerousAt(l, checks, "pre").map((i) => i.id)).toEqual(["fuel"]);
    expect(dangerousAt(l, checks, "depart:bethel")).toEqual([]);
  });
});

describe("ticking a whole pallet or tub", () => {
  it("ticks everything listed on it, or unticks it all when all are ticked", () => {
    let l = togglePieceTicks(built(), checks, "pre", "t1");
    expect(l.ticks["pre"]).toEqual(["radio", "jumpers"]);
    l = togglePieceTicks(l, checks, "pre", "t1");
    expect(l.ticks["pre"]).toEqual([]);
    l = togglePieceTicks(l, checks, "pre", null);
    expect(l.ticks["pre"]).toEqual(["ladder"]);
  });
});

describe("building the loadout", () => {
  it("names pallets and tubs by kind and order", () => {
    const l = addPiece(built(), "p2", "pallet");
    expect(pieceName(l, "p1")).toBe("Pallet 1");
    expect(pieceName(l, "t1")).toBe("Tub 1");
    expect(pieceName(l, "p2")).toBe("Pallet 2");
    expect(pieceName(l, null)).toBe("Not on a pallet or in a tub");
  });

  it("removes a pallet or tub only once it is empty", () => {
    expect(removePiece(built(), "t1").pieces).toHaveLength(2);
    const l = removeItem(removeItem(built(), "radio"), "jumpers");
    expect(removePiece(l, "t1").pieces.map((p) => p.id)).toEqual(["p1"]);
  });

  it("tidies names and quantities, and refuses an empty name", () => {
    let l = addItem(emptyLoadout(), { id: "a", name: "  Grounding   kit ", qty: 0 });
    l = addItem(l, { id: "b", name: "   " });
    l = addItem(l, { id: "c", name: "x".repeat(200), pieceId: "no-such-tub", qty: 5000 });
    expect(l.items.map((i) => [i.name.length, i.qty, i.pieceId])).toEqual([
      [13, 1, null],
      [MAX_ITEM_NAME, 999, null],
    ]);
    expect(l.items[0]?.name).toBe("Grounding kit");
  });

  it("changes an item, keeping its name when the new one is empty", () => {
    const l = updateItem(built(), "ladder", { name: " ", qty: 2, pieceId: "p1", dangerous: true });
    expect(l.items.find((i) => i.id === "ladder")).toMatchObject({
      name: "Ladder",
      qty: 2,
      pieceId: "p1",
      dangerous: true,
    });
  });

  it("removes an item from every check", () => {
    const l = removeItem(tick(built(), "pre", "radio", "fuel"), "radio");
    expect(l.ticks["pre"]).toEqual(["fuel"]);
    expect(l.items.map((i) => i.id)).not.toContain("radio");
  });

  it("keeps a waybill to letters, digits, spaces and hyphens", () => {
    let l = setWaybill(emptyLoadout(), "pre", " 027-1234 5678 (pallet!)");
    expect(l.waybills["pre"]).toBe("027-1234 5678 pallet");
    l = setWaybill(l, "pre", "  ");
    expect(l.waybills).toEqual({});
  });

  it("copies another trip's loadout with new ids and no ticks or waybills", () => {
    let n = 0;
    const source = setWaybill(
      addItem(tick(built(), "pre", "radio"), { id: "x", name: "Extra" }, "arrive:bethel"),
      "pre",
      "027",
    );
    const copy = copyLoadout(source, () => `new${++n}`);
    expect(copy.ticks).toEqual({});
    expect(copy.waybills).toEqual({});
    expect(copy.pieces.map((p) => p.kind)).toEqual(["pallet", "tub"]);
    expect(copy.items.map((i) => i.name)).toEqual([
      "Spare radio module",
      "Jumpers",
      "Generator fuel",
      "Ladder",
      "Extra",
    ]);
    expect(copy.items.every((i) => i.addedAt === null && !i.id.startsWith("radio"))).toBe(true);
    expect(copy.items[0]?.pieceId).toBe(copy.pieces[1]?.id);
  });

  it("summarises the loadout", () => {
    expect(loadoutSummary(emptyLoadout())).toBe("Nothing yet");
    expect(loadoutSummary(built())).toBe("4 items on 1 pallet and 1 tub");
    expect(loadoutSummary(addItem(emptyLoadout(), { id: "a", name: "Tape" }))).toBe("1 item");
  });
});

describe("readLoadout", () => {
  it("round-trips a loadout", () => {
    const l = setWaybill(tick(built(), "pre", "radio"), "pre", "027 1");
    expect(readLoadout(JSON.parse(JSON.stringify(l)))).toEqual(l);
  });

  it("reads a trip saved before loadouts as an empty loadout", () => {
    expect(readLoadout(undefined)).toEqual(emptyLoadout());
    expect(readLoadout("nonsense")).toEqual(emptyLoadout());
  });

  it("keeps what it understands and drops the rest", () => {
    const l = readLoadout({
      pieces: [
        { id: "p", kind: "pallet" },
        { id: "p", kind: "tub" },
        { id: "q", kind: "crate" },
      ],
      items: [
        { id: "a", name: "Tape", pieceId: "q", qty: "lots" },
        { id: "a", name: "Same id" },
        { id: "b", name: "" },
        { name: "No id" },
      ],
      ticks: { pre: ["a", "a", "gone", 3], "arrive:x": "nonsense" },
      waybills: { pre: "027<script>", x: 5 },
    });
    expect(l).toEqual({
      pieces: [{ id: "p", kind: "pallet" }],
      items: [{ id: "a", name: "Tape", qty: 1, pieceId: null, dangerous: false, addedAt: null }],
      ticks: { pre: ["a"] },
      waybills: { pre: "027script" },
    });
  });
});
