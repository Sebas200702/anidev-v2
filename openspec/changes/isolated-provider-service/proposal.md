# Proposal

## Why

Provider code must never run inside the main AniDev VPS process nor inside users' browsers: in-process execution risks RCE on the 8 GB VPS, and browser execution adds friction and trust warnings for users. An isolated, operator-configured provider service solves both without building a custom sandbox.

## What Changes

- Define a single static `StreamSourceProvider` contract (TypeScript + Zod) owned by the repo; the public repo ships no concrete third-party provider implementation.
- Add an isolated provider service as a separate deployment (container or isolates platform) that executes first-party providers and returns only validated `NormalizedStreamSource[]` data.
- Add `local` / `remote` / `cli` executors in the app so ingestion resolves sources via the isolated service over HMAC-signed HTTP, while request-time routes only read `episode_source` from PostgreSQL.
- Enforce operator-owned registry configuration outside the repo (`PROVIDER_PATHS` / `registry.json`, git-ignored) and network guards (HTTPS-only, SSRF denylist, timeout, byte cap) on all provider fetches.

## Capabilities

### New Capabilities

- `watch/provider-contract`: Static provider interface, registry semantics, and validated source output shape.
- `watch/provider-isolation`: Isolated execution boundary, signed invocation, domain allowlist, and resource limits for the provider service.
- `infrastructure/ingestion-boundary`: Guarantee that the main app never executes provider code and ingestion only writes validated rows to `episode_source`.

### Modified Capabilities

<!-- None: this change introduces new behavior only. -->

## Impact

- **App repo (`anidev-v2`)**: `src/domains/watch/providers/` (`contract.ts`, `executors/`, `README.md`), ingestion client, `episode_source` reader path unchanged.
- **New service repo/volume**: `anidev-provider-service/` (HTTP API, provider loader, registry config), deployed separately from the main VPS app.
- **Config/ops**: `PROVIDER_PATHS`, `PROVIDER_SERVICE_URL`, `PROVIDER_SERVICE_SECRET`, `registry.json` (git-ignored), limited Postgres credential scoped to `episode_source`.
