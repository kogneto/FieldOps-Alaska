// A trip's loadout: the tools and parts it needs at its sites, built on
// pallets or in tubs, and the four checks that run over it. The pre-loadout
// runs at home base while the loadout is built; each site has an arrival
// checklist and a departure pre-loadout; the return checklist runs back at
// home base.
//
// Only ticks are stored, per check. What a check lists is worked out each
// time: it covers what was ticked at the check before it, plus anything added
// at the check itself. So the return checklist covers whatever was packed at
// the last departure, and a part picked up at a site still rides home.
//
// Everything here is pure and works on plain values.

export const MAX_ITEM_NAME = 60;
export const MAX_QTY = 999;
export const MAX_WAYBILL = 24;
export const MAX_ITEMS = 300;
export const MAX_PIECES = 30;

export type PieceKind = "pallet" | "tub";

/** A pallet or tub the loadout is built on or in. */
export interface Piece {
  id: string;
  kind: PieceKind;
}

export interface LoadoutItem {
  id: string;
  name: string;
  qty: number;
  /** The pallet or tub it is packed on or in. Null until it is. */
  pieceId: string | null;
  /** Must be declared as dangerous goods when shipped, such as fuel or bear spray. */
  dangerous: boolean;
  /** The check it was added at, or null when it was part of the loadout from the start. */
  addedAt: string | null;
}

export interface Loadout {
  pieces: Piece[];
  items: LoadoutItem[];
  /** Ticked item ids, by check key. */
  ticks: Record<string, string[]>;
  /** The waybill number of each shipment, by the key of the check it shipped at. */
  waybills: Record<string, string>;
}

export type CheckKind = "pre-loadout" | "arrival" | "departure" | "return";

export interface Check {
  key: string;
  kind: CheckKind;
  /** The site it runs at, or null at home base. */
  siteId: string | null;
}

export const CHECK_LABEL: Record<CheckKind, string> = {
  "pre-loadout": "Pre-loadout",
  arrival: "Arrival checklist",
  departure: "Departure pre-loadout",
  return: "Return checklist",
};

export const emptyLoadout = (): Loadout => ({ pieces: [], items: [], ticks: {}, waybills: {} });

/** The checks a trip runs, in order, from its sites in the order they are worked. */
export function loadoutChecks(siteIds: string[]): Check[] {
  return [
    { key: "pre", kind: "pre-loadout", siteId: null },
    ...siteIds.flatMap((siteId): Check[] => [
      { key: `arrive:${siteId}`, kind: "arrival", siteId },
      { key: `depart:${siteId}`, kind: "departure", siteId },
    ]),
    { key: "return", kind: "return", siteId: null },
  ];
}

/** Whether the loadout is shipped at this check: the pre-loadout and each departure. */
export const shipsAt = (check: Check) => check.kind === "pre-loadout" || check.kind === "departure";

/** The check whose shipment arrives at this one, if it is an arrival or the return. */
export function shippedFrom(checks: Check[], key: string): Check | undefined {
  const index = checks.findIndex((c) => c.key === key);
  const check = checks[index];
  if (!check || check.kind === "pre-loadout" || check.kind === "departure") return undefined;
  return checks[index - 1];
}

// ---- What a check lists --------------------------------------------------------

/** The check an item counts as added at: its own, or the pre-loadout if that check is gone. */
function addedAt(item: LoadoutItem, keys: Set<string>): string {
  return item.addedAt !== null && keys.has(item.addedAt) ? item.addedAt : "pre";
}

export interface Coverage {
  /** The items the check lists, in loadout order. */
  ids: string[];
  /**
   * True when nothing was ticked at the check before, so this one lists what
   * that check listed instead.
   */
  fellThrough: boolean;
}

/**
 * What a check lists: what was ticked at the check before it, plus anything
 * added at this check. When nothing was ticked at the check before, it lists
 * what that check listed, so a skipped check doesn't empty the ones after it.
 */
export function coverage(loadout: Loadout, checks: Check[], key: string): Coverage {
  const index = checks.findIndex((c) => c.key === key);
  if (index < 0) return { ids: [], fellThrough: false };
  const keys = new Set(checks.map((c) => c.key));
  const inOrder = (set: Set<string>) =>
    loadout.items.filter((item) => set.has(item.id)).map((item) => item.id);
  const addedHere = (k: string) =>
    loadout.items.filter((item) => addedAt(item, keys) === k).map((item) => item.id);

  let ids = new Set(addedHere(checks[0]!.key));
  let fellThrough = false;
  for (let i = 1; i <= index; i++) {
    const before = checks[i - 1]!;
    const ticked = (loadout.ticks[before.key] ?? []).filter((id) => ids.has(id));
    fellThrough = ticked.length === 0 && ids.size > 0;
    const carried = fellThrough ? ids : new Set(ticked);
    ids = new Set([...carried, ...addedHere(checks[i]!.key)]);
  }
  return { ids: inOrder(ids), fellThrough };
}

/** Ticked and total items at a check. Ticks on items the check doesn't list don't count. */
export function checkProgress(
  loadout: Loadout,
  checks: Check[],
  key: string,
): { done: number; total: number } {
  const { ids } = coverage(loadout, checks, key);
  const ticked = new Set(loadout.ticks[key] ?? []);
  return { done: ids.filter((id) => ticked.has(id)).length, total: ids.length };
}

/** The dangerous-goods items in a shipment. */
export function dangerousAt(loadout: Loadout, checks: Check[], key: string): LoadoutItem[] {
  const ids = new Set(coverage(loadout, checks, key).ids);
  return loadout.items.filter((item) => ids.has(item.id) && item.dangerous);
}

// ---- Ticking -----------------------------------------------------------------------

export function toggleTick(loadout: Loadout, key: string, itemId: string): Loadout {
  const ticked = loadout.ticks[key] ?? [];
  return {
    ...loadout,
    ticks: {
      ...loadout.ticks,
      [key]: ticked.includes(itemId) ? ticked.filter((id) => id !== itemId) : [...ticked, itemId],
    },
  };
}

/**
 * Ticks every item a check lists on one pallet or tub (or not on one, for
 * null), or unticks them all if they are all ticked already.
 */
export function togglePieceTicks(
  loadout: Loadout,
  checks: Check[],
  key: string,
  pieceId: string | null,
): Loadout {
  const listed = new Set(coverage(loadout, checks, key).ids);
  const ids = loadout.items
    .filter((item) => listed.has(item.id) && item.pieceId === pieceId)
    .map((item) => item.id);
  const ticked = new Set(loadout.ticks[key] ?? []);
  const allTicked = ids.every((id) => ticked.has(id));
  for (const id of ids) {
    if (allTicked) ticked.delete(id);
    else ticked.add(id);
  }
  return { ...loadout, ticks: { ...loadout.ticks, [key]: [...ticked] } };
}

/** Drops the ticks and waybills of checks the trip no longer has, such as a removed site's. */
export function forgetChecks(loadout: Loadout, checks: Check[]): Loadout {
  const keys = new Set(checks.map((c) => c.key));
  const keep = <T>(record: Record<string, T>) =>
    Object.fromEntries(Object.entries(record).filter(([k]) => keys.has(k)));
  return { ...loadout, ticks: keep(loadout.ticks), waybills: keep(loadout.waybills) };
}

// ---- Building the loadout --------------------------------------------------------------

/** An item name as typed: one line, trimmed, cut to length. */
export const tidyName = (name: string) => name.replace(/\s+/g, " ").trim().slice(0, MAX_ITEM_NAME);

const clampQty = (qty: number) =>
  Number.isFinite(qty) ? Math.min(MAX_QTY, Math.max(1, Math.round(qty))) : 1;

export function addPiece(loadout: Loadout, id: string, kind: PieceKind): Loadout {
  if (loadout.pieces.length >= MAX_PIECES) return loadout;
  return { ...loadout, pieces: [...loadout.pieces, { id, kind }] };
}

/** Removes a pallet or tub, but only once nothing is packed on or in it. */
export function removePiece(loadout: Loadout, pieceId: string): Loadout {
  if (loadout.items.some((item) => item.pieceId === pieceId)) return loadout;
  return { ...loadout, pieces: loadout.pieces.filter((p) => p.id !== pieceId) };
}

/** "Pallet 1", "Tub 2": numbered within its kind, in the order added. */
export function pieceName(loadout: Loadout, pieceId: string | null): string {
  if (pieceId === null) return "Not on a pallet or in a tub";
  const piece = loadout.pieces.find((p) => p.id === pieceId);
  if (!piece) return "Not on a pallet or in a tub";
  const n = loadout.pieces.filter((p) => p.kind === piece.kind).indexOf(piece) + 1;
  return `${piece.kind === "pallet" ? "Pallet" : "Tub"} ${n}`;
}

/**
 * Adds an item. Added while building the loadout (`at` null), it is part of
 * the loadout from the pre-loadout on. Added at a check, it is listed from
 * that check on and starts ticked there, since it is in hand.
 */
export function addItem(
  loadout: Loadout,
  item: { id: string; name: string; qty?: number; pieceId?: string | null; dangerous?: boolean },
  at: string | null = null,
): Loadout {
  const name = tidyName(item.name);
  if (!name || loadout.items.length >= MAX_ITEMS) return loadout;
  const pieceId =
    item.pieceId && loadout.pieces.some((p) => p.id === item.pieceId) ? item.pieceId : null;
  const added: LoadoutItem = {
    id: item.id,
    name,
    qty: clampQty(item.qty ?? 1),
    pieceId,
    dangerous: item.dangerous ?? false,
    addedAt: at === "pre" ? null : at,
  };
  const next = { ...loadout, items: [...loadout.items, added] };
  return at === null ? next : toggleTick(next, at, item.id);
}

export function updateItem(
  loadout: Loadout,
  itemId: string,
  change: Partial<Pick<LoadoutItem, "name" | "qty" | "pieceId" | "dangerous">>,
): Loadout {
  return {
    ...loadout,
    items: loadout.items.map((item) => {
      if (item.id !== itemId) return item;
      const name = change.name === undefined ? item.name : tidyName(change.name) || item.name;
      const pieceId =
        change.pieceId === undefined
          ? item.pieceId
          : change.pieceId !== null && loadout.pieces.some((p) => p.id === change.pieceId)
            ? change.pieceId
            : null;
      return {
        ...item,
        name,
        qty: change.qty === undefined ? item.qty : clampQty(change.qty),
        pieceId,
        dangerous: change.dangerous ?? item.dangerous,
      };
    }),
  };
}

export function removeItem(loadout: Loadout, itemId: string): Loadout {
  return {
    ...loadout,
    items: loadout.items.filter((item) => item.id !== itemId),
    ticks: Object.fromEntries(
      Object.entries(loadout.ticks).map(([k, ids]) => [k, ids.filter((id) => id !== itemId)]),
    ),
  };
}

/** A waybill number as typed: letters, digits, spaces and hyphens only. Empty removes it. */
export function setWaybill(loadout: Loadout, key: string, text: string): Loadout {
  const waybill = text
    .replace(/[^A-Za-z0-9 -]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^ /, "")
    .slice(0, MAX_WAYBILL);
  const waybills = { ...loadout.waybills };
  if (waybill.trim()) waybills[key] = waybill;
  else delete waybills[key];
  return { ...loadout, waybills };
}

/**
 * A fresh copy of another trip's pallets, tubs and items, with new ids and no
 * ticks or waybills, to start a trip's loadout from the last one.
 */
export function copyLoadout(from: Loadout, newId: () => string): Loadout {
  const pieceIds = new Map(from.pieces.map((p) => [p.id, newId()]));
  return {
    pieces: from.pieces.map((p) => ({ id: pieceIds.get(p.id)!, kind: p.kind })),
    items: from.items.map((item) => ({
      ...item,
      id: newId(),
      pieceId: item.pieceId === null ? null : (pieceIds.get(item.pieceId) ?? null),
      addedAt: null,
    })),
    ticks: {},
    waybills: {},
  };
}

/** "14 items on 2 pallets and 1 tub", "3 items", or "Nothing yet". */
export function loadoutSummary(loadout: Loadout): string {
  const n = loadout.items.length;
  if (n === 0) return "Nothing yet";
  const count = (k: PieceKind) => loadout.pieces.filter((p) => p.kind === k).length;
  const plural = (x: number, word: string) => `${x} ${word}${x === 1 ? "" : "s"}`;
  const parts = [
    count("pallet") ? plural(count("pallet"), "pallet") : "",
    count("tub") ? plural(count("tub"), "tub") : "",
  ].filter(Boolean);
  const items = plural(n, "item");
  return parts.length ? `${items} on ${parts.join(" and ")}` : items;
}

// ---- Storage -------------------------------------------------------------------------------

const isString = (v: unknown): v is string => typeof v === "string";

/** Reads a stored loadout, keeping what it understands. Anything missing reads as empty. */
export function readLoadout(v: unknown): Loadout {
  if (typeof v !== "object" || v === null) return emptyLoadout();
  const l = v as Record<string, unknown>;
  const pieces: Piece[] = [];
  for (const p of Array.isArray(l["pieces"]) ? l["pieces"] : []) {
    if (typeof p !== "object" || p === null) continue;
    const { id, kind } = p as Record<string, unknown>;
    if (!isString(id) || pieces.some((x) => x.id === id)) continue;
    if (kind !== "pallet" && kind !== "tub") continue;
    pieces.push({ id, kind });
  }
  const items: LoadoutItem[] = [];
  for (const i of Array.isArray(l["items"]) ? l["items"] : []) {
    if (typeof i !== "object" || i === null) continue;
    const r = i as Record<string, unknown>;
    const name = isString(r["name"]) ? tidyName(r["name"]) : "";
    if (!isString(r["id"]) || !name || items.some((x) => x.id === r["id"])) continue;
    const pieceId = r["pieceId"];
    items.push({
      id: r["id"],
      name,
      qty: clampQty(typeof r["qty"] === "number" ? r["qty"] : 1),
      pieceId: isString(pieceId) && pieces.some((p) => p.id === pieceId) ? pieceId : null,
      dangerous: r["dangerous"] === true,
      addedAt: isString(r["addedAt"]) ? r["addedAt"] : null,
    });
  }
  const ids = new Set(items.map((i) => i.id));
  const ticks: Record<string, string[]> = {};
  const rawTicks = l["ticks"];
  if (typeof rawTicks === "object" && rawTicks !== null) {
    for (const [k, list] of Object.entries(rawTicks)) {
      if (Array.isArray(list))
        ticks[k] = [...new Set(list.filter(isString))].filter((id) => ids.has(id));
    }
  }
  let waybills = emptyLoadout().waybills;
  const rawWaybills = l["waybills"];
  if (typeof rawWaybills === "object" && rawWaybills !== null) {
    let tidied = { ...emptyLoadout(), waybills };
    for (const [k, w] of Object.entries(rawWaybills)) {
      if (isString(w)) tidied = setWaybill(tidied, k, w);
    }
    waybills = tidied.waybills;
  }
  return { pieces, items, ticks, waybills };
}
