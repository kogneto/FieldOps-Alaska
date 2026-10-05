import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Phone, Mail, Globe, Clock, Snowflake, RadioTower } from "lucide-react";
import { AppShell, Disclaimer, ModeIcon, SaveButton, SourceTag } from "@/components/fo";
import { getOperator, sites } from "@/lib/data";

export const Route = createFileRoute("/operators/$id")({
  loader: ({ params }) => {
    const op = getOperator(params.id);
    if (!op) throw notFound();
    return { op };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.op.name ?? "Operator"} — FieldOps Alaska` },
      { name: "description", content: `Contact, hours and seasonal notes for ${loaderData?.op.name ?? "this operator"}.` },
      { property: "og:title", content: `${loaderData?.op.name ?? "Operator"} — FieldOps Alaska` },
      { property: "og:description", content: "Operator contact and hours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => <AppShell title="Not found"><Link to="/directory" className="text-primary">Back to directory</Link></AppShell>,
  errorComponent: () => <AppShell title="Error"><p>Couldn't load this operator.</p></AppShell>,
  component: OpPage,
});

function OpPage() {
  const { op } = Route.useLoaderData();
  const served = sites.filter((s) => s.reachBy.includes(op.id));
  return (
    <AppShell
      title={op.name}
      back={<Link to="/directory" search={{ tab: "operators" }} className="mb-2 flex min-h-12 items-center gap-2 text-base font-semibold text-muted-foreground"><ArrowLeft className="h-5 w-5" />Operators</Link>}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-2 text-muted-foreground"><ModeIcon mode={op.mode} className="h-6 w-6 shrink-0 text-accent" /><span className="uppercase">{op.mode}</span> · {op.community}, {op.region}</div>
        <SaveButton id={op.id} />
      </div>
      <div className="mt-3"><SourceTag source={op.source} /></div>

      <a href={`tel:${op.phone}`} className="mt-5 flex min-h-16 items-center justify-center gap-3 rounded-lg bg-primary px-4 text-lg font-bold uppercase text-primary-foreground active:translate-y-0.5">
        <Phone className="h-6 w-6" />Call {op.phone}
      </a>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {op.email && <a href={`mailto:${op.email}`} className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border font-semibold active:bg-secondary"><Mail className="h-5 w-5" />Email</a>}
        {op.website && <a href={op.website} target="_blank" rel="noreferrer" className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border font-semibold active:bg-secondary"><Globe className="h-5 w-5" />Website</a>}
      </div>

      <div className="mt-6 grid gap-2">
        <Row icon={<Clock className="h-5 w-5 text-accent" />} label="Hours" value={op.hours} />
        <Row icon={<Snowflake className="h-5 w-5 text-accent" />} label="Seasonal" value={op.seasonal} />
      </div>

      <h2 className="mt-6 mb-2 font-display text-lg uppercase tracking-wide text-muted-foreground">Services</h2>
      <div className="flex flex-wrap gap-2">{op.services.map((s) => <span key={s} className="rounded-full bg-card px-3 py-1.5 text-sm">{s}</span>)}</div>

      {served.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 font-display text-lg uppercase tracking-wide text-muted-foreground">Sites served</h2>
          <div className="grid gap-2">
            {served.map((s) => (
              <Link key={s.id} to="/sites/$id" params={{ id: s.id }} className="flex min-h-16 items-center gap-3 rounded-lg border-2 border-border bg-card px-4 font-semibold active:bg-secondary"><RadioTower className="h-5 w-5 text-primary" />{s.name}</Link>
            ))}
          </div>
        </>
      )}
      <Disclaimer />
    </AppShell>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-16 gap-3 rounded-lg border-2 border-border bg-card p-4">
      {icon}
      <div><div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div><div>{value}</div></div>
    </div>
  );
}
