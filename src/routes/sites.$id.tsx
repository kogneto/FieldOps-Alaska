import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Lock,
  MapPin,
  ShieldAlert,
  Snowflake,
  BadgeCheck,
  MessageSquareWarning,
} from "lucide-react";
import { AppShell, Disclaimer, ModeIcon, SaveButton, SourceTag } from "@/components/fo";
import { confidentialityRule, getOperator, getSite } from "@/lib/data";
import { mapsUrl, platformFrom } from "@/lib/maps";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sites/$id")({
  loader: ({ params }) => {
    const site = getSite(params.id);
    if (!site) throw notFound();
    return { site };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.site.name ?? "Site"} — FieldOps Alaska` },
      {
        name: "description",
        content: `Access notes, seasonal constraints and qualifications for ${loaderData?.site.name ?? "this site"}.`,
      },
      { property: "og:title", content: `${loaderData?.site.name ?? "Site"} — FieldOps Alaska` },
      { property: "og:description", content: "Site access and prep details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => (
    <AppShell title="Not found">
      <Link
        to="/directory"
        className="flex min-h-14 items-center justify-center rounded-lg border-2 border-primary px-4 font-bold uppercase text-primary"
      >
        Back to directory
      </Link>
    </AppShell>
  ),
  errorComponent: () => (
    <AppShell title="Error">
      <p>Couldn't load this site.</p>
    </AppShell>
  ),
  component: SitePage,
});

function SitePage() {
  const { site } = Route.useLoaderData();
  return (
    <AppShell
      title={site.name}
      back={
        <Link
          to="/directory"
          className="mb-2 flex min-h-14 items-center gap-2 text-base font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Directory
        </Link>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="text-muted-foreground">
            {site.kind} · {site.community}, {site.region}
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {site.lat.toFixed(2)}, {site.lng.toFixed(2)}
          </div>
        </div>
        <SaveButton id={site.id} />
      </div>
      <div className="mt-3">
        <SourceTag source={site.source} showAdvice />
      </div>
      <OpenInMaps lat={site.lat} lng={site.lng} />

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="flex items-center gap-1 rounded-sm bg-secondary px-2 py-1 text-xs font-semibold uppercase">
          <Lock className="h-3.5 w-3.5" />
          {site.confidentiality === "open" ? "Open" : "Confidential"}
        </span>
        {site.escort && (
          <span className="flex items-center gap-1 rounded-sm bg-caution px-2 py-1 text-xs font-bold uppercase text-caution-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            Escort required
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {confidentialityRule[site.confidentiality]}
      </p>

      <Section title="Access">
        <ul className="grid gap-2">
          {site.access.map((a) => (
            <li
              key={a}
              className="rounded-lg border-2 border-border bg-card p-4 text-card-foreground"
            >
              {a}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Gate codes and keys come from client dispatch — never stored here.
        </p>
      </Section>

      <Section title="Seasonal">
        <p className="flex gap-3 rounded-lg border-2 border-border bg-card p-4">
          <Snowflake className="h-6 w-6 shrink-0 text-accent" />
          {site.seasonal}
        </p>
      </Section>

      <Section title="Qualifications">
        <ul className="grid gap-2">
          {site.qualifications.map((c) => (
            <li
              key={c}
              className="flex min-h-16 items-center gap-3 rounded-lg border-2 border-border bg-card p-4"
            >
              <BadgeCheck className="h-6 w-6 shrink-0 text-ok" />
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          A prep reminder only — not an authorization decision.
        </p>
      </Section>

      <Section title="Get there with">
        <div className="grid gap-2">
          {site.reachBy.map((id) => {
            const o = getOperator(id);
            if (!o) return null;
            return (
              <Link
                key={id}
                to="/operators/$id"
                params={{ id }}
                className="flex min-h-16 items-center gap-3 rounded-lg border-2 border-border bg-card px-4 font-semibold active:bg-secondary"
              >
                <ModeIcon mode={o.mode} className="h-5 w-5 text-accent" />
                {o.name}
              </Link>
            );
          })}
        </div>
      </Section>

      <Button
        variant="outline"
        size="lg"
        onClick={() =>
          alert("Prototype: a field report would be queued and sent when you have signal.")
        }
        className="mt-6 w-full border-2 border-primary uppercase text-primary"
      >
        <MessageSquareWarning className="h-5 w-5" />
        Report a change
      </Button>
      <Disclaimer />
    </AppShell>
  );
}

// Hands the coordinates to the phone's own maps app. The href is the web
// fallback; on a phone the click handler swaps in the native maps link.
function OpenInMaps({ lat, lng }: { lat: number; lng: number }) {
  return (
    <a
      href={mapsUrl("other", lat, lng)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        const platform = platformFrom(navigator.userAgent, navigator.maxTouchPoints);
        if (platform === "other") return;
        e.preventDefault();
        window.location.href = mapsUrl(platform, lat, lng);
      }}
      className="mt-4 flex min-h-16 items-center justify-center gap-3 rounded-lg border-2 border-accent px-4 text-lg font-bold uppercase text-accent active:bg-secondary"
    >
      <MapPin className="h-6 w-6" />
      Open in maps
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-display text-lg uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
