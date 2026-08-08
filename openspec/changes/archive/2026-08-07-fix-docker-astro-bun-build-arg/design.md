## Context

See proposal.md - Why. The Dockerfile already consumes `ASTRO_ADAPTER` via `ARG ASTRO_ADAPTER` / `ENV ASTRO_ADAPTER=$ASTRO_ADAPTER` (Dockerfile:11-12), and `astro.config.mjs:19` switches to the `@nurodev/astro-bun` adapter when `ASTRO_ADAPTER === 'bun'`, producing `dist/server/entry.mjs`. The gap is purely that the two Docker-publishing workflows never pass the build-arg, so the Vercel adapter default is used.

## Goals / Non-Goals

**Goals:**

- Make both Docker publishing workflows build the image with `ASTRO_ADAPTER=bun`.
- Produce a runtime image whose `CMD ["bun", "run", "dist/server/entry.mjs"]` succeeds.

**Non-Goals:**

- No Dockerfile changes — the ARG/ENV plumbing already exists.
- No application code or runtime behavior changes.
- No changes to the Vercel adapter path used by CI serverless builds.

## Decisions

**Pass the build-arg in both `release.yml` and `deploy.yml`.**
The same bug exists in two files; fixing only `release.yml` would leave `deploy.yml` publishing the broken image on every `master` push.

Alternative considered: hardcoding `ASTRO_ADAPTER=bun` in `astro.config.mjs` — rejected, because CI's Vercel adapter build (and the `bun run build` used by `check`/`build` gates) depends on the default, and the config comment explicitly documents the env-switch contract.

**Use the `build-args: |` YAML block syntax**, matching how `tags:` is expressed in the same step for consistency. No secrets involved — `ASTRO_ADAPTER` is a build-time constant.

## Risks / Trade-offs

- A future contributor could re-introduce the gap if a new Docker-building workflow is added → the change keeps the two workflows consistent and the Dockerfile comment already documents the `ASTRO_ADAPTER` contract; a build test could be added later but is out of scope here.
- `bun run build` runs with `NODE_ENV=production` and placeholder env in the build stage; this already works for the Vercel path, and the Bun adapter build is exercised locally by the same script, so no new build-stage risk is introduced.
