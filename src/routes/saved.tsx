import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { AppShell, ModeIcon, SaveButton } from "@/components/fo";
import { operators } from "@/lib/data";
import { useSaved } from "@/lib/store";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved — FieldOps Alaska" },
      { name: "description", content: "The operators you've starred." },
      { property: "og:title", content: "Saved — FieldOps Alaska" },
      { property: "og:description", content: "Your starred operators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { saved } = useSaved();
  // Older versions could star sample sites too; only operators are shown.
  const list = operators.filter((x) => saved.includes(x.id));
  return (
    <AppShell title="Saved" sample>
      <div className="flex gap-3 rounded-lg border-2 border-border bg-card p-4 text-base">
        <Star className="h-6 w-6 shrink-0 text-accent" />
        <p>
          Star operators to find them fast here. Everything in the app works with no signal, starred
          or not.
        </p>
      </div>
      {list.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          Nothing saved yet.{" "}
          <Link to="/directory" className="font-semibold text-primary">
            Browse operators
          </Link>
        </p>
      )}
      <div className="mt-6 grid gap-2">
        {list.map((x) => (
          <Link
            key={x.id}
            to="/operators/$id"
            params={{ id: x.id }}
            className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 border-border bg-card p-3 active:bg-secondary"
          >
            <span className="flex items-center gap-2 font-semibold">
              <ModeIcon mode={x.mode} className="h-5 w-5 text-accent" />
              {x.name}
            </span>
            <SaveButton id={x.id} />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
