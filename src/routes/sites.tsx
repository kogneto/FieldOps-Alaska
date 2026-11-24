import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Lock, RadioTower } from "lucide-react";
import { AppShell } from "@/components/fo";
import { NewSiteForm } from "@/components/site-form";
import { useSites } from "@/lib/site-store";
import { siteSummary } from "@/lib/sites";

export const Route = createFileRoute("/sites")({
  head: () => ({
    meta: [
      { title: "Your sites — FieldOps Alaska" },
      { name: "description", content: "The sites you work at, kept only on this phone." },
      { property: "og:title", content: "Your sites — FieldOps Alaska" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SitesPage,
});

function SitesPage() {
  const sites = useSites();
  const navigate = useNavigate();
  return (
    <AppShell title="Your sites">
      <p className="text-base text-muted-foreground">
        Type in each site you work at. Sites stay on this phone; the app never sends them anywhere.
      </p>

      <section className="mt-6">
        <h2 className="mb-2 font-display text-lg uppercase text-muted-foreground">
          Type in a site
        </h2>
        <NewSiteForm onAdded={(site) => void navigate({ to: "/site", search: { id: site.id } })} />
      </section>

      {sites === null ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : sites.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">No sites yet.</p>
      ) : (
        <section className="mt-8">
          <h2 className="mb-2 font-display text-lg uppercase text-muted-foreground">
            On this phone
          </h2>
          <ul className="grid gap-2">
            {sites.map((site) => (
              <li key={site.id}>
                <Link
                  to="/site"
                  search={{ id: site.id }}
                  className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 border-border bg-card p-4 active:bg-secondary"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-bold">
                      <RadioTower className="h-5 w-5 shrink-0 text-primary" />
                      <span className="min-w-0 break-words">{site.name}</span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {siteSummary(site) || "No kind or community yet"}
                      {site.confidentiality === "confidential" && (
                        <span className="flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-semibold uppercase">
                          <Lock className="h-3 w-3" />
                          Confidential
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
