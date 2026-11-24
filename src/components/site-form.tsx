import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addSite, newSiteId } from "@/lib/site-store";
import { createSite, MAX_COMMUNITY, MAX_SITE_NAME, type Site } from "@/lib/sites";

export const inputClass =
  "h-16 w-full rounded-lg border-2 border-border bg-card px-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";

export const fieldLabel = "text-xs font-bold uppercase text-muted-foreground";

// Types in a new site and keeps it on this phone. It asks only for a name and
// a community; everything else is set on the site's own page.
export function NewSiteForm({
  onAdded,
  submitLabel = "Add site",
}: {
  onAdded: (site: Site) => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState("");
  const [community, setCommunity] = useState("");
  const ready = createSite({ id: "draft", name, community }) !== null;

  function add(e: FormEvent) {
    e.preventDefault();
    const site = createSite({ id: newSiteId(), name, community });
    if (!site) return;
    addSite(site);
    setName("");
    setCommunity("");
    onAdded(site);
  }

  return (
    <form onSubmit={add} className="grid gap-3">
      <label className="grid gap-1">
        <span className={fieldLabel}>Site name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_SITE_NAME}
          placeholder="e.g. Bethel cell tower"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <label className="grid gap-1">
        <span className={fieldLabel}>Village or town (optional)</span>
        <input
          value={community}
          onChange={(e) => setCommunity(e.target.value)}
          maxLength={MAX_COMMUNITY}
          placeholder="e.g. Bethel"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <Button type="submit" size="lg" disabled={!ready} className="w-full uppercase">
        <Plus className="h-5 w-5" />
        {submitLabel}
      </Button>
      <p className="text-sm text-muted-foreground">
        Kept only on this phone. Don't type gate codes, keys or lock combinations here.
      </p>
    </form>
  );
}
