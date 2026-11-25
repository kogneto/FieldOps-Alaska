import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Phone, Mail, Globe, Clock, Snowflake, Info } from "lucide-react";
import { AppShell, Disclaimer, ModeIcon, SaveButton, SourceTag } from "@/components/fo";
import { DirectionsLink } from "@/components/place-field";
import { getOperator, type Office } from "@/lib/data";

export const Route = createFileRoute("/operators/$id")({
  loader: ({ params }) => {
    const op = getOperator(params.id);
    if (!op) throw notFound();
    return { op };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.op.name ?? "Operator"} — FieldOps Alaska` },
      {
        name: "description",
        content: `Offices, phone numbers and hours for ${loaderData?.op.name ?? "this operator"}.`,
      },
      { property: "og:title", content: `${loaderData?.op.name ?? "Operator"} — FieldOps Alaska` },
      { property: "og:description", content: "Operator contact and hours." },
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
        Back to operators
      </Link>
    </AppShell>
  ),
  errorComponent: () => (
    <AppShell title="Error">
      <p>Couldn't load this operator.</p>
    </AppShell>
  ),
  component: OpPage,
});

const NOT_PUBLISHED = "Not published by the operator.";

function OpPage() {
  const { op } = Route.useLoaderData();
  return (
    <AppShell
      title={op.name}
      recordId={op.id}
      back={
        <Link
          to="/directory"
          className="mb-2 flex min-h-14 items-center gap-2 text-base font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Operators
        </Link>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0 text-muted-foreground">
          <div className="flex items-center gap-2">
            <ModeIcon mode={op.mode} className="h-6 w-6 shrink-0 text-accent" />
            <span className="min-w-0">
              <span className="uppercase">{op.mode}</span> · {op.regions.join(", ")}
            </span>
          </div>
          <p className="mt-1">{op.communities.join(", ")}</p>
        </div>
        <SaveButton id={op.id} />
      </div>
      <div className="mt-3">
        <SourceTag source={op.source} showAdvice />
      </div>

      <a
        href={`tel:${op.phone}`}
        className="mt-5 flex min-h-16 items-center justify-center gap-3 rounded-lg bg-primary px-4 text-lg font-bold uppercase text-primary-foreground active:translate-y-0.5"
      >
        <Phone className="h-6 w-6" />
        Call {op.phone}
      </a>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {op.email && (
          <a
            href={`mailto:${op.email}`}
            className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border font-semibold active:bg-secondary"
          >
            <Mail className="h-5 w-5" />
            Email
          </a>
        )}
        <a
          href={op.website}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border font-semibold active:bg-secondary"
        >
          <Globe className="h-5 w-5" />
          Website
        </a>
      </div>

      <div className="mt-6 grid gap-2">
        {op.note && (
          <Row
            icon={<Info className="h-5 w-5 shrink-0 text-accent" />}
            label="Note"
            value={op.note}
          />
        )}
        <Row
          icon={<Clock className="h-5 w-5 shrink-0 text-accent" />}
          label="Hours"
          value={op.hours ?? NOT_PUBLISHED}
        />
        <Row
          icon={<Snowflake className="h-5 w-5 shrink-0 text-accent" />}
          label="Seasonal"
          value={op.seasonal ?? NOT_PUBLISHED}
        />
      </div>

      <h2 className="mt-6 mb-2 font-display text-lg uppercase tracking-wide text-muted-foreground">
        Services
      </h2>
      <div className="flex flex-wrap gap-2">
        {op.services.map((s) => (
          <span key={s} className="rounded-full bg-card px-3 py-1.5 text-sm">
            {s}
          </span>
        ))}
      </div>

      <h2 className="mt-6 mb-2 font-display text-lg uppercase tracking-wide text-muted-foreground">
        Offices
      </h2>
      {op.offices.length === 0 ? (
        <p className="text-muted-foreground">
          The operator publishes no office addresses. Call to ask where to meet it.
        </p>
      ) : (
        <ul className="grid gap-3">
          {op.offices.map((office) => (
            <li key={`${office.community}-${office.name}`}>
              <OfficeCard office={office} mainPhone={op.phone} />
            </li>
          ))}
        </ul>
      )}

      <Disclaimer />
    </AppShell>
  );
}

function OfficeCard({ office, mainPhone }: { office: Office; mainPhone: string }) {
  return (
    <div className="grid gap-2 rounded-lg border-2 border-border bg-card p-4">
      <div>
        <div className="text-lg font-bold text-card-foreground">
          {office.community} · {office.name}
        </div>
        {office.runBy && <div className="text-sm text-muted-foreground">Run by {office.runBy}</div>}
      </div>
      {office.where ? (
        <>
          <p>{office.where}</p>
          <DirectionsLink where={office.where} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No street address published.</p>
      )}
      {office.phone && office.phone !== mainPhone && (
        <a
          href={`tel:${office.phone}`}
          className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-primary px-4 font-bold uppercase text-primary active:bg-secondary"
        >
          <Phone className="h-5 w-5" />
          Call {office.phone}
        </a>
      )}
      {office.email && (
        <a
          href={`mailto:${office.email}`}
          className="flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-border px-4 font-semibold active:bg-secondary"
        >
          <Mail className="h-5 w-5" />
          <span className="min-w-0 text-sm [overflow-wrap:anywhere]">{office.email}</span>
        </a>
      )}
      {office.hours && <p className="text-sm">{office.hours}</p>}
      {office.onTo && office.onTo.length > 0 && (
        <p className="text-sm">
          <span className="font-semibold">Goes on to:</span> {office.onTo.join(", ")}
        </p>
      )}
      {office.note && <p className="text-sm text-muted-foreground">{office.note}</p>}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-16 gap-3 rounded-lg border-2 border-border bg-card p-4">
      {icon}
      <div>
        <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
        <div>{value}</div>
      </div>
    </div>
  );
}
