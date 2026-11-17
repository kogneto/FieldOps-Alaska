# The checks a pull request runs (typecheck, lint, formatting, tests, build), run in Linux on this
# PC instead of on GitHub's machines. Run it with `bun run check:docker`; see ops/checks/README.md.
#
# The source is copied in rather than mounted, so the Windows node_modules (esbuild, rolldown and
# workerd are built per platform) never reaches the container: `bun install` installs Linux ones
# from the lockfile. Node is the base because Vitest and Prettier run on Node; Bun comes from npm
# at the same version as on the PC and in the Checks workflow.
FROM node:24-bookworm-slim

RUN npm install -g bun@1.4.4 --no-audit --no-fund

WORKDIR /app

# Dependencies first, so a change to the source alone reuses this layer.
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run typecheck \
 && bun run lint \
 && bun run format:check \
 && bun run test \
 && bun run build
