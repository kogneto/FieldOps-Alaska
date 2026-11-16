---
status: proposed
---

# Sign-in is Cloudflare Access, not app code

The crew deployment will hold real records, some of them client-confidential, for one small crew. The proposal is that Cloudflare Access handles sign-in in front of that deployment (an email allow-list and a one-time code by email), so the app contains no login screens, accounts or user table. For a crew this size there is then nothing to build or secure; the cost is being tied to Cloudflare as the host.

This stays proposed until a crew signs on. The people likely to test FieldOps may not want to hand over an email, and there is no crew yet to ask. A crew sharing its employer's data may well expect to sign in with a work email, but who the crew is will settle it. The alternative is per-phone invite codes: no email, and one code can be cancelled at a time, at the cost of writing sign-in into the app.

## Consequences

These hold whichever sign-in is chosen.

- The public demo is a separate deployment of the same code, on sample data with no sign-in, so a bug can't put real records on the public URL.
- Everyone who can sign in sees every record. A site's confidentiality is a handling instruction, not an access control.
- Technicians must re-confirm online when a session expires, so sessions are set long.
- Records are cached on the phone, so removing someone's access doesn't remove their copy. The app wipes its cached records after a set number of days without confirming sign-in, and that number must exceed the crew's longest stretch without signal.
