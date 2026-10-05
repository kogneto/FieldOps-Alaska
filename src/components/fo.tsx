import { Link } from "@tanstack/react-router";
import { Home, Search, ListChecks, Bookmark, Plane, Ship, Truck, Star } from "lucide-react";
import type { ReactNode } from "react";
import { daysSince, type Mode, type Source } from "@/lib/data";
import { useSaved } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function AppShell({ title, children, back }: { title: string; children: ReactNode; back?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-2xl">
      <header className="sticky top-0 z-10 border-b-4 border-primary bg-background/95 px-5 py-4 backdrop-blur">
        {back}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="min-w-0 font-display text-2xl uppercase leading-tight text-foreground">{title}</h1>
          <span className="shrink-0 rounded-md border border-border bg-secondary px-2 py-1.5 font-mono text-xs uppercase text-muted-foreground">Sample</span>
        </div>
      </header>
      <main className="flex-1 px-5 pb-32 pt-5">{children}</main>
      <BottomNav />
    </div>
  );
}

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/directory", label: "Find", icon: Search },
  { to: "/checklists", label: "Prep", icon: ListChecks },
  { to: "/saved", label: "Offline", icon: Bookmark },
] as const;

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-md grid-cols-4 px-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex min-h-20 flex-col items-center justify-center gap-1 text-sm font-bold uppercase text-muted-foreground active:bg-secondary"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="h-7 w-7" strokeWidth={2.5} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function ModeIcon({ mode, className = "h-5 w-5" }: { mode: Mode; className?: string }) {
  const I = mode === "air" ? Plane : mode === "sea" ? Ship : Truck;
  return <I className={className} />;
}

export function SourceTag({ source }: { source: Source }) {
  const d = daysSince(source.verified);
  const stale = d > 60;
  const tone =
    source.confidence === "high" ? "bg-ok text-ok-foreground" : source.confidence === "medium" ? "bg-caution text-caution-foreground" : "bg-destructive text-destructive-foreground";
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-sm px-1.5 py-0.5 font-mono uppercase ${tone}`}>{source.confidence}</span>
      <span className="text-muted-foreground">
        {source.label} · verified {source.verified}
      </span>
      {stale && <span className="rounded-sm border border-destructive px-1.5 py-0.5 font-mono uppercase text-destructive">stale</span>}
    </div>
  );
}

export function SaveButton({ id }: { id: string }) {
  const { isSaved, toggle } = useSaved();
  const on = isSaved(id);
  return (
    <Button
      variant={on ? "default" : "outline"}
      size="icon"
      onClick={(e) => {
        e.preventDefault();
        toggle(id);
      }}
      aria-pressed={on}
      aria-label={on ? "Remove from offline" : "Save for offline"}
      className="shrink-0 border-2"
    >
      <Star className={`h-5 w-5 ${on ? "fill-current" : ""}`} />
    </Button>
  );
}

export function Disclaimer() {
  return (
    <p className="mt-6 rounded-md border-2 border-border p-4 text-sm leading-relaxed text-muted-foreground">
      Not a substitute for 911 or official notices. Official and operator sources take precedence over crew reports. No gate codes or credentials are stored in this app.
    </p>
  );
}
