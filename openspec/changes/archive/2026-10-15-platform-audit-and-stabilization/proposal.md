# Proposal

## Why

Before continuing with the roadmap features, the platform needed a full evidence-based audit (code, security, data, performance, dependencies, bundle, observability) — and the previous audit's corrective change (`foundation-hardening-and-media-streaming`, 0/31 tasks) had never been implemented, so its critical findings were still live in `master`. This audit re-verified every one of them against the real code, the real database, and a running production artifact, and discovered additional defects. Verified highlights:

- **Privacy leak (P1, reproduced live)**: anonymous `GET /api/user/:userId` returns `preferences` and `history.watchedAnimes` — sections the domain's own policies declare owner-only (`canViewUserPreferences`/`canViewUserHistory` are dead code). An anonymous curl against the built artifact returned the full private payload.
- **Zero rate limiting (P1)**: no limiter exists anywhere; `/api/auth/login` accepts unlimited brute force and Better Auth's built-in limiter is not mounted (no `auth.handler` route).
- **Reflected XSS on public `/showcase` (P1, reproduced live)**: URL controls flow unvalidated into `href`; `?retryHref=javascript:...` renders an executable link, and the CSP allows `'unsafe-inline'`.
- **Media pipeline (P1)**: no HTTP `Range`/`206`, full-file buffering into RAM and unbounded `tmpdir()` writes, no timeout/SSRF guard/byte cap on upstream fetches.
- **Unbounded infrastructure (P2)**: `pg.Pool` without `max`/timeouts; media/music FK columns have no indexes (verified with `\di`); no rate/size limits on expensive endpoints.
- **Production-data bug (P2, reproduced live)**: a profile row with `gender = NULL` yields `500 RESPONSE_VALIDATION_ERROR`, and the invalid payload is cached, keeping the 500 alive for the TTL.
- **Shell ships framework JS on every route (P2)**: baseline client JS is ~113 KB gzip (`client.*` React DOM ≈ 58 KB + Sentry page SDK ≈ 45 KB) because the shell hydrates a 5-button toolbar island and injects the monitoring SDK on every page.
- **Dependency risk (P2)**: `bun audit` reports 70 high/critical advisories (6 critical) — `astro@6.1.2` (AVIF RCE latent, XSS fixes pending), `drizzle-orm`, `better-auth`, `@astrojs/vercel` upgrades available; the Bun self-host adapter (`@nurodev/astro-bun`, peer `astro ^5.1.1`) breaks under `astro@7.3.8`, which blocks the framework upgrade and must be decided explicitly.
- **Environment integrity**: local `node_modules` had drifted to `astro@7.3.8` while `bun.lock` pins `6.1.2`; the drifted tree produced a self-host artifact that crashes at boot (`getAdapterLogger is not a function`). CI stays green only because it installs frozen. Reproducibility is now a tracked requirement.
- **OpenSpec drift**: two merged changes still show unchecked release/verification tasks, and shipped capabilities (music, media proxy, search history) have no committed specs.

Per owner decision, the stalled `foundation-hardening-and-media-streaming` change has been **consolidated into this change**: its delta specs and remaining tasks moved here and were extended with the new findings, so a single authoritative board drives stabilization.

## What Changes

Workstreams (all TDD-first where behavior changes):

1. **OpenSpec sync & close-out** — archive the two merged changes once their last boxes close (missing tests land here), commit specs for shipped-but-unspecced capabilities (music, media proxy, search history), and keep the findings register traceable to tasks.
2. **Security & privacy (P1)** — owner-only projection for profile private sections (cache-safe); profile read contract tolerating nullable/malformed columns with no invalid-payload caching; Dragonfly-backed rate limiting for `/api/*`, `/media/*`, and stricter credential-abuse limits on auth; same-origin validation for navigable URL inputs; auth surface hardening (no account enumeration, no session token in response bodies, no provider payloads in `meta.details`); bounded request bodies; HTTP security headers emitted as real headers (nosniff, frame-ancestors, HSTS) instead of a meta-only CSP.
3. **Media pipeline (P1/P2)** — HTTP `Range` (`206`) zero-buffer streaming, SSRF/timeout guards, redirect revalidation, byte budget, MIME allowlist with `nosniff`; version/resolution-aware cache keys with single serialization; bounded `w`; optimized images on a bounded disk LRU cache with immutable headers; unsupported entities as 4xx.
4. **Database & performance (P2)** — bounded `pg.Pool`; B-tree/GIN indexes, `profile.user_id` unique, cascades; set-based carousel eligibility + batched media; atomic search-history cap; typed repository errors (four missing `await`s); parallel list/count + synonym search; pagination bounds; honest stale-flag propagation.
5. **Observability & operations (P2)** — request correlation IDs, one structured access line per request, PII/secret redaction, measurable availability/latency signals, versioned alert rules and runbooks (backup/restore drill, rollback).
6. **Bundle, dependencies & build hygiene (P2/P3)** — zero-JS shell (vanilla toolbar script), recorded per-route client budget verified in CI, monitoring SDK strategy, dependency upgrades with an explicit decision for the Bun self-host adapter, `bun audit` gate with a justified allowlist, dev-only packages out of runtime deps and image, toolchain pinning aligned (CI/Docker/engines), stale scripts/secrets/CI envs cleaned.
7. **Verification & release** — coverage thresholds enforced, e2e authorization assertions for the fixed P1s, full local gate + real-stack layers, release on the feature branch, archive with delta sync.

**BREAKING** (explicit, documented): login/register responses no longer include the session `token` field; duplicate-email registration returns a neutral response; `page` beyond the configured maximum and `w` outside the allowlisted range are now `400`s.

## Capabilities

### New Capabilities

- `infrastructure/security-middleware`: request IDs, HTTP security headers (real headers), rate limiting (API/media/credential abuse), bounded request bodies, same-origin navigable-URL policy, zero-DB session skipping on asset routes.
- `media/range-streaming-and-cache`: `Range`/`206` zero-buffer streaming, version/resolution cache keys, SSRF/timeout guards, bounded disk image cache with immutable headers.
- `media/proxy-and-optimization`: client-error semantics for unsupported entities, bounded optimization parameters, MIME-restricted raw responses with `nosniff`, byte budgets, remote transform refusal.
- `user/profile-privacy`: owner-only projection across cached reads, tolerant read contract for every persisted row shape, cache that never stores invalid payloads nor widens visibility.
- `auth/credential-flow-hardening`: neutral registration, tokens only in HttpOnly cookies, error envelopes without provider internals.
- `infrastructure/observability-ops`: correlated structured access logs, redaction, measurable availability/latency, versioned alerts and runbooks.
- `infrastructure/build-hygiene`: frozen-lockfile reproducibility, advisory gate with allowlist, runtime-only production deps, evidence-based dependency removals.
- `infrastructure/platform-audit`: traceable high findings, truthful OpenSpec state, committed specs for shipped capabilities, enforced verification gates.
- `frontend/rendering-contract`: zero-framework-JS shell, measured baseline client budget, exactly one `h1` per document.
- `music/catalog`: validated public music list/detail surface with stale-fallback caching.
- `search/history`: owner-scoped, bounded, best-effort search history.

### Modified Capabilities

- `infrastructure/database`: bounded pool, indexes/uniqueness/cascades, atomic multi-statement invariants, set-based and bounded hot-path reads.
- `infrastructure/error-handling`: uniform envelope (from the superseded change) plus typed repository error wrapping.
- `infrastructure/cache`: canonical keys, no contract-invalid payloads, non-colliding namespaces.
- `infrastructure/resilience`: stale flags that reflect payload provenance.
- `anime/advanced-search`: synonym + parallel queries (from the superseded change) plus bounded pagination.
- `frontend/error-pages`: home-page 503 degradation (from the superseded change).

## Impact

- **Auth & user**: `src/domains/auth/**`, `src/pages/api/auth/*`, `src/domains/user/**`, `src/pages/api/user/*`, `src/lib/auth/server.ts`.
- **Media**: `src/domains/media/**`, `src/pages/media/[...path].ts`, `src/shared/utils/image/**`, `src/styles/global.css` (none).
- **DB & repos**: `src/lib/db/client.ts`, `src/lib/db/schemas/*.ts`, new migration in `drizzle/`, repositories in `anime/`, `music/`, `search/`.
- **Middleware & shared**: `src/middleware/**`, `src/shared/http/**`, `src/shared/errors/**`, `src/shared/components/**` (showcase/header), `src/shared/layouts/base-layout.astro`.
- **Observability**: `src/lib/monitoring/**`, `src/shared/utils/logger-util.ts`, new ops docs.
- **Tooling & CI**: `package.json`, `astro.config.mjs`, `Dockerfile`, `.github/workflows/*`, `.env.local.example`, `vitest.config.ts`, `playwright.config.ts`, `e2e/**`, `biome.json`, `ROADMAP.md`, `ARCHITECTURE.md`.
- **OpenSpec**: supersedes `foundation-hardening-and-media-streaming` (deltas and tasks moved here); closes out `home-shell-and-featured-carousel` and `component-showcase`.
