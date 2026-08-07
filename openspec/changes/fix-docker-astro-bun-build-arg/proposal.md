## Why

The Docker images published to Docker Hub (`anidev-v2:latest` and version/sha tags) are built without the `ASTRO_ADAPTER=bun` build-arg, so Astro compiles with the default Vercel/serverless adapter and never emits `dist/server/entry.mjs`. The runtime image's `CMD ["bun", "run", "dist/server/entry.mjs"]` (Dockerfile:45) therefore fails at startup.

## What Changes

- Add `build-args: | ASTRO_ADAPTER=bun` to the "Build and push Docker image" step in `.github/workflows/release.yml`.
- Add the same `build-args` block to the identical step in `.github/workflows/deploy.yml`, which shares the same bug.
- The Dockerfile already declares `ARG ASTRO_ADAPTER` / `ENV ASTRO_ADAPTER=$ASTRO_ADAPTER` (lines 11-12), so no Dockerfile change is needed.
- No application code, runtime behavior, or public spec changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Pure CI/CD tooling fix — declared via `skip_specs: true` in `.openspec.yaml`.

## Impact

- `.github/workflows/release.yml` — Docker build step gains the `ASTRO_ADAPTER=bun` build-arg.
- `.github/workflows/deploy.yml` — same change for parity.
- Docker image builds now emit a standalone Bun server (`dist/server/entry.mjs`), which is what the runtime `CMD` expects.
- Rebuilding requires a new release tag (`v*`) for `release.yml`, or a push to `master` for `deploy.yml`.
