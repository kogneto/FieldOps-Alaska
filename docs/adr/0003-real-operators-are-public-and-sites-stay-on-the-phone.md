---
status: accepted
---

# Real operators are public and live in the repo; sites stay on the phone

FieldOps became an app for anyone on 24 Nov 2026, so there is no crew, no sign-in and no private source for records to load from. The records are therefore real, public operators, committed to this repo and kept current by the maintainer, because an operator publishes its own name, phone number and schedule. Sites are the opposite: what a site is and who its client is can be confidential, so no site is ever a record. A technician types in their own sites, and those stay on their phone.

This narrows [ADR 0001](0001-real-data-stays-out-of-the-repo.md). Its reason still holds for sites: anything committed to a public repo can't be reliably taken back.

## Considered options

- **Keep the invented sample set as labelled examples.** Rejected: made-up operators with 555 numbers have no place in an app meant for real trips.
- **Drop the directory and keep only trips.** Rejected: it throws away search, the saved list and the operator pages, and the confidence and stale checks were built for real records.

## Consequences

- Every operator record comes from a public source and carries that source, a verified date and a confidence.
- The maintainer takes on keeping the records current. A record that isn't verified again shows as stale after 60 days.
- An operator record never says which sites or clients the operator serves.
- Nothing a technician types in is sent anywhere by the app. A feedback note never carries a site, and a trip plan leaves the phone only when the technician shares it.
