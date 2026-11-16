// `bun run notes`: prints the latest feedback notes from the demo's database.
// `bun run notes --local` reads the local database that `bun run preview:cf` uses.
// It first deletes notes older than 90 days, like the daily cron does.
import { spawnSync } from "node:child_process";

const target = process.argv.includes("--local") ? "--local" : "--remote";
const RETENTION_DAYS = 90;
const LIMIT = 100;

function d1(sql: string): Record<string, unknown>[] {
  const result = spawnSync(
    "wrangler",
    ["d1", "execute", "DB", target, "--json", "--command", JSON.stringify(sql)],
    { encoding: "utf8", shell: process.platform === "win32" },
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  const parsed = JSON.parse(result.stdout) as { results: Record<string, unknown>[] }[];
  return parsed[0]?.results ?? [];
}

const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
d1(`DELETE FROM feedback_notes WHERE received_at < '${cutoff}'`);

const notes = d1(
  `SELECT received_at, screen, record_id, app_version, text FROM feedback_notes ORDER BY received_at DESC LIMIT ${LIMIT}`,
);
if (notes.length === 0) {
  console.log("No feedback notes.");
} else {
  for (const n of notes) {
    const about = n["record_id"] ? ` · ${String(n["record_id"])}` : "";
    console.log(
      `\n${String(n["received_at"])} · ${String(n["screen"])}${about} · ${String(n["app_version"])}`,
    );
    console.log(`  ${String(n["text"]).replaceAll("\n", "\n  ")}`);
  }
  console.log(
    `\n${notes.length} note${notes.length === 1 ? "" : "s"} (newest first, at most ${LIMIT}).`,
  );
}
