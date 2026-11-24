// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { execSync } from "node:child_process";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { operators } from "./src/lib/data";

// Every page is built ahead of time, so the service worker can cache all of them
// and the app works with no signal. autoSubfolderIndex: false writes
// `directory.html` rather than `directory/index.html`, so `/directory` is served
// without a trailing-slash redirect.
const pages = [
  "/",
  "/directory",
  "/trips",
  "/trip",
  "/plan",
  "/sites",
  "/site",
  "/qualifications",
  "/saved",
  "/feedback",
  ...operators.map((operator) => `/operators/${operator.id}`),
].map((path) => ({ path }));

function localDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// The commit a build came from, sent with each feedback note. Builds without
// git (Lovable's, for one) say "unknown".
function appVersion() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim() || "unknown";
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    prerender: {
      enabled: true,
      crawlLinks: false,
      autoSubfolderIndex: false,
      failOnError: true,
    },
    pages,
  },
  vite: {
    define: {
      __BUILD_DATE__: JSON.stringify(localDate(new Date())),
      __APP_VERSION__: JSON.stringify(appVersion()),
    },
  },
});
