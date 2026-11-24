import { useState, type FormEvent } from "react";
import { AlertTriangle, Check as CheckIcon, ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { fieldLabel, inputClass } from "@/components/site-form";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import {
  addItem,
  addPiece,
  CHECK_LABEL,
  checkProgress,
  copyLoadout,
  coverage,
  dangerousAt,
  loadoutSummary,
  MAX_ITEM_NAME,
  MAX_WAYBILL,
  pieceName,
  removeItem,
  removePiece,
  setWaybill,
  shippedFrom,
  shipsAt,
  toggleTick,
  togglePieceTicks,
  updateItem,
  type Check,
  type Loadout,
  type LoadoutItem,
  type PieceKind,
} from "@/lib/loadout";
import type { Site } from "@/lib/sites";
import { currentTrips, newTripId, updateTrip, useTrips } from "@/lib/trip-store";
import { checklistDefinition, tripChecks, type Trip } from "@/lib/trips";

const newId = newTripId;

const changeLoadout = (tripId: string) => (fn: (l: Loadout) => Loadout) =>
  updateTrip(tripId, (t) => ({ ...t, loadout: fn(t.loadout) }));

// What the trip ships, built on pallets or in tubs: a summary and the builder.
export function LoadoutPanel({ trip }: { trip: Trip }) {
  const loadout = trip.loadout;
  const dangerous = loadout.items.filter((i) => i.dangerous).length;
  return (
    <div>
      <p className="text-base font-semibold">{loadoutSummary(loadout)}</p>
      {dangerous > 0 && (
        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-caution">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {dangerous} to declare as dangerous goods
        </p>
      )}
      <LoadoutBuilder trip={trip} change={changeLoadout(trip.id)} />
    </div>
  );
}

// ---- Building the loadout ------------------------------------------------------------

function LoadoutBuilder({
  trip,
  change,
}: {
  trip: Trip;
  change: (fn: (l: Loadout) => Loadout) => void;
}) {
  const loadout = trip.loadout;
  const empty = loadout.items.length === 0;
  const [open, setOpen] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const trips = useTrips();
  const hasLast = (trips ?? []).some((t) => t.id !== trip.id && t.loadout.items.length > 0);
  const partsKit = checklistDefinition("cl-parts");

  function copyFromLastTrip() {
    const last = currentTrips()
      .filter((t) => t.id !== trip.id && t.loadout.items.length > 0)
      .sort((a, b) => b.start.localeCompare(a.start))[0];
    if (last) change(() => copyLoadout(last.loadout, newId));
  }

  function startFromPartsKit() {
    if (!partsKit) return;
    change((l) => partsKit.items.reduce((acc, name) => addItem(acc, { id: newId(), name }), l));
  }

  const groups: (string | null)[] = [...loadout.pieces.map((p) => p.id), null];

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-14 w-full items-center justify-between gap-2 rounded-lg border-2 border-accent px-4 font-bold uppercase text-accent active:bg-secondary"
      >
        {open ? "Close the loadout" : empty ? "Build the loadout" : "Change the loadout"}
        <ChevronDown className={`h-5 w-5 shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 grid gap-4 rounded-lg border-2 border-border p-3">
          {empty && (hasLast || partsKit) && (
            <div className="grid gap-2">
              {hasLast && (
                <button
                  type="button"
                  onClick={copyFromLastTrip}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border bg-card px-4 font-semibold active:bg-secondary"
                >
                  <Copy className="h-5 w-5" />
                  Copy from your last trip
                </button>
              )}
              {partsKit && (
                <button
                  type="button"
                  onClick={startFromPartsKit}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border bg-card px-4 text-center font-semibold active:bg-secondary"
                >
                  <Plus className="h-5 w-5 shrink-0" />
                  Start from the {partsKit.title.toLowerCase()}
                </button>
              )}
            </div>
          )}

          <div>
            <div className={fieldLabel}>Pallets and tubs</div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["pallet", "tub"] as PieceKind[]).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => change((l) => addPiece(l, newId(), kind))}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border bg-card px-3 font-semibold active:bg-secondary"
                >
                  <Plus className="h-5 w-5" />
                  Add a {kind}
                </button>
              ))}
            </div>
          </div>

          {groups.map((pieceId) => {
            const items = loadout.items.filter((i) => i.pieceId === pieceId);
            if (pieceId === null && items.length === 0) return null;
            return (
              <div key={pieceId ?? "none"}>
                <div className="flex min-h-14 items-center justify-between gap-2">
                  <span className="font-bold">
                    {pieceName(loadout, pieceId)}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  {pieceId !== null && items.length === 0 && (
                    <button
                      type="button"
                      onClick={() => change((l) => removePiece(l, pieceId))}
                      className="flex min-h-14 items-center gap-1 rounded-lg border-2 border-border px-3 text-sm font-semibold text-muted-foreground active:bg-secondary"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
                <ul className="grid gap-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-expanded={editing === item.id}
                        onClick={() => setEditing(editing === item.id ? null : item.id)}
                        className="flex min-h-14 w-full items-center gap-2 rounded-lg border-2 border-border bg-card px-3 text-left font-semibold active:bg-secondary"
                      >
                        <ItemLabel item={item} />
                      </button>
                      {editing === item.id && (
                        <ItemEditor
                          item={item}
                          loadout={loadout}
                          change={change}
                          onDone={() => setEditing(null)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {(loadout.ticks["pre"] ?? []).length > 0 && (
            <p className="text-sm text-muted-foreground">
              The pre-loadout has started. Something added here goes on the pre-loadout, and on to
              later checklists only once it is ticked there. Picked it up at a site? Add it under
              "Picked something up?" on that site's checklist instead.
            </p>
          )}
          <AddItemForm loadout={loadout} change={change} />
        </div>
      )}
    </div>
  );
}

function ItemLabel({ item }: { item: LoadoutItem }) {
  return (
    <>
      <span className="min-w-0 flex-1 break-words">{item.name}</span>
      {item.qty > 1 && <span className="shrink-0 font-mono text-sm">× {item.qty}</span>}
      {item.dangerous && (
        <span className="flex shrink-0 items-center gap-1 rounded-sm bg-caution px-1.5 py-0.5 text-xs font-bold uppercase text-caution-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          DG
        </span>
      )}
    </>
  );
}

function PieceChoice({
  loadout,
  value,
  onChoose,
}: {
  loadout: Loadout;
  value: string | null;
  onChoose: (pieceId: string | null) => void;
}) {
  if (loadout.pieces.length === 0) return null;
  const options: (string | null)[] = [...loadout.pieces.map((p) => p.id), null];
  return (
    <div>
      <div className={fieldLabel}>On or in</div>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((id) => {
          const on = value === id;
          return (
            <button
              key={id ?? "none"}
              type="button"
              aria-pressed={on}
              onClick={() => onChoose(id)}
              className={`min-h-14 rounded-lg border-2 px-3 font-semibold ${on ? "border-primary bg-primary/10" : "border-border bg-card"}`}
            >
              {id === null ? "Neither" : pieceName(loadout, id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DangerousToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={`flex min-h-14 w-full items-center gap-3 rounded-lg border-2 px-3 text-left font-semibold ${on ? "border-caution bg-caution/10" : "border-border bg-card"}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 ${on ? "border-caution bg-caution text-caution-foreground" : "border-muted-foreground"}`}
      >
        {on && <CheckIcon className="h-4 w-4" strokeWidth={3} />}
      </span>
      Dangerous goods, such as fuel or bear spray
    </button>
  );
}

function ItemEditor({
  item,
  loadout,
  change,
  onDone,
}: {
  item: LoadoutItem;
  loadout: Loadout;
  change: (fn: (l: Loadout) => Loadout) => void;
  onDone: () => void;
}) {
  const update = (c: Parameters<typeof updateItem>[2]) => change((l) => updateItem(l, item.id, c));
  return (
    <div className="mt-2 grid gap-3 rounded-lg border-2 border-primary p-3">
      <Stepper
        label="Quantity"
        value={String(item.qty)}
        onMinus={() => update({ qty: item.qty - 1 })}
        onPlus={() => update({ qty: item.qty + 1 })}
        minusDisabled={item.qty <= 1}
      />
      <PieceChoice
        loadout={loadout}
        value={item.pieceId}
        onChoose={(pieceId) => update({ pieceId })}
      />
      <DangerousToggle
        on={item.dangerous}
        onToggle={() => update({ dangerous: !item.dangerous })}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            change((l) => removeItem(l, item.id));
            onDone();
          }}
          className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-destructive px-3 font-bold uppercase text-destructive"
        >
          <Trash2 className="h-5 w-5" />
          Remove
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex min-h-14 items-center justify-center rounded-lg border-2 border-border px-3 font-bold uppercase active:bg-secondary"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// Stays open after each item, keeping the pallet or tub, so a list goes in fast.
function AddItemForm({
  loadout,
  change,
}: {
  loadout: Loadout;
  change: (fn: (l: Loadout) => Loadout) => void;
}) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [pieceId, setPieceId] = useState<string | null>(null);
  const [dangerous, setDangerous] = useState(false);
  const piece = pieceId && loadout.pieces.some((p) => p.id === pieceId) ? pieceId : null;

  function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    change((l) => addItem(l, { id: newId(), name, qty, pieceId: piece, dangerous }));
    setName("");
    setQty(1);
    setDangerous(false);
  }

  return (
    <form onSubmit={add} className="grid gap-3 border-t-2 border-border pt-3">
      <label className="grid gap-1">
        <span className={fieldLabel}>Add a tool or part</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_ITEM_NAME}
          placeholder="e.g. Torque wrench"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <Stepper
        label="Quantity"
        value={String(qty)}
        onMinus={() => setQty(Math.max(1, qty - 1))}
        onPlus={() => setQty(qty + 1)}
        minusDisabled={qty <= 1}
      />
      <PieceChoice loadout={loadout} value={piece} onChoose={setPieceId} />
      <DangerousToggle on={dangerous} onToggle={() => setDangerous(!dangerous)} />
      <Button type="submit" size="lg" disabled={!name.trim()} className="w-full uppercase">
        <Plus className="h-5 w-5" />
        Add to the loadout
      </Button>
    </form>
  );
}

// ---- One check ---------------------------------------------------------------------------

const ALL_LABEL: Record<Check["kind"], string> = {
  "pre-loadout": "All packed",
  arrival: "All here",
  departure: "All packed",
  return: "All back",
};

// One loadout checklist, shown inside its step on the trip page.
export function ChecklistBody({ trip, checkKey }: { trip: Trip; checkKey: string }) {
  const loadout = trip.loadout;
  const checks = tripChecks(trip);
  const check = checks.find((c) => c.key === checkKey);
  const change = changeLoadout(trip.id);
  if (!check) return null;
  const { ids, fellThrough } = coverage(loadout, checks, check.key);
  const { done, total } = checkProgress(loadout, checks, check.key);
  const ticked = new Set(loadout.ticks[check.key] ?? []);
  const from = shippedFrom(checks, check.key);
  const incoming = from ? loadout.waybills[from.key] : undefined;
  const before = checks[checks.findIndex((c) => c.key === check.key) - 1];
  const dangerous = shipsAt(check) ? dangerousAt(loadout, checks, check.key) : [];
  const listed = new Set(ids);
  const groups = [...loadout.pieces.map((p) => p.id), null].filter((pieceId) =>
    loadout.items.some((i) => listed.has(i.id) && i.pieceId === pieceId),
  );

  return (
    <div>
      {
        <div className="grid gap-3">
          {incoming && (
            <p className="text-sm">
              Shipped with waybill{" "}
              <span className="font-mono font-semibold">{incoming.trim()}</span>
            </p>
          )}
          {fellThrough && before && (
            <p className="text-sm text-muted-foreground">
              Nothing was ticked at the {CHECK_LABEL[before.kind].toLowerCase()} before this, so it
              lists everything that checklist listed.
            </p>
          )}
          {dangerous.length > 0 && (
            <p className="flex gap-2 rounded-lg border-2 border-caution p-3 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-caution" />
              <span>
                Declare {dangerous.map((i) => i.name).join(", ")} as dangerous goods. Check with the
                operator what they accept and how it must be packed.
              </span>
            </p>
          )}

          {ids.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {check.kind === "pre-loadout"
                ? "Nothing to tick yet. Build the loadout above."
                : "Nothing to tick here yet."}
            </p>
          ) : (
            groups.map((pieceId) => {
              const items = loadout.items.filter((i) => listed.has(i.id) && i.pieceId === pieceId);
              return (
                <div key={pieceId ?? "none"}>
                  <div className="flex min-h-14 items-center justify-between gap-2">
                    <span className="font-bold">{pieceName(loadout, pieceId)}</span>
                    <button
                      type="button"
                      onClick={() => change((l) => togglePieceTicks(l, checks, check.key, pieceId))}
                      className="flex min-h-14 shrink-0 items-center rounded-lg border-2 border-border px-3 text-sm font-bold uppercase active:bg-secondary"
                    >
                      {items.every((i) => ticked.has(i.id)) ? "Untick all" : ALL_LABEL[check.kind]}
                    </button>
                  </div>
                  <ul className="grid gap-2">
                    {items.map((item) => {
                      const on = ticked.has(item.id);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            aria-pressed={on}
                            onClick={() => change((l) => toggleTick(l, check.key, item.id))}
                            className={`flex min-h-16 w-full items-center gap-3 rounded-lg border-2 px-3 text-left text-lg font-semibold ${on ? "border-border bg-secondary text-muted-foreground" : "border-border bg-background"}`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
                            >
                              {on && <CheckIcon className="h-6 w-6" />}
                            </span>
                            <ItemLabel item={item} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}

          {total > done && (
            <p className="text-sm text-muted-foreground">{total - done} not ticked yet.</p>
          )}

          {shipsAt(check) && (
            <label className="grid gap-1">
              <span className={fieldLabel}>Waybill number for this shipment</span>
              <input
                value={loadout.waybills[check.key] ?? ""}
                onChange={(e) => change((l) => setWaybill(l, check.key, e.target.value))}
                maxLength={MAX_WAYBILL}
                placeholder="e.g. 027 1234 5678"
                autoComplete="off"
                className={inputClass}
              />
            </label>
          )}

          {check.kind !== "pre-loadout" && <AddHere checkKey={check.key} change={change} />}
        </div>
      }
    </div>
  );
}

// Something picked up at a site, or added late: listed from this check on and
// ticked here, since it is in hand.
function AddHere({
  checkKey,
  change,
}: {
  checkKey: string;
  change: (fn: (l: Loadout) => Loadout) => void;
}) {
  const [name, setName] = useState("");
  function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    change((l) => addItem(l, { id: newId(), name }, checkKey));
    setName("");
  }
  return (
    <form onSubmit={add} className="grid gap-2">
      <label className="grid gap-1">
        <span className={fieldLabel}>Picked something up? Add it here</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_ITEM_NAME}
          placeholder="e.g. Spare fuse"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={!name.trim()}
        className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border px-4 font-bold uppercase active:bg-secondary disabled:opacity-40"
      >
        <Plus className="h-5 w-5" />
        Add
      </button>
    </form>
  );
}
