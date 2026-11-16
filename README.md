# FieldOps Alaska

A phone-first prototype of a field companion for telecom technicians who work at remote sites in Alaska. It's designed for outdoor use with gloves, so the tap targets are large.

**This is an early prototype.** Today it's a searchable directory of sample sites and operators plus a few prep checklists, and once it has been opened it works with no signal. It doesn't plan trips yet, and it doesn't track gear or show live weather.

Everything in it is made up. The sites, contacts and notes are sample data, the phone numbers are 555 numbers, and the email addresses are example.com. Real place names, highways and the Alaska Marine Highway show up, but nothing here has been verified or should be used for real field work. The header on every main screen carries a "Sample" badge.

## What works today

**Directory.** Search seven sample sites and nine sample operators (air, sea and land), filter by region (Southeast, Southcentral or Interior), and open a detail page. An operator that serves several regions, like the ferry system, shows up under each of them. A site page lists access notes, seasonal limits, the qualifications needed, the operators that can get you there, and an "Escort required" tag when one applies. It also says whether the record is Open (may be shared freely) or Confidential (stays inside the crew), and has an "Open in maps" button. An operator page lists hours, seasonal notes and services, with a call button and, when the entry has them, email and website buttons.

**Source and freshness.** Each site and operator shows a source, a confidence level (high, medium or low) and a last-verified date. Detail pages say what each level means: act on high, confirm medium by phone before committing travel or money, and treat low as a lead only. Entries verified more than 60 days ago get a "stale" tag. The sample records store how many days ago they were verified, so their dates move with today and the demo always shows a mix of fresh and stale entries.

**Prep checklists.** Four checklists: crew and comms, cold-weather and climb PPE, tower site parts, and paperwork. Your progress is kept in the browser on your phone.

**Saved list.** Star a site or operator to add it to the list under the Saved tab. The app stores only which records you picked, in the browser's local storage.

**Works with no signal.** Every page is built ahead of time, and the first time the app is opened online a service worker caches all of it: the 21 pages, the code, the fonts and the icons, about 1 MB. After that every screen opens with no signal and checklists still tick. The header shows whether the phone is online and the date the records were built ("Records as of"). A new version downloads in the background and takes over the next time the app is opened. A page that isn't cached shows a "No signal" page after 8 seconds at most.

**Install it.** Add it to the home screen from the browser's share or menu button, and it opens full screen like an app. On iPhone, installing also stops Safari from clearing the cached app after a week without use.

**Links to official conditions.** The home screen links out to the National Weather Service's Alaska page, Alaska 511 road conditions and the Alaska Marine Highway. The app doesn't pull in any live conditions itself.

**Feedback.** Every screen ends with a "Send feedback" button. On a site or operator page the note is tied to that record. A note works with no signal: it waits on the phone and sends itself on launch, on reconnect or when the app comes back to the foreground. Testers are never asked who they are. A note carries its text (at most 1,000 characters), the screen and record it came from, the app version and a random note id. The server adds the time it arrived. The sender's IP address is used for a moment to limit spam (5 notes a minute) and is never stored; there's also a cap of 300 notes a day. Notes are deleted after 90 days by a daily cron.

## Tap targets

Every main control is at least 56 px tall and most are 64 px. The bottom bar (Home, Find, Prep, Saved) is 80 px. The layout is a single column sized for a phone.

## Limits

- No accounts or login. All the content is hard-coded in `src/lib/data.ts`; the only server code is the feedback endpoint.
- Saved records and checklist progress live in local storage, so they're per browser and per device and disappear if site data is cleared.
- A site's confidentiality says how its record may be shared, and nothing enforces it. The app stores no access secrets (gate codes, keys or lock combinations).
- There's no map in the app. "Open in maps" hands a site's coordinates, never its name, to the phone's maps app, so a confidential site's name doesn't reach the maps provider.

## Where it's headed

It's aimed at one working crew of technicians, and until one is lined up, testers try the public demo without signing in. It now works with no signal, and anonymous tester feedback is built. Next comes trip planning on the sample data. The crew's own records behind a sign-in are parked until a crew signs on. Gear tracking and live weather are off the list for now. [roadmap.md](roadmap.md) has the full plan and [CONTEXT.md](CONTEXT.md) the vocabulary.

## Stack

- TanStack Start and TanStack Router, with file-based routes in `src/routes`
- React 19 and TypeScript
- Tailwind CSS 4, with the shadcn/ui component set installed in `src/components/ui` (the app only uses the button so far)
- Vite, using Lovable's TanStack config, with every page prerendered at build time
- A service worker generated after each build by `scripts/build-sw.ts`
- Fonts bundled from Fontsource rather than loaded from Google Fonts
- Cloudflare Workers for hosting, deployed with Wrangler (`wrangler.jsonc`)
- Feedback notes in Cloudflare D1, with schema changes in `migrations/`. The endpoint is `src/routes/api/feedback.ts`, its logic is in `src/server/`, and the 90-day purge runs on a daily cron through a Nitro plugin (`nitro.config.ts`)
- Vitest with jsdom for tests, ESLint and Prettier for linting and formatting

Bun is the package manager (`bun.lock` and `bunfig.toml` are in the repo).

## Running it

```sh
bun install
bun run dev         # dev server (no service worker)
bun run build       # production build, then the service worker
bun run preview:cf  # serve the build locally the way Cloudflare does
bun run test        # run the tests once
bun run lint
bun run notes       # print the latest feedback notes (add --local for the local database)
```

The service worker only runs in a production build, so test offline behaviour with `bun run build` and then `bun run preview:cf`. Feedback also needs the local database: run `bun run db:migrate:local` once. Under `bun run dev` the feedback endpoint answers 503 and notes stay queued.

The tests cover the route check, which files the service worker caches, the deploy guard, the sample data rules, the maps links, note validation, the feedback endpoint (origin, size, rate limit, daily cap, duplicates, 90-day purge) and the outbox.

## Deploying

```sh
bun run deploy
```

It deploys the public demo to the `fieldops-alaska` Worker on Cloudflare, at <https://fieldops-alaska.andy-deloose.workers.dev>. It refuses to run unless every change is committed and pushed. Then it runs lint, tests and the build, applies any new database migrations, and deploys, stopping at the first failure. Wrangler must be signed in on this PC (`bunx wrangler login`).

The demo counts visits with Cloudflare Web Analytics, which sets no cookies and collects no personal data. Its site token is in `.env.production`. Builds without that file leave the analytics script out.

## Built with Lovable

Started in [Lovable](https://lovable.dev). The first commits here are an import from it.
