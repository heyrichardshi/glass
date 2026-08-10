# Build context is the repository ROOT, not server/, because the image needs the
# lockfile, the workspace manifests and the @glass/types package:
#
#   docker build -f server/Dockerfile -t glass-server .
#
# The image contains @glass/server and its workspace dependency @glass/types.
# The client is not included; it builds and deploys separately.
#
# PLATFORM: the deploy target is an Intel Mac, so released images must be
# linux/amd64. Building on an Apple Silicon machine produces linux/arm64, which
# will not run there. CI runners are amd64 so the published image is correct by
# default; for a local build intended for the host, pass --platform linux/amd64
# (slow, emulated). Local builds for testing on the dev machine should stay
# native.

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --- dependencies ------------------------------------------------------------
# Manifests only, so this layer stays cached until the lockfile changes.
# Every workspace manifest is copied, including the client's: --frozen-lockfile
# validates the lockfile against all of them and fails if one is missing.
#
# --ignore-scripts is required, not just tidy: @glass/types has a `prepare: tsc`
# script that pnpm runs on install, and at this point only its package.json has
# been copied — no tsconfig, no sources — so tsc fails. The build stage compiles
# types explicitly, which is what that script was for.
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY types/package.json types/
COPY server/package.json server/
COPY client/package.json client/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --filter "@glass/server..."

# --- build -------------------------------------------------------------------
# Filters are run from the workspace root rather than with `-C`, so corepack
# always resolves the pnpm version from the root manifest.
FROM deps AS build
COPY types/ types/
COPY server/ server/
RUN pnpm --filter @glass/types build \
 && pnpm --filter @glass/server build

# --- runtime -----------------------------------------------------------------
# Production dependencies and compiled output only: no TypeScript, no sources,
# no dev tooling. --ignore-scripts because nothing here needs a postinstall and
# the runtime image has no compiler to run one with.
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=7070

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY types/package.json types/
COPY server/package.json server/
COPY client/package.json client/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts --filter "@glass/server..."

COPY --from=build /app/types/dist types/dist
COPY --from=build /app/server/dist server/dist

USER node
EXPOSE 7070
CMD ["node", "server/dist/index.js"]
