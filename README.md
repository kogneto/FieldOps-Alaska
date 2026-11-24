# FieldOps Alaska

A phone-first field companion for telecom technicians who work at remote sites in Alaska. It's designed for outdoor use with gloves, so the tap targets are large. Anyone can use it: there's no sign-in, and nothing a technician types in leaves their phone unless they share it.

**This is still being built.** Today you type in your own sites, plan trips to them with a loadout and checklists, and look up operators. Once it has been opened it works with no signal. A trip page that follows each step, travel directions and travel documents come next ([roadmap.md](roadmap.md), slice 4).

The operators are still invented sample data: the phone numbers are 555 numbers and the email addresses are example.com. They'll be replaced with real, public operators (slice 5). Screens that show operators carry a "Sample" badge until then. Your own sites, trips and qualification record are real and stay on your phone.

## What works today

**Your sites.** Type in each site you work at: a name and, if you like, its village or town. On the site's page you set whether it's Open (may be named freely) or Confidential (stays with the technicians working it), what kind of site it is, and which qualifications it needs. Sites are kept only on the phone. A site has no notes box on purpose, so there's nowhere to type a gate code. A site that's on a trip can't be deleted until it's removed from the trip.

**Operators.** Search nine sample operators (air, sea and land), filter by region (Southeast, Southcentral or Interior), and open a detail page. An operator that serves several regions, like the ferry system, shows up under each of them. An operator page lists hours, seasonal notes and services, with a call button and, when the entry has them, email and website buttons. It never lists which sites or clients the operator serves.

**Source and freshness.** Each operator shows a source, a confidence level (high, medium or low) and a last-verified date. Detail pages say what each level means: act on high, confirm medium by phone before committing travel or money, and treat low as a lead only. Entries verified more than 60 days ago get a "stale" tag.

**Trips.** "Plan a new trip" asks which site is first (pick one or type in a new one), then the dates (today and one day to start, with −/+ buttons), and "Start trip" creates it. A site's own page has "Plan a trip here" and, while a trip is under way or coming up, "Add to this trip". A trip lists its sites in the order they're worked, which can be moved up or down; for each you choose how to get there, with an operator or driving yourself. It gathers every qualification its sites need into one list to tick (each marked against your qualification record, if you keep one), and carries its own copy of the four prep checklists (crew and comms, cold-weather and climb PPE, tower site parts, paperwork), any of which can be skipped. A list the trip doesn't need starts skipped and says when it would be: the PPE list is for climb or cold-weather sites or Oct–Apr trips, and the parts kit for radio, microwave and cell sites. "Share trip plan" sends the plan as text through the phone's share sheet, starting with a confidential warning when any site is confidential. Trips are kept on the phone only, and past ones are listed apart. Trips planned on the old sample sites can't be opened; the Trips screen offers to clear them.

**Loadout.** Each trip has a loadout: the tools and parts it needs, on pallets or in tubs. Build it by adding items (with a quantity, the pallet or tub, and a dangerous-goods flag for things like fuel or bear spray), by copying your last trip's, or from the tower site parts kit. Four checklists run over it in order: the pre-loadout at home base, an arrival checklist and a departure pre-loadout at each site, and the return checklist back home. Each checklist lists what was ticked at the one before it, so the return checklist covers what was packed at the last site, and something picked up at a site can be added there and rides on from then. A whole pallet or tub can be ticked at once. The pre-loadout and each departure take the shipment's waybill number, which shows on the next arrival or return. For dangerous goods the app says to check with the operator; it doesn't state their rules.

**Your qualifications.** An optional record, under Trips, of the qualifications you hold and the month each expires. A trip then flags any that expire before it ends. It stays on the phone, asks for no name, and is never sent with feedback or in a shared plan. It's a prep reminder only, not an authorization decision.

**Saved list.** Star an operator to add it to the list under the Saved tab. The app stores only which operators you picked, in the browser's local storage.

**Works with no signal.** Every page is built ahead of time, and the first time the app is opened online a service worker caches all of it: the 19 pages, the code, the fonts and the icons, about 1 MB. After that every screen opens with no signal and checklists still tick. The header shows whether the phone is online and the date the records were built ("Records as of"). A new version downloads in the background and takes over the next time the app is opened. A page that isn't cached shows a "No signal" page after 8 seconds at most.

**Install it.** Add it to the home screen from the browser's share or menu button, and it opens full screen like an app. On iPhone, installing also stops Safari from clearing the cached app after a week without use.

**Links to official conditions.** The home screen links out to the National Weather Service's Alaska page, Alaska 511 road conditions and the Alaska Marine Highway. The app doesn't pull in any live conditions itself.

**Feedback.** Every screen ends with a "Send feedback" button. On an operator page the note is tied to that operator; a note is never tied to a site. A note works with no signal: it waits on the phone and sends itself on launch, on reconnect or when the app comes back to the foreground. Nobody is asked who they are. A note carries its text (at most 1,000 characters), the screen it came from, the operator if any, the app version and a random note id. The server adds the time it arrived. The sender's IP address is used for a moment to limit spam (5 notes a minute) and is never stored; there's also a cap of 300 notes a day. Notes are deleted after 90 days by a daily cron.

## Tap targets

Every main control is at least 56 px tall and most are 64 px. The bottom bar (Home, Trips, Sites, Find, Saved) is 80 px. The layout is a single column sized for a phone.

## Limits

- No accounts or login. The operators and checklists are hard-coded in `src/lib/data.ts`; the only server code is the feedback endpoint.
- Sites, saved operators and trips live in local storage, so they're per browser and per device and disappear if site data is cleared.
- A site's confidentiality says how it may be talked about, and nothing enforces it. FieldOps has no place for access secrets (gate codes, keys or lock combinations).
- There's no map in the app.

## Where it's headed

It's an app for any technician, not one crew. Next is the whole trip as it's really worked: build and ship the loadout, travel out, make sure it arrived, pack it up and ship it home, travel home, and make sure it all came back, with directions, lodging and travel documents along the way. After that the sample operators are replaced with real ones. Live weather is off the list for now. [roadmap.md](roadmap.md) has the full plan and [CONTEXT.md](CONTEXT.md) the vocabulary.

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

The tests cover the route check, which files the service worker caches, the deploy guard, the sample data rules, the maps links, note validation, the feedback endpoint (origin, size, rate limit, daily cap, duplicates, 90-day purge), the outbox, and typed-in sites and trips (local dates in Alaska time, site order, the qualification roll-up, sharing, and reading damaged or older storage).

## Checks

```sh
bun run check         # typecheck, lint, formatting, tests and build, about 15 seconds
bun run check:docker  # the same in Linux, in Docker on this PC (ops/checks/README.md)
```

Every pull request runs the same checks on GitHub's machines (`.github/workflows/checks.yml`), and so does `main` after a merge. A newer push to a pull request cancels the older run. GitHub's runners cost nothing for a public repository, and the workflow gets no secrets, so it can't deploy.

`main` requires the Checks status (a repository ruleset), and auto-merge is on: a pull request with auto-merge enabled merges itself as soon as Checks pass. Admins can still push or merge past the rule.

## Deploying

```sh
bun run deploy
```

It deploys the public demo to the `fieldops-alaska` Worker on Cloudflare, at <https://fieldops-alaska.andy-deloose.workers.dev>. It refuses to run unless every change is committed and pushed. Then it runs lint, tests and the build, applies any new database migrations, and deploys, stopping at the first failure. Wrangler must be signed in on this PC (`bunx wrangler login`).

The demo counts visits with Cloudflare Web Analytics, which sets no cookies and collects no personal data. Its site token is in `.env.production`. Builds without that file leave the analytics script out.

## Built with Lovable

Started in [Lovable](https://lovable.dev). The first commits here are an import from it.
