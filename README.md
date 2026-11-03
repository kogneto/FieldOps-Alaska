# FieldOps Alaska

A phone-first prototype of a field companion for telecom technicians who work at remote sites in Alaska. It's designed for outdoor use with gloves, so the tap targets are large.

**This is an early prototype.** Today it's a searchable directory of sample sites and operators plus a few prep checklists. It doesn't plan trips, track gear or show live weather yet.

Everything in it is made up. The sites, contacts and notes are sample data, the phone numbers are 555 numbers, and the email addresses are example.com. Real place names, highways and the Alaska Marine Highway show up, but nothing here has been verified or should be used for real field work. The header on every main screen carries a "Sample" badge.

## What works today

**Directory.** Search seven sample sites and eight sample operators (air, sea and land), filter by region (Southeast, Southcentral or Interior), and open a detail page. A site page lists access notes, seasonal limits, the credentials to carry, the operator that can get you there, and an "Escort required" tag when one applies. An operator page lists hours, seasonal notes and services, with a call button and, when the entry has them, email and website buttons.

**Source and freshness.** Each site and operator shows a source, a confidence level (high, medium or low) and a last-verified date. Entries older than 60 days get a "stale" tag. The labels and dates are typed into the sample data by hand, and the stale tag is worked out from the current date.

**Prep checklists.** Four checklists: crew and comms, cold-weather and climb PPE, tower site parts, and paperwork. Your progress is kept in the browser on your phone.

**Saved list.** Star a site or operator to add it to the list under the Offline tab. The app stores only which records you picked, in the browser's local storage. There's no offline support yet: nothing is cached, so the page needs a connection to load.

**Links to official conditions.** The home screen links out to the National Weather Service's Alaska page, Alaska 511 road conditions and the Alaska Marine Highway. The app doesn't pull in any live conditions itself.

The "Report a change" button on site pages is a placeholder that only shows a message.

## Tap targets

Most main controls are at least 56 px tall, and the bottom bar (Home, Find, Prep, Offline) is 80 px. A few secondary controls, the back links and region filter chips, are 48 px. The layout is a single column sized for a phone.

## Limits

- No backend, accounts or login. All the content is hard-coded in `src/lib/data.ts`.
- Saved records and checklist progress live in local storage, so they're per browser and per device and disappear if site data is cleared.
- A site's "confidentiality" label is only a label. Nothing controls access, and the app stores no gate codes or credentials.
- Sites show raw latitude and longitude. There's no map.

## Where it's headed

The goal is for it to help technicians plan trips around Alaska, track shipped gear, and stay aware of weather and travel hazards. None of that is built yet.

## Stack

- TanStack Start and TanStack Router, with file-based routes in `src/routes`
- React 19 and TypeScript
- Tailwind CSS 4, with the shadcn/ui component set installed in `src/components/ui` (the app only uses the button so far)
- Vite, using Lovable's TanStack config
- Vitest with jsdom for tests, ESLint and Prettier for linting and formatting

Bun is the package manager (`bun.lock` and `bunfig.toml` are in the repo).

## Running it

```sh
bun install
bun run dev      # dev server
bun run build    # production build
bun run preview  # preview the build
bun run test     # run the tests once
bun run lint
```

There's one test so far. It checks that `/` matches a page route instead of the not-found fallback, without rendering anything.

## Built with Lovable

Started in [Lovable](https://lovable.dev). The first commits here are an import from it.
