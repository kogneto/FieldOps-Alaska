// Travel documents are kept in this phone's IndexedDB, never in the trip's
// local storage, which is too small for photos. Each file is kept exactly as
// picked, unscaled, so a boarding pass barcode still scans.
import { useEffect, useState } from "react";
import { orphanDocs, type TravelDocMeta } from "./travel-docs";
import type { Trip } from "./trips";

const DB_NAME = "fieldops-docs";
const DB_VERSION = 1;
const STORE = "docs";
const CHANGE_EVENT = "fo-docs";

export interface TravelDoc extends TravelDocMeta {
  type: string;
  blob: Blob;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser can't store files."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" }).createIndex("tripId", "tripId");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Couldn't open storage."));
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  use: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = use(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(request ? request.result : undefined);
    };
    const fail = () => {
      db.close();
      reject(tx.error ?? new Error("Storage failed."));
    };
    tx.onerror = fail;
    tx.onabort = fail;
  });
}

const changed = () => window.dispatchEvent(new Event(CHANGE_EVENT));

/**
 * Saves a document and reads it back. True only when it reads back whole, so
 * the screen never says a document is saved when it isn't.
 */
export async function addDoc(meta: TravelDocMeta, file: Blob): Promise<boolean> {
  try {
    // Ask the browser not to clear the app's storage when the phone runs low.
    void navigator.storage?.persist?.().catch(() => false);
    await run("readwrite", (store) => store.put({ ...meta, type: file.type, blob: file }));
    const back = (await run("readonly", (store) => store.get(meta.id))) as TravelDoc | undefined;
    const ok = !!back && back.blob instanceof Blob && back.blob.size === file.size;
    changed();
    return ok;
  } catch {
    return false;
  }
}

export async function listDocs(tripId: string): Promise<TravelDoc[]> {
  const docs = (await run("readonly", (store) => store.index("tripId").getAll(tripId))) as
    TravelDoc[] | undefined;
  return (docs ?? []).sort((a, b) => a.added - b.added);
}

export async function deleteDocs(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    await run("readwrite", (store) => {
      for (const id of ids) store.delete(id);
    });
  } finally {
    changed();
  }
}

export async function deleteDocsForTrip(tripId: string): Promise<void> {
  try {
    const docs = await listDocs(tripId);
    await deleteDocs(docs.map((d) => d.id));
  } catch {
    // Nothing stored, or storage unavailable: the sweep on the Trips screen tries again.
  }
}

/** Deletes every document whose trip or travel step no longer exists. */
export async function sweepOrphanDocs(trips: Pick<Trip, "id" | "stops">[]): Promise<void> {
  try {
    const all = ((await run("readonly", (store) => store.getAll())) ?? []) as TravelDoc[];
    await deleteDocs(orphanDocs(all, trips));
  } catch {
    // Storage unavailable: nothing to sweep.
  }
}

/** The documents for one travel step of a trip, or null while loading. */
export function useDocs(
  tripId: string,
  stepKey: string,
): { docs: TravelDoc[] | null; error: boolean } {
  const [state, setState] = useState<{ docs: TravelDoc[] | null; error: boolean }>({
    docs: null,
    error: false,
  });
  useEffect(() => {
    let live = true;
    const load = () =>
      listDocs(tripId)
        .then(
          (docs) =>
            live && setState({ docs: docs.filter((d) => d.stepKey === stepKey), error: false }),
        )
        .catch(() => live && setState({ docs: [], error: true }));
    void load();
    window.addEventListener(CHANGE_EVENT, load);
    return () => {
      live = false;
      window.removeEventListener(CHANGE_EVENT, load);
    };
  }, [tripId, stepKey]);
  return state;
}
