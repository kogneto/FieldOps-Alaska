# Roadmap

FieldOps Alaska is aimed at one real crew of telecom technicians. No crew is lined up yet, so for now testers try the public demo: no sign-in, and nothing asked of them. Until a crew exists, the design assumes fewer than ten technicians on a mix of iPhone and Android, working the three pilot regions.

Vocabulary is in [CONTEXT.md](CONTEXT.md). Decisions that need their reasons kept are in [docs/adr](docs/adr).

## Ground rules

- The code is edited here, not in Lovable. Commits still sync to Lovable, so pushed history is never rewritten.
- Cloudflare hosts it. Deployments run from Andy's PC with a command, not from GitHub Actions.
- Real data never enters this repo ([ADR 0001](docs/adr/0001-real-data-stays-out-of-the-repo.md)). The committed records stay an invented sample set.
- Nothing in the public demo asks a tester who they are.
- Logic gets automated tests: the record-format check, staleness, the trip roll-up. Screens are checked by hand on a phone.

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

- [ ] A feedback note can be sent from any screen. On a site or operator page it is tied to that record.
- [ ] Rename "Report a change" to "Send feedback"; it opens the same note.
- [ ] Notes wait on the phone until there is signal, then send.
- [ ] Only the note's text, the screen or record, the app version and the time are stored. No name or email is asked for or kept.
- [ ] The endpoint is public, so it caps note length and how often notes are accepted.
- [ ] Watch testers use it outdoors with gloves on, alongside the notes.

## Tidy-ups

Small, independent of the slices.

- [ ] Raise the region filter chips and the back links to 56px.
- [ ] Rename "Credentials to carry" to "Qualifications", and say "access secrets" in the disclaimer.
- [ ] Replace the three confidentiality labels with Open and Confidential.
- [ ] Explain the three confidence levels in the app by what a technician should do.
- [ ] Let an operator serve several regions, with the region filter matching any of them. The ferry system is statewide and is hidden outside Southeast today.
- [ ] Give sample sites more than one operator where their notes call for it. Seasonal detail stays in free text.
- [ ] Make the sample dates relative to today, so the demo always shows a mix of fresh and stale records. Keep the single 60-day cutoff until real records exist.
- [ ] Add an "Open in maps" button to the site page that hands the coordinates to the phone's maps app.

## Slice 3: trips on sample data

Built while looking for a crew, so the demo is worth showing. The trip model is a guess until a crew uses it.

- [ ] A trip is one outing: a date range, one or more sites, the operators chosen to reach them, and its own copy of the checklists. The sites are a flat list, not an itinerary with legs.
- [ ] Starting a trip takes two taps: pick a site, confirm the dates.
- [ ] Every trip gets its own copy of every checklist, and a whole checklist can be skipped.
- [ ] The Prep tab becomes the list of your trips. Checklists exist only inside a trip.
- [ ] Checklists move into the record data, so a crew can have its own. The four invented lists stay in the sample set.
- [ ] Qualifications become one named list that sites pick from, and a trip shows one de-duplicated list to tick off. The app doesn't know who holds what.
- [ ] Trips live on the technician's phone only.
- [ ] A Share button sends the plan as text through the phone's share sheet, so it can be left with a dispatcher.
- [ ] Structured seasonal routes: each way of reaching a site gets a mode, an operator and the months it works.

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
- Each technician records their own qualifications and expiry dates on their phone, and a trip flags gaps.
- Choosing a trip's checklists by the kind of site and the season.
- Checks on GitHub for every push, once a second person contributes.

## Not now

- Shipped-gear tracking.
- Live weather and hazards inside the app.
- An in-app map or offline map tiles.
- An editing screen for a dispatcher.
- Visibility per client or per technician.
- Tracking the crew's qualifications centrally.
- A source and date for each fact inside a record.
- A native app or an app-store wrapper.
