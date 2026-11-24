# Real data stays out of the repo

_Narrowed by [ADR 0003](0003-real-operators-are-public-and-sites-stay-on-the-phone.md): this now holds for sites only. Real, public operators are committed, and there is no sign-in._

The repo is public and every record currently lives in `src/lib/data.ts`, but real site records include client-confidential ones, and anything committed to a public repo can't be reliably taken back. Real data therefore never enters this repo: the app loads it from a private source after sign-in, and the committed data stays an invented sample set that doubles as the public demo.

## Considered options

- **Make the repo private and commit real data.** Rejected: it ends the public demo and still puts client data in git history, where every clone keeps it.
- **Keep real data in a separate private copy of the repo.** Rejected: two repos to keep in step, and the data is still in git history.
