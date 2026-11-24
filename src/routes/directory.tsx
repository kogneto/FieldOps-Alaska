import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, ModeIcon, SaveButton, SourceTag } from "@/components/fo";
import { filterOperators, operators, regions, type Region } from "@/lib/data";
import { useHydrated } from "@/lib/offline";
import { Button } from "@/components/ui/button";

type S = { region?: Region | undefined };

export const Route = createFileRoute("/directory")({
  validateSearch: (s: Record<string, unknown>): S => ({
    region: regions.includes(s["region"] as Region) ? (s["region"] as Region) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Operators — FieldOps Alaska" },
      {
        name: "description",
        content: "Search Alaska air, sea and land operators by region.",
      },
      { property: "og:title", content: "Operators — FieldOps Alaska" },
      {
        property: "og:description",
        content: "Operators with source and last-verified dates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Directory,
});

function Directory() {
  const search = Route.useSearch();
  // The page is built ahead of time with no filter, so the URL's region
  // applies only once React has attached to it.
  const hydrated = useHydrated();
  const region = hydrated ? search.region : undefined;
  const nav = Route.useNavigate();
  const [q, setQ] = useState("");

  const list = filterOperators(operators, region, q);

  return (
    <AppShell title="Operators" sample>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Operator, community, service…"
        aria-label="Search operators"
        className="h-16 w-full rounded-lg border-2 border-border bg-card px-5 text-lg text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
      />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {[undefined, ...regions].map((r) => (
          <Button
            variant={region === r ? "default" : "secondary"}
            size="sm"
            key={r ?? "all"}
            onClick={() => nav({ search: { region: r } })}
            className="min-h-14 shrink-0"
          >
            {r ?? "All regions"}
          </Button>
        ))}
      </div>

      <ul className="mt-4 grid gap-3">
        {list.map((o) => (
          <li key={o.id}>
            <Link
              to="/operators/$id"
              params={{ id: o.id }}
              className="block rounded-lg border-2 border-border border-l-accent bg-card p-4 active:bg-secondary"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-lg font-bold text-card-foreground">
                    <ModeIcon mode={o.mode} className="h-6 w-6 shrink-0 text-accent" />
                    {o.name}
                  </div>
                  <div className="mt-1 text-base text-muted-foreground">
                    {o.community} · {o.services.join(", ")}
                  </div>
                </div>
                <SaveButton id={o.id} />
              </div>
              <div className="mt-3">
                <SourceTag source={o.source} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="mt-8 text-center text-muted-foreground">Nothing matches.</p>
      )}
    </AppShell>
  );
}
