<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use the terms in [CONTEXT.md](CONTEXT.md) in code, UI copy and docs, and steer clear of the alternatives it lists.
- Check [roadmap.md](roadmap.md) for scope and order before starting work, and [docs/adr](docs/adr) for decisions whose reasons matter.
- Keep all primary mobile controls at least 56px tall, with 64px preferred, because FieldOps is operated outdoors with gloves. A primary control is any control in the main flow; only a text link inside a sentence is exempt.
- Edit code in this repo rather than in Lovable, and deploy to Cloudflare from Andy's PC rather than from GitHub Actions.
- Run `bun run check` before opening a pull request. The Checks workflow runs the same steps on every pull request, and `main` requires it to pass.
- Turn on auto-merge for a pull request only once its work is complete and checked, because it merges itself as soon as Checks pass.
