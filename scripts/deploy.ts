// `bun run deploy`: deploys the public demo to Cloudflare from this PC.
// Refuses unless every change is committed and pushed, then lints, tests and
// builds before deploying, so what is live is always a pushed, checked commit.
import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { deployBlocker } from "./deploy-guard";

const shell = process.platform === "win32";

function git(...args: string[]) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  return result.status === 0 ? (result.stdout ?? "").trim() : null;
}

function run(command: string, args: string[]) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell });
  if (result.status !== 0) {
    console.error(`\ndeploy: \`${command} ${args.join(" ")}\` failed, so nothing was deployed.`);
    process.exit(result.status ?? 1);
  }
}

git("fetch", "--quiet");
const upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}");
const blocker = deployBlocker({
  uncommitted: git("status", "--porcelain") ?? "",
  upstream,
  head: git("rev-parse", "HEAD") ?? "",
  upstreamHead: upstream === null ? null : git("rev-parse", "@{u}"),
});
if (blocker) {
  console.error(`deploy: ${blocker}`);
  process.exit(1);
}

run("bun", ["run", "lint"]);
run("bun", ["run", "test"]);
run("bun", ["run", "build"]);

if (!existsSync(".output/public/sw.js")) {
  console.error("deploy: the build wrote no service worker, so the app wouldn't work offline.");
  process.exit(1);
}

// A non-prerender build leaves a pointer here to Nitro's own config, which
// wrangler would prefer over wrangler.jsonc. Remove it so wrangler.jsonc wins.
rmSync(".wrangler/deploy", { recursive: true, force: true });

const branch = git("rev-parse", "--abbrev-ref", "HEAD");
const commit = (git("rev-parse", "HEAD") ?? "").slice(0, 7);
run("wrangler", ["deploy", "--message", `${branch}@${commit}`]);
