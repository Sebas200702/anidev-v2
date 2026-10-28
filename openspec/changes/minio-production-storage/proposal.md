## Why

Profile avatar/banner shipped in `v0.18.0` with provider-neutral storage: `@lib/storage` talks to any S3-compatible backend and nothing is hard-coded to a vendor, but the production *choice* was left open.

Production is the maintainer's own VPS (Dokploy + Traefik), not a serverless edge. Picking a managed object store there would add an account, a payment method, a token and a network hop to a stack that is deliberately self-hosted — and no Cloudflare R2 account exists today, so it would not remove an existing dependency but create one.

**MinIO self-hosted is the chosen backend**: S3-compatible, no external dependency, disk/backups/TLS stay under our control. Its one real caveat is already handled — upstream stopped publishing Community Edition images in October 2025 and the repository is archived, so the image is built from pinned source (`docker/minio/Dockerfile`).

The local compose bundles MinIO with the dev infra (postgres/dragonfly/rustrak) behind `--profile storage`. On the VPS those already run as *independent* Dokploy services, so the storage stack has to be deployable on its own — otherwise bringing it up would collide on ports 5432/6379/8080 with services that are not ours to restart.

## What Changes

- New **`docker-compose.storage.yml`**: the single source of truth for `minio` + `minio-init` + the `minio_data` volume, still gated behind `profiles: ['storage']`.
- `docker-compose.yml` **`include`s** that file instead of defining the block itself: no duplicated YAML, and the documented local UX is unchanged (`docker compose --profile storage up -d --build`).
- `AGENTS.md`: record MinIO as the production storage backend (with R2 documented as the escape hatch), plus the production deploy path and the `media.anidev.app` wiring.
- `.env.example`: mark the MinIO route as the one production uses; the R2 route stays documented as a migration path (six env vars, zero code changes).

## Capabilities

### New Capabilities
None — deployment config and documentation only.

### Modified Capabilities
None — no requirement-level change to `openspec/specs/`.

> No runtime behavior delta (application code, API, schema and CI are untouched), so the change declares `skip_specs: true` (see `.openspec.yaml`) instead of inventing a requirement.

## Impact

- **Deployment**: new standalone storage compose; `docker-compose.yml` loses its inline `minio`/`minio-init`/`minio_data` block in favour of `include`.
- **Docs**: `AGENTS.md` (Local stack, Environment), `.env.example` (storage routes).
- **No application code, API, schema or CI change** — CI builds MinIO with a direct `docker build -f docker/minio/Dockerfile`, not through compose, and no script shells out to `docker compose`.
- **Verified**: `include` preserves `profiles` (main compose without the profile resolves only `postgres`; with it, `minio`/`minio-init` too) and merges top-level `volumes` (`minio_data` resolves to `<project>_minio_data`).
- **Production wiring** (performed on the VPS, not in this change): a Dokploy compose sourced from GitHub running `docker-compose.storage.yml` with `COMPOSE_PROFILES=storage` in its environment, the `S3_*` app env pointing at `http://minio:9000` / `https://media.anidev.app/<bucket>`, and a Traefik domain for that host.
