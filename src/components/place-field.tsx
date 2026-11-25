import { useState, type ReactNode } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { fieldLabel, inputClass } from "@/components/site-form";
import { platformFrom } from "@/lib/maps";
import {
  directionsUrl,
  formatCoords,
  MAX_PLACE_NAME,
  MAX_PLACE_WHERE,
  type Place,
} from "@/lib/places";

// Opens the phone's maps app at a "where" line. Only that line is sent,
// never a site's name. The href is the web fallback; on a phone the click
// handler swaps in the native maps link.
export function DirectionsLink({ where, label = "Directions" }: { where: string; label?: string }) {
  const web = directionsUrl("other", where);
  if (!web) return null;
  return (
    <a
      href={web}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        const platform = platformFrom(navigator.userAgent, navigator.maxTouchPoints);
        const url = directionsUrl(platform, where);
        if (platform === "other" || !url) return;
        e.preventDefault();
        window.location.href = url;
      }}
      className="flex min-h-16 items-center justify-center gap-3 rounded-lg border-2 border-accent px-4 text-lg font-bold uppercase text-accent active:bg-secondary"
    >
      <MapPin className="h-6 w-6" />
      {label}
    </a>
  );
}

/** "Address or coordinates" with a button to fill in where the phone is now. */
export function WhereInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (where: string) => void;
}) {
  const [status, setStatus] = useState("");
  function here() {
    if (!("geolocation" in navigator)) {
      setStatus("This phone can't tell where it is.");
      return;
    }
    setStatus("Finding where you are…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onChange(formatCoords(p.coords.latitude, p.coords.longitude));
        setStatus("");
      },
      () => setStatus("Couldn't find where you are. Try outside, or type it in."),
      { enableHighAccuracy: true, timeout: 30_000, maximumAge: 60_000 },
    );
  }
  return (
    <div className="grid gap-2">
      <label className="grid gap-1">
        <span className={fieldLabel}>{label}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={MAX_PLACE_WHERE}
          placeholder="Address, or coordinates like 60.79, -161.76"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <button
        type="button"
        onClick={here}
        className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border px-4 font-semibold active:bg-secondary"
      >
        <LocateFixed className="h-5 w-5" />
        Use where I am now
      </button>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}

// A place typed in for directions: a name, where it is, and a Directions button.
// Anything passed as children shows under the title, such as a way to fill it in.
export function PlaceField({
  title,
  namePlaceholder,
  place,
  onChange,
  children,
}: {
  title: string;
  namePlaceholder: string;
  place: Place | null;
  onChange: (place: Place) => void;
  children?: ReactNode;
}) {
  const name = place?.name ?? "";
  const where = place?.where ?? "";
  return (
    <div className="grid gap-2 rounded-lg border-2 border-border p-3">
      <div className="font-bold">{title}</div>
      {children}
      <label className="grid gap-1">
        <span className={fieldLabel}>Name</span>
        <input
          value={name}
          onChange={(e) => onChange({ name: e.target.value, where })}
          maxLength={MAX_PLACE_NAME}
          placeholder={namePlaceholder}
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <WhereInput
        label="Where it is"
        value={where}
        onChange={(w) => onChange({ name, where: w })}
      />
      <DirectionsLink where={where} />
    </div>
  );
}
