import { createFileRoute, Link } from "@tanstack/react-router";
import { RadioTower, WifiOff } from "lucide-react";
import { AppShell, ModeIcon, SaveButton } from "@/components/fo";
import { operators, sites } from "@/lib/data";
import { useSaved } from "@/lib/store";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved for offline — FieldOps Alaska" },
      { name: "description", content: "Sites and operators saved to your phone for no-signal use." },
      { property: "og:title", content: "Saved for offline — FieldOps Alaska" },
      { property: "og:description", content: "Your offline site and operator pack." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { saved } = useSaved();
  const s = sites.filter((x) => saved.includes(x.id));
  const o = operators.filter((x) => saved.includes(x.id));
  return (
    <AppShell title="Offline pack">
      <div className="flex gap-3 rounded-lg border-2 border-border bg-card p-4 text-base">
        <WifiOff className="h-6 w-6 shrink-0 text-accent" />
        <p>Star sites and operators to keep them on this phone. In the full app these work with no signal.</p>
      </div>
      {saved.length === 0 && <p className="mt-10 text-center text-muted-foreground">Nothing saved yet. <Link to="/directory" className="font-semibold text-primary">Browse the directory</Link></p>}
      {s.length > 0 && <h2 className="mt-6 mb-2 font-display text-lg uppercase text-muted-foreground">Sites</h2>}
      <div className="grid gap-2">
        {s.map((x) => (
          <Link key={x.id} to="/sites/$id" params={{ id: x.id }} className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 border-border bg-card p-3 active:bg-secondary">
            <span className="flex items-center gap-2 font-semibold"><RadioTower className="h-5 w-5 text-primary" />{x.name}</span>
            <SaveButton id={x.id} />
          </Link>
        ))}
      </div>
      {o.length > 0 && <h2 className="mt-6 mb-2 font-display text-lg uppercase text-muted-foreground">Operators</h2>}
      <div className="grid gap-2">
        {o.map((x) => (
          <Link key={x.id} to="/operators/$id" params={{ id: x.id }} className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 border-border bg-card p-3 active:bg-secondary">
            <span className="flex items-center gap-2 font-semibold"><ModeIcon mode={x.mode} className="h-5 w-5 text-accent" />{x.name}</span>
            <SaveButton id={x.id} />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
