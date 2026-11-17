# Checks in Docker

`bun run check:docker` runs the same checks as the Checks workflow (typecheck, lint, formatting, tests, build) in Linux, in Docker on this PC. Every pull request also runs them on GitHub's machines (`.github/workflows/checks.yml`); this is the way to run them in Linux before pushing. `bun run check` runs them directly on Windows, which is faster.

- It needs Docker Desktop running.
- The source is copied into the build, not mounted (see `.dockerignore`). `bun install` installs Linux packages from `bun.lock`, so a lockfile that only works on Windows fails here.
- Nothing is kept: the result is cached by Docker, and no image is tagged. The first run downloads the Node image and installs packages; later runs reuse that layer while `package.json`, `bun.lock` and `bunfig.toml` are unchanged.
- A failing check fails the command and prints the error.
