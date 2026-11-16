// FieldOps Alaska service worker. scripts/build-sw.ts prepends VERSION and PRECACHE.
//
// Every file the app needs is cached on install, so it works with no signal.
// There is deliberately no skipWaiting(): a new version downloads in the
// background and takes over the next time the app is launched, so nothing
// changes under a technician mid-task.

/* global VERSION, PRECACHE */
const CACHE = `fieldops-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("fieldops-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? servePage(url, request) : serveFile(request));
});

// On a weak signal a request can hang for minutes before failing, so a page
// that isn't cached gives up after this long and shows the offline page.
const NETWORK_TIMEOUT_MS = 8000;

// Pages are cached under their route, so `/directory?region=Interior` and
// `/directory/` both find `/directory`.
async function servePage(url, request) {
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  const cache = await caches.open(CACHE);
  const cached = await cache.match(new URL(path, self.location.origin).href);
  if (cached) return cached;
  try {
    return await fetch(request, { signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS) });
  } catch {
    return offlinePage();
  }
}

async function serveFile(request) {
  const cache = await caches.open(CACHE);
  return (await cache.match(request)) ?? fetch(request);
}

function offlinePage() {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline — FieldOps Alaska</title></head>
<body style="margin:0;background:#0d181d;color:#f9f5eb;font:18px system-ui,sans-serif;padding:24px">
<h1 style="font-size:24px">No signal</h1>
<p>FieldOps can't open this page without a connection.</p>
<a href="/" style="display:flex;align-items:center;justify-content:center;min-height:64px;margin-top:24px;border-radius:8px;background:#fe6a00;color:#0d181d;font-weight:700;text-decoration:none">Go to Home</a>
</body></html>`;
  return new Response(html, {
    status: 503,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
