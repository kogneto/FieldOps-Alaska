import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RadioTower, ShieldAlert } from "lucide-react";
import { AppShell, ModeIcon, SaveButton, SourceTag } from "@/components/fo";
import { operators, regions, sites, type Region } from "@/lib/data";
import { Button } from "@/components/ui/button";

type S = { region?: Region | undefined; tab?: "sites" | "operators" | undefined };

export const Route = createFileRoute("/directory")({
  validateSearch: (s: Record<string, unknown>): S => ({
    region: regions.includes(s["region"] as Region) ? (s["region"] as Region) : undefined,
    tab: s["tab"] === "operators" ? "operators" : "sites",
  }),
  head: () => ({
    meta: [
      { title: "Directory — FieldOps Alaska" },
      { name: "description", content: "Search Alaska telecom sites and air, sea and land operators by region." },
      { property: "og:title", content: "Directory — FieldOps Alaska" },
      { property: "og:description", content: "Sites and operators with source and last-verified dates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Directory,
});

function Directory() {
  const { region, tab = "sites" } = Route.useSearch();
  const nav = Route.useNavigate();
  const [q, setQ] = useState("");
  const match = (t: string) => t.toLowerCase().includes(q.toLowerCase());

  const siteList = sites.filter((s) => (!region || s.region === region) && (match(s.name) || match(s.community) || match(s.kind)));
  const opList = operators.filter((o) => (!region || o.region === region) && (match(o.name) || match(o.community) || o.services.some(match)));

  return (
    <AppShell title="Find">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Site, community, service…"
        className="h-16 w-full rounded-lg border-2 border-border bg-card px-5 text-lg text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
      />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {[undefined, ...regions].map((r) => (
          <Button
            variant={region === r ? "default" : "secondary"}
            size="sm"
            key={r ?? "all"}
            onClick={() => nav({ search: { region: r, tab } })}
            className="shrink-0"
          >
            {r ?? "All regions"}
          </Button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 rounded-md bg-card p-1">
        {(["sites", "operators"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "secondary" : "ghost"} onClick={() => nav({ search: { region, tab: t } })} className="min-h-14 rounded font-bold uppercase">
            {t} ({t === "sites" ? siteList.length : opList.length})
          </Button>
        ))}
      </div>

      <ul className="mt-4 grid gap-3">
        {tab === "sites"
          ? siteList.map((s) => (
              <li key={s.id}>
                <Link to="/sites/$id" params={{ id: s.id }} className="block rounded-lg border-2 border-border border-l-primary bg-card p-4 active:bg-secondary">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-lg font-bold text-card-foreground"><RadioTower className="h-6 w-6 shrink-0 text-primary" />{s.name}</div>
                      <div className="mt-1 text-base text-muted-foreground">{s.kind} · {s.community}</div>
                      {s.escort && <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-caution"><ShieldAlert className="h-5 w-5" />Escort required</div>}
                    </div>
                    <SaveButton id={s.id} />
                  </div>
                  <div className="mt-3"><SourceTag source={s.source} /></div>
                </Link>
              </li>
            ))
          : opList.map((o) => (
              <li key={o.id}>
                <Link to="/operators/$id" params={{ id: o.id }} className="block rounded-lg border-2 border-border border-l-accent bg-card p-4 active:bg-secondary">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-lg font-bold text-card-foreground"><ModeIcon mode={o.mode} className="h-6 w-6 shrink-0 text-accent" />{o.name}</div>
                      <div className="mt-1 text-base text-muted-foreground">{o.community} · {o.services.join(", ")}</div>
                    </div>
                    <SaveButton id={o.id} />
                  </div>
                  <div className="mt-3"><SourceTag source={o.source} /></div>
                </Link>
              </li>
            ))}
      </ul>
      {(tab === "sites" ? siteList : opList).length === 0 && <p className="mt-8 text-center text-muted-foreground">Nothing matches.</p>}
    </AppShell>
  );
}
