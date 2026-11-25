# Roadmap

FieldOps Alaska is for any telecom technician who travels to remote sites in Alaska. It was aimed at one crew until 24 Nov 2026, when Andy made it an app for anyone. There is no sign-in and nothing is asked of a technician, and their trips, typed-in sites and travel documents stay on their phone. It runs on iPhone and Android. The records are real, public operators that Andy keeps current (slice 5), and every site is typed in by its technician (slice 4).

Vocabulary is in [CONTEXT.md](CONTEXT.md). Decisions that need their reasons kept are in [docs/adr](docs/adr).

## Ground rules

- The code is edited here, not in Lovable. Commits still sync to Lovable, so pushed history is never rewritten.
- Cloudflare hosts it. Deployments run from Andy's PC with a command, not from GitHub Actions.
- No site ever enters this repo ([ADR 0001](docs/adr/0001-real-data-stays-out-of-the-repo.md)). The records it holds are real, public operators ([ADR 0003](docs/adr/0003-real-operators-are-public-and-sites-stay-on-the-phone.md)).
- Nothing in the app asks a technician who they are. They may keep their own travel documents with a trip, such as a boarding pass with their name on it; those stay on their phone.
- Logic gets automated tests: the record-format check, staleness, the trip roll-up. Screens are checked by hand on a phone.
- Every pull request runs the checks (typecheck, lint, formatting, tests, build) on GitHub's machines, which cost nothing for a public repository. Deploys still run from the PC.
- `main` requires the Checks status, and pull requests use auto-merge: they merge themselves once Checks pass. Andy, as admin, can still push or merge past the rule.

## Done

- [x] Finish and verify the extreme-environment design pass.
- [x] Connect the project to a GitHub repository.

## Slice 1: make offline true

Done when, with the phone in airplane mode, every screen and record opens and checklists still tick.

- [x] Set up the PC to build and deploy: install Bun and the dependencies, and add a Cloudflare deploy config.
- [x] Add one deploy command. It refuses to run unless the work is committed and pushed, then runs lint, tests and build, then deploys.
- [x] Deliver the app as an installable web app: pages built ahead of time, fonts bundled, an install manifest and a service worker.
- [x] Everything the phone is allowed to see works offline. The star only builds the Saved list.
- [x] Rename the "Offline" tab and the "Offline pack" page to "Saved", and drop the offline wording from the star.
- [x] Show a status line on every screen: online or offline, plus "Records as of" the last successful refresh. New versions and records load in the background and apply on the next launch.
- [x] Deploy the public demo to Cloudflare, with Cloudflare Web Analytics for visit and page counts. It sets no cookies and collects no personal data.

Checked in Chrome against a local Cloudflare server, then with that server stopped. Not yet checked on a real phone in airplane mode.

## Slice 2: tester feedback

Done when a tester can send a feedback note with no signal, and it reaches Cloudflare storage once the phone is back online.

Decided:

- Notes are stored in D1, in the `fieldops-feedback` database.
- Andy reads them with `bun run notes`.
- Spam limits: Cloudflare's rate limit allows 5 notes a minute per IP address, and a cap of 300 notes a day applies across everyone. The address is counted, never stored or logged, and the app says so.
- A note is at most 1,000 characters.
- Notes are deleted 90 days after they arrive, by a daily cron. Old notes are also cleared whenever a note arrives or the notes are read.

Live since 16 Nov 2026, deployed from `85eb8fa`. Checked live: the endpoint accepts, deduplicates and rejects as designed, a note sent from the Hatcher Pass page in Chrome arrived, and the daily cron is registered. The offline path was checked locally, with a note written while the server was down sending itself on reconnect. Not yet checked on a real phone.

- [x] A feedback note can be sent from any screen. On a site or operator page it is tied to that record.
- [x] Rename "Report a change" to "Send feedback"; it opens the same note. Every screen now ends with one "Send feedback" button.
- [x] Notes wait on the phone until there is signal, then send.
- [x] Only the note's text, the screen or record, the app version, the time it arrived and a random note id are stored. No name, email or IP address is asked for or kept.
- [x] The endpoint is public, so it caps note length and how often notes are accepted.
- [ ] Watch testers use it outdoors with gloves on, alongside the notes.

## Tidy-ups

Small, independent of the slices.

- [x] Raise the region filter chips and the back links to 56px.
- [x] Rename "Credentials to carry" to "Qualifications", and say "access secrets" in the disclaimer.
- [x] Replace the three confidentiality labels with Open and Confidential.
- [x] Explain the three confidence levels in the app by what a technician should do.
- [x] Let an operator serve several regions, with the region filter matching any of them. The ferry system now shows under Southeast and Southcentral.
- [x] Give sample sites more than one operator where their notes call for it. Seasonal detail stays in free text. Gravina gained a sample helicopter operator for winter, and Cooper Landing a road hauler.
- [x] Make the sample dates relative to today, so the demo always shows a mix of fresh and stale records. Keep the single 60-day cutoff until real records exist.
- [x] Add an "Open in maps" button to the site page that hands the coordinates to the phone's maps app. It sends only the coordinates, never the site's name, so a confidential site's name stays off the maps provider.

## Slice 3: trips on sample data

Built while looking for a crew, so the demo is worth showing. The trip model is a guess until a crew uses it.

Decided (defaults Claude applied when Andy said to keep going without approvals):

- A trip starts from a site page. "Plan a trip" opens a dates screen that starts at today and one day, with −/+ buttons instead of a calendar, and "Start trip" creates it.
- Site pages offer "Add to this trip" when a trip is under way or coming up: the one under way, else the soonest.
- Each trip picks the route that works for its dates and switches when the dates rule it out. Any route can be chosen by hand.
- The Prep tab is now Trips. Trip pages work offline: one prebuilt page reads the trip from this phone's storage by the id in its URL.
- Past trips are listed apart. Deleting a trip takes a second tap to confirm.
- Qualification ticks belong to the trip and aren't carried to the next one. Since then a technician can also keep a qualification record on the phone, and the trip shows each qualification against it (see below).
- A shared plan includes site names, and starts with "Confidential — share inside the crew only" when any site is confidential. Unlike "Open in maps", it doesn't withhold names; revisit if plans get forwarded to operators.

Live since 16 Nov 2026, first from the PR #8 branch at `64d56e9`, and from `main` at `0d2ee25` since 17 Nov. Checked live: every cached file loads, the new version takes over after a close and reopen, and a trip planned from Coldfoot started in two taps and was deleted. Also checked locally with two trips and with the server stopped. Not yet checked on a real phone.

- [x] A trip is one outing: a date range, one or more sites, the operators chosen to reach them, and its own copy of the checklists. The sites are a flat list, not an itinerary with legs.
- [x] Starting a trip takes two taps: pick a site, confirm the dates.
- [x] Every trip gets its own copy of every checklist, and a whole checklist can be skipped.
- [x] The Prep tab becomes the list of your trips. Checklists exist only inside a trip.
- [x] Checklists move into the record data, so a crew can have its own. The four invented lists stay in the sample set.
- [x] Qualifications become one named list that sites pick from, and a trip shows one de-duplicated list to tick off. The app only knows what a technician holds if they keep a qualification record on their phone.
- [x] Trips live on the technician's phone only.
- [x] A Share button sends the plan as text through the phone's share sheet, so it can be left with a dispatcher.
- [x] Structured seasonal routes: each way of reaching a site gets a mode, an operator and the months it works.
- [x] A trip's checklists follow its sites and season (live since 17 Nov 2026, from `main` at `95ba13f`). A list that no site or month on the trip needs starts skipped, says when it is needed, and can be included. It comes back by itself if a later site or date change needs it; nothing is skipped automatically after the trip is created, and a list skipped or included by hand is left alone. The sample PPE list is needed for a climb or cold-weather site or a trip touching Oct–Apr; the parts kit for radio, microwave and cell sites.
- [x] A technician can keep a qualification record on the phone (live since 17 Nov 2026, from `main` at `95ba13f`): which qualifications they hold and the month each expires. Each trip shows every qualification it needs as in the record, valid to a month, expiring before the trip ends, expired, or not recorded; expiring in the trip's last month counts as valid. The record is optional, asks for no name, never leaves the phone (not in feedback or shared plans), and is a prep reminder only. Claude chose to build this from Later, reversing the earlier "the app doesn't know who holds what".

## Slice 4: the whole trip, home base to home base

Done when a technician can take a trip to a site they typed in, such as one in Bethel, from start to finish with no signal after the first open: type in the site, build and ship the loadout, travel out, make sure it arrived, pack up and ship it home, travel home, and make sure it all came back.

All four pieces are live since 24 Nov 2026: typed-in sites, the loadout and its checklists, a trip page that follows the steps, and travel. As the built app with no server, a Bethel trip was walked from typing in the site to the arrival checklist, with a step undone and a reload; the departure, travel home and return steps were checked on the dev server and in tests. The whole trip still needs the phone test. Typed-in sites are live since 24 Nov 2026, deployed from the PR #17 branch at `6d311f8`. Checked with `bun run check`, in a phone-sized browser, and live (every new page loads and is in the offline cache). Not yet checked on a real phone.

The loadout and its four checklists are live since 24 Nov 2026, deployed from the PR #18 branch at `b034e81`. Checked with `bun run check`, in a phone-sized browser, and as the built app on a local Cloudflare server with the server stopped. Not yet checked on a real phone. Defaults Claude chose, not yet confirmed by Andy:

- Each checklist lists what was ticked at the checklist before it, plus anything added at it, which starts ticked. This extends the confirmed return-checklist rule to every checklist. If nothing was ticked at the one before, it lists what that one listed, and says so.
- One waybill number per shipment: at the pre-loadout and at each departure. It shows on the next arrival or return checklist.
- A new trip's loadout can start as a copy of the last trip's (no ticks or waybills), or from the tower site parts kit. The parts kit is still also a prep checklist; slice 5 decides what it becomes.
- Unticked items are counted as "not ticked yet", never called missing or lost.
- Dangerous goods are flagged per item. The app says to check with the operator, and doesn't state any operator's rules.

The trip page that follows the steps is live since 24 Nov 2026, deployed from the PR #19 branch at `08395db`. Checked with `bun run check`, in a phone-sized browser (a two-site trip marked through to Done, a reload halfway, first day moved into the past, sites reordered after marks), and as the built app on a local Cloudflare server with the server stopped. Not yet checked on a real phone. Defaults Claude chose, not yet confirmed by Andy:

- The first step is called "Get ready": the prep checklists and qualifications. Then "Build and ship the loadout", and for each site "Travel to …", the arrival checklist, "Do the job" and the departure pre-loadout, then "Travel home" and the return checklist.
- The step the technician is on is the first unmarked step after the furthest one marked, so a forgotten mark doesn't hold the trip back.
- Marking a step done never changes any ticks, and unticked items don't block it.
- When more than one trip is under way, the one with the latest first day is the one site pages and Home offer.

Travel is live since 24 Nov 2026, deployed from the PR #20 branch at `37c7d1d`. Checked with `bun run check`, in a phone-sized browser (a meeting place and lodging typed in with directions, a boarding pass image added, opened full screen, and deleted with its trip), and as the built app on a local Cloudflare server with the server stopped. Not yet checked on a real phone, including picking a photo from the library and the iPhone maps link for an address, which couldn't be confirmed from Apple's docs. Defaults Claude chose, not yet confirmed by Andy:

- A place is a name and one line of where it is: an address, or coordinates. "Use where I am now" fills in the phone's position, for sites with no address. Directions send only that line to the maps app, never a site's name.
- Each travel step to a site holds, in Andy's order: the operator with a Call button, where you meet the operator (not when driving yourself), the lodging, and directions to the site. Travel home holds where you meet the operator.
- Where a site is lives on the site, so every trip there has it. Meeting places and lodging live on the trip.
- Travel documents are images only, each one a boarding pass, shipping paper, permit or other. They are kept unscaled, so a barcode still scans, in the phone's file storage rather than with the trip, and a document shows as saved only once it reads back. They are deleted with their trip or site, and any left over are cleared when Trips opens.
- Removing a site from a trip now takes a second tap, since it takes the site's travel documents with it.

This is how the work is really done, as Andy described it on 24 Nov 2026. It is built to be used, not tried out on testers first, and it replaces slice 3's guess at the trip model.

The trip, in order:

1. Build the loadout on a pallet or in a tub, and ship it.
2. Travel to the site.
3. Make sure everything arrived.
4. Do the job.
5. Pack up the loadout and ship it, on to the next site or home.
6. Travel home.
7. Make sure everything made it back.

Steps 2 to 5 repeat for each site on the trip.

Decided (Andy):

- A trip is one outing from home base to one or more sites and back. The sites are worked one after another, which reverses slice 3's flat list.
- The loadout is the tools and parts for the trip. It usually ships apart from the technician, both ways, with an operator such as GoldStreak or NAC. This was "Shipped-gear tracking" under Not now.
- The loadout gets four kinds of checklist: the pre-loadout at home base, an arrival checklist and a departure pre-loadout at each site, and one return checklist back at home base.
- Travel is part of the trip. It gives directions to where the operator is met (an airport, a port, a dog sled team), then to the lodging (a hotel or cabin), then to the site.
- A technician can keep travel documents with a trip, such as a boarding pass image. The glossary and the ground rules were changed to allow it.
- A technician types in each site, and its lodging and the directions to its operator the same way. What they type stays on their phone. An operator's record fills in the directions where it has them.
- The records hold real, public operators and no sites ([ADR 0003](docs/adr/0003-real-operators-are-public-and-sites-stay-on-the-phone.md)).

Decided (Claude's defaults, confirmed by Andy on 24 Nov 2026):

- The invented sites go in this slice, and the invented operators are replaced in slice 5.
- A typed-in site can carry a kind and the qualifications it needs, picked from the maintainer's lists. Without them the parts list would start skipped on every trip, and the qualification flags would have nothing to check. Choosing a route by the month goes, since no site has recorded routes.
- With no crew, a Confidential site is one that stays with the technicians working it, and the technician sets that when typing the site in. A shared plan still warns when it names one.
- The saved list holds operators only.
- An operator's record never says which sites or clients the operator serves.
- A trip moves to its next step when the technician finishes one, not when the date changes. A weather hold no longer marks a trip done.
- The return checklist covers whatever was ticked at the last departure pre-loadout. Items aren't marked used, left or lost.
- A shipment's waybill number is typed in by hand. The app never talks to the operator's tracking.
- Travel holds directions and travel documents, not flight numbers or times. The boarding pass carries those.
- Travel documents are deleted with the trip, and are never put in a shared plan or a feedback note.
- An item that must be declared as dangerous goods, such as fuel or bear spray, is flagged at the pre-loadout.

To build:

- [x] A technician can type in a site, and set its kind, qualifications and confidentiality.
- [x] The invented sites go. A typed-in site carries its own kind and qualifications, so the checklists and qualification flags still have something to read.
- [x] Trips already on a phone aren't silently lost when the invented sites go. The Trips screen says how many can no longer be opened, and offers to clear them.
- [x] Wording that speaks of a crew or of sample data is reworded. A technician's own plan is never stamped "Sample data", and the "Sample" badge shows only on screens with the invented operators. The checklists' own wording waits on slice 5.
- [x] A feedback note never carries a site.
- [x] A trip holds a loadout, built on pallets or in tubs.
- [x] The pre-loadout, arrival checklist, departure pre-loadout and return checklist each run over the loadout.
- [x] The trip page follows the trip in order and shows the step the technician is on.
- [x] Travel out, between sites and home gives directions and holds travel documents.
- [x] Each site on a trip has its lodging, with directions.

## Slice 5: real operators

Done when no invented record is left: every operator in the app is a real business with a source, a verified date and a confidence, and nothing is labelled "Sample".

Decided (Andy):

- The records are real, public operators, and Andy keeps them current as the maintainer ([ADR 0003](docs/adr/0003-real-operators-are-public-and-sites-stay-on-the-phone.md)).
- The first records are the 18 operators that serve the ten busiest Alaska hubs you can't drive to from Anchorage, researched by Claude on 24 and 25 Nov 2026 ([docs/research](docs/research/README.md)). They replace the nine invented ones.
- The regions are the four State transportation plan areas those hubs fall in: Southeast, Southwest, Yukon-Kuskokwim Delta and Northwest.

Defaults Claude chose, not yet confirmed by Andy:

- Every record is medium confidence, since it was read on the operator's own pages: confirm by phone before committing travel or money. High would be a record the maintainer has confirmed by phone, and low a lead.
- Every record's verified date is 24 Nov 2026, the oldest day any of its facts was read, so all 18 go stale together after 23 Jan 2027.
- Hubs you can drive to from Anchorage were left out, though Fairbanks would rank first and Deadhorse fourth. Wright Air Service is in for Utqiaġvik, so its one office is in Fairbanks.
- A record holds only what was re-read by hand in a browser: contacts, addresses, hours, services and the villages each office lists. Schedules, weight limits and dangerous-goods rules stay out until they are re-read; Alaska Seaplanes' are in because they were.
- A record lists the operator's offices: each place it names at a hub, with an address only where it publishes a street address. On a trip, where you meet the operator can be filled in from one of its offices with an address, while nothing has been typed there.
- Where an operator's own pages disagree, the record says so: the ferry's Ketchikan terminal number, Alaska Seaplanes' Sunday cargo hours, and Alaska Marine Lines' Naknek address.
- Choosing a different operator for a site leaves where you meet the operator as it was, since the technician may have typed it. Clearing both lines brings the office list back.

To decide:

- What the invented checklists and qualification list become. They are the maintainer's but aren't records, and once "Sample" comes off they read as real. They still speak of a crew ("Second crew member confirmed", a Crew category).

To build:

- [x] Replace the invented operators with real ones.
- [x] An operator's record says where the operator is met, so a trip can give directions there.
- [x] Take "Sample" off the header, the shared plan and the README.

## Shelved: one crew's real data behind sign-in

Shelved on 24 Nov 2026, when FieldOps became an app for anyone. Kept in case a crew asks for a private copy of its own.

- [ ] Choose how the crew signs in. [ADR 0002](docs/adr/0002-sign-in-is-cloudflare-access.md) proposes Cloudflare Access with an email allow-list; the alternative is per-phone invite codes.
- [ ] A second deployment for the crew, behind that sign-in.
- [ ] Real records, checklists included, live in one private file in Cloudflare storage. The maintainer keeps it; the file is checked against the record format and uploaded with a command.
- [ ] One source, one verified date and one confidence per record.
- [ ] Every signed-in technician sees every record. Confidentiality is a handling instruction, not an access control.
- [ ] The app wipes its cached records after a set number of days without confirming sign-in. 30 days is a placeholder; the number must exceed the crew's longest stretch without signal.
- [ ] Set the region list to where the crew works.

## Later

Both are shelved with the crew work above.

- Crew reports: crew members send changes to records, and the maintainer approves them.
- Sharing trips with the crew through a backend.

## Not now

- Live weather and hazards inside the app.
- An in-app map or offline map tiles.
- An editing screen for a dispatcher.
- Visibility per client or per technician.
- Tracking the crew's qualifications centrally.
- A source and date for each fact inside a record.
- A native app or an app-store wrapper.
