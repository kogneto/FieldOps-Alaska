// Runs after `vite build`: writes .output/public/sw.js with every built file
// the app needs listed for caching, so FieldOps works with no signal.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { precacheVersion, urlForFile, withCacheHeaders, type BuiltFile } from "./precache";

const publicDir = ".output/public";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// Lovable's own build writes to dist/client instead. There the app still
// works online, just without the service worker, so warn rather than fail its
// build. `bun run deploy` refuses to ship a build without sw.js.
if (!existsSync(publicDir)) {
  console.warn(`build-sw: ${publicDir} is missing, so no service worker was written.`);
  process.exit(0);
}

const cached: (BuiltFile & { url: string })[] = [];
for (const full of walk(publicDir)) {
  const path = relative(publicDir, full).replaceAll("\\", "/");
  const url = urlForFile(path);
  if (url) cached.push({ path, url, content: readFileSync(full) });
}

const version = precacheVersion(cached);
const urls = cached.map((file) => file.url).sort();
const template = readFileSync("scripts/sw-template.js", "utf8");
const header = `const VERSION = ${JSON.stringify(version)};\nconst PRECACHE = ${JSON.stringify(urls, null, 2)};\n\n`;
writeFileSync(join(publicDir, "sw.js"), header + template);

const headersPath = join(publicDir, "_headers");
const headers = existsSync(headersPath) ? readFileSync(headersPath, "utf8") : "";
writeFileSync(headersPath, withCacheHeaders(headers));

const bytes = cached.reduce((sum, file) => sum + file.content.length, 0);
console.log(
  `build-sw: version ${version}, ${urls.length} files, ${(bytes / 1024).toFixed(0)} KB cached`,
);
