import { createFileRoute } from "@tanstack/react-router";
import { Check, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/fo";
import { checklists } from "@/lib/data";
import { useChecks } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checklists")({
  head: () => ({
    meta: [
      { title: "Prep checklists — FieldOps Alaska" },
      { name: "description", content: "Crew, PPE, parts and paperwork checklists for remote Alaska telecom runs." },
      { property: "og:title", content: "Prep checklists — FieldOps Alaska" },
      { property: "og:description", content: "Glove-friendly prep checklists that work offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checklists,
});

function Checklists() {
  const { checks, toggle, reset } = useChecks();
  return (
    <AppShell title="Prep">
      <p className="text-base text-muted-foreground">Progress stays on this phone.</p>
      {checklists.map((cl) => {
        const done = cl.items.filter((_, i) => checks[`${cl.id}:${i}`]).length;
        const pct = Math.round((done / cl.items.length) * 100);
        return (
          <section key={cl.id} className="mt-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-mono text-xs uppercase text-primary">{cl.category}</div>
                <h2 className="font-display text-xl uppercase">{cl.title}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => reset(`${cl.id}:`)} aria-label="Reset checklist"><RotateCcw className="h-6 w-6" /></Button>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
            <ul className="mt-3 grid gap-2">
              {cl.items.map((item, i) => {
                const k = `${cl.id}:${i}`;
                const on = !!checks[k];
                return (
                  <li key={k}>
                    <Button variant="ghost" onClick={() => toggle(k)} aria-pressed={on} className={`flex min-h-16 w-full justify-start gap-4 whitespace-normal rounded-lg border-2 px-4 text-left text-lg font-semibold ${on ? "border-border bg-secondary text-muted-foreground line-through" : "border-border bg-card text-card-foreground"}`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>{on && <Check className="h-6 w-6" />}</span>
                      {item}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </AppShell>
  );
}
