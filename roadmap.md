# Roadmap

FieldOps Alaska is aimed at one real crew of telecom technicians. No crew is lined up yet, so for now testers try the public demo: no sign-in, and nothing asked of them. Until a crew exists, the design assumes fewer than ten technicians on a mix of iPhone and Android, working the three pilot regions.

Vocabulary is in [CONTEXT.md](CONTEXT.md). Decisions that need their reasons kept are in [docs/adr](docs/adr).

## Ground rules

- The code is edited here, not in Lovable. Commits still sync to Lovable, so pushed history is never rewritten.
- Cloudflare hosts it. Deployments run from Andy's PC with a command, not from GitHub Actions.
- Real data never enters this repo ([ADR 0001](docs/adr/0001-real-data-stays-out-of-the-repo.md)). The committed records stay an invented sample set.
- Nothing in the public demo asks a tester who they are.
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
- [x] A trip's checklists follow its sites and season (built and checked locally, not deployed yet). A list that no site or month on the trip needs starts skipped, says when it is needed, and can be included. It comes back by itself if a later site or date change needs it; nothing is skipped automatically after the trip is created, and a list skipped or included by hand is left alone. The sample PPE list is needed for a climb or cold-weather site or a trip touching Oct–Apr; the parts kit for radio, microwave and cell sites.
- [x] A technician can keep a qualification record on the phone (built and checked locally, not deployed yet): which qualifications they hold and the month each expires. Each trip shows every qualification it needs as in the record, valid to a month, expiring before the trip ends, expired, or not recorded; expiring in the trip's last month counts as valid. The record is optional, asks for no name, never leaves the phone (not in feedback or shared plans), and is a prep reminder only. Claude chose to build this from Later, reversing the earlier "the app doesn't know who holds what".

## Parked: real data behind sign-in

Waits until a crew signs on.

- [ ] Choose how the crew signs in. [ADR 0002](docs/adr/0002-sign-in-is-cloudflare-access.md) proposes Cloudflare Access with an email allow-list; the alternative is per-phone invite codes.
- [ ] A second deployment for the crew, behind that sign-in.
- [ ] Real records, checklists included, live in one private file in Cloudflare storage. The maintainer keeps it; the file is checked against the record format and uploaded with a command.
- [ ] One source, one verified date and one confidence per record.
- [ ] Every signed-in technician sees every record. Confidentiality is a handling instruction, not an access control.
- [ ] The app wipes its cached records after a set number of days without confirming sign-in. 30 days is a placeholder; the number must exceed the crew's longest stretch without signal.
- [ ] Set the region list to where the crew works.

## Later

- Crew reports: crew members send changes to records, and the maintainer approves them.
- Sharing trips with the crew through a backend.

## Not now

- Shipped-gear tracking.
- Live weather and hazards inside the app.
- An in-app map or offline map tiles.
- An editing screen for a dispatcher.
- Visibility per client or per technician.
- Tracking the crew's qualifications centrally.
- A source and date for each fact inside a record.
- A native app or an app-store wrapper.
