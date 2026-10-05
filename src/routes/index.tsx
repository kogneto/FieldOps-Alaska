import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Search, MapPin, ListChecks } from "lucide-react";
import { AppShell, Disclaimer } from "@/components/fo";
import { officialLinks, operators, regions, sites } from "@/lib/data";
import { useSaved } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FieldOps Alaska — Field companion for telecom techs" },
      { name: "description", content: "Find Alaska telecom sites, operators, access notes and prep checklists — offline-ready." },
      { property: "og:title", content: "FieldOps Alaska" },
      { property: "og:description", content: "Reach the site, get in, get the job done, get out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { saved } = useSaved();
  return (
    <AppShell title="FieldOps Alaska">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase text-muted-foreground">Remote field companion</p>
        <p className="font-display text-4xl uppercase leading-tight text-primary">Alaska</p>
      </div>

      <Link to="/directory" className="flex min-h-20 items-center gap-4 rounded-lg border-b-4 border-accent bg-foreground px-5 text-lg font-bold text-background active:translate-y-0.5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-background text-primary"><Search className="h-7 w-7" strokeWidth={2.5} /></span>
        <span>Search sites & operators</span>
      </Link>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat n={sites.length} label="Sites" />
        <Stat n={operators.length} label="Operators" />
        <Stat n={saved.length} label="Offline" />
      </div>

      <h2 className="mt-8 font-display text-lg uppercase text-foreground">Pilot regions</h2>
      <div className="mt-2 grid gap-2">
        {regions.map((r) => (
          <Link key={r} to="/directory" search={{ region: r }} className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 border-border bg-card px-4 font-bold text-card-foreground active:bg-secondary">
            <span className="flex min-w-0 items-center gap-3"><MapPin className="h-6 w-6 shrink-0 text-primary" strokeWidth={2.5} />{r}</span>
            <span className="shrink-0 font-mono text-sm text-accent">{sites.filter((s) => s.region === r).length} sites</span>
          </Link>
        ))}
      </div>

      <Link to="/checklists" className="mt-4 flex min-h-16 items-center gap-3 rounded-lg bg-primary px-5 text-lg font-bold uppercase text-primary-foreground active:translate-y-0.5">
        <ListChecks className="h-7 w-7" strokeWidth={2.5} /> Run prep checklists
      </Link>

      <h2 className="mt-8 font-display text-lg uppercase text-foreground">Official conditions</h2>
      <p className="text-sm text-muted-foreground">Live status isn't in the app yet — check these official sources.</p>
      <div className="mt-2 grid gap-2">
        {officialLinks.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="flex min-h-16 items-center justify-between gap-3 rounded-lg border-2 border-border px-4 text-base font-semibold active:bg-secondary">
            {l.label} <ExternalLink className="h-5 w-5 shrink-0 text-accent" />
          </a>
        ))}
      </div>
      <Disclaimer />
    </AppShell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-lg border-2 border-border bg-card p-3 text-center">
      <div className="font-display text-3xl text-foreground">{n}</div>
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
