import { useEffect, useState } from "react";
import { FileImage, Plus, Trash2, X } from "lucide-react";
import { fieldLabel } from "@/components/site-form";
import { addDoc, deleteDocs, useDocs, type TravelDoc } from "@/lib/doc-store";
import { DOC_KINDS, DOC_LABEL, isDocType, MAX_DOC_BYTES, type DocKind } from "@/lib/travel-docs";
import { newTripId } from "@/lib/trip-store";

// The travel documents kept with one travel step: images such as a boarding
// pass, kept only on this phone and deleted with the trip.
export function TravelDocs({ tripId, stepKey }: { tripId: string; stepKey: string }) {
  const { docs, error } = useDocs(tripId, stepKey);
  const [kind, setKind] = useState<DocKind>("boarding-pass");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<TravelDoc | null>(null);

  async function add(file: File | undefined) {
    if (!file) return;
    if (!isDocType(file.type)) {
      setStatus("Only photos and screenshots can be kept here.");
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setStatus("That file is too large to keep on this phone.");
      return;
    }
    setBusy(true);
    const ok = await addDoc({ id: newTripId(), tripId, stepKey, kind, added: Date.now() }, file);
    setBusy(false);
    setStatus(ok ? "Saved on this phone." : "Couldn't save it on this phone. Storage may be full.");
  }

  return (
    <div className="grid gap-3">
      <div className={fieldLabel}>Travel documents</div>
      {error && (
        <p className="text-sm font-semibold text-caution">
          This phone can't open its stored documents right now.
        </p>
      )}
      {docs && docs.length > 0 && (
        <ul className="grid grid-cols-2 gap-2">
          {docs.map((doc) => (
            <li key={doc.id}>
              <DocThumb doc={doc} onOpen={() => setViewing(doc)} />
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {DOC_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`min-h-14 rounded-lg border-2 px-3 font-semibold ${kind === k ? "border-primary bg-primary/10" : "border-border bg-card"}`}
          >
            {DOC_LABEL[k]}
          </button>
        ))}
      </div>
      {/* No `capture`, so the phone offers the photo library: boarding passes are mostly screenshots. */}
      <label
        className={`flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-accent px-4 text-lg font-bold uppercase text-accent active:bg-secondary ${busy ? "opacity-50" : ""}`}
      >
        <Plus className="h-5 w-5" />
        {busy ? "Saving…" : `Add a ${DOC_LABEL[kind].toLowerCase()}`}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            void add(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      <p role="status" aria-live="polite" className="min-h-5 text-sm font-semibold">
        {status}
      </p>
      <p className="text-xs text-muted-foreground">
        Kept only on this phone, never in a shared plan or feedback, and deleted with the trip.
      </p>
      {viewing && <DocViewer doc={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function useObjectUrl(blob: Blob): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

function DocThumb({ doc, onOpen }: { doc: TravelDoc; onOpen: () => void }) {
  const url = useObjectUrl(doc.blob);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col overflow-hidden rounded-lg border-2 border-border bg-card text-left active:bg-secondary"
    >
      <span className="flex h-28 items-center justify-center bg-background">
        {url ? (
          <img src={url} alt={DOC_LABEL[doc.kind]} className="h-full w-full object-cover" />
        ) : (
          <FileImage className="h-8 w-8 text-muted-foreground" />
        )}
      </span>
      <span className="flex min-h-12 items-center px-2 text-sm font-semibold">
        {DOC_LABEL[doc.kind]}
      </span>
    </button>
  );
}

// Full screen, so a barcode can be scanned at the gate.
function DocViewer({ doc, onClose }: { doc: TravelDoc; onClose: () => void }) {
  const url = useObjectUrl(doc.blob);
  const [confirm, setConfirm] = useState(false);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={DOC_LABEL[doc.kind]}
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      <div className="flex-1 overflow-auto bg-white">
        {url && (
          <img src={url} alt={DOC_LABEL[doc.kind]} className="h-full w-full object-contain" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 bg-background p-3">
        <button
          type="button"
          onClick={() => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            void deleteDocs([doc.id]);
            onClose();
          }}
          className={`flex min-h-16 items-center justify-center gap-2 rounded-lg border-2 px-3 font-bold uppercase ${confirm ? "border-destructive bg-destructive text-destructive-foreground" : "border-destructive text-destructive"}`}
        >
          <Trash2 className="h-5 w-5" />
          {confirm ? "Tap again to delete" : "Delete"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-16 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-lg font-bold uppercase text-primary-foreground"
        >
          <X className="h-6 w-6" />
          Close
        </button>
      </div>
    </div>
  );
}
