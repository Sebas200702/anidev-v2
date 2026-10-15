# Design — Platform audit & stabilization

> **Audit date:** 2026-10-14 · **Repo state:** `master` @ `4133f3c`, clean tree.
> **Method:** three specialized audits run in parallel (security, code correctness,
> performance/DB/dependencies/bundle) + first-hand verification by the lead auditor:
> every P0/P1 claim was re-checked against real code, a freshly migrated + seeded
> PostgreSQL, and the built production artifact served on `127.0.0.1:4332`.
> **Evidence:** raw outputs in `/tmp/opencode/audit/` (`01-check.txt` … `08-server2.log`)
> and the security report (`10-security-audit.md`). Claims marked ✅ were reproduced
> live; ⚠️ verified by code reading; ❌ rejected after verification.

---

## 1. Baseline (post dependency-drift repair)

| Gate | Result | Note |
|---|---|---|
| `bun run check` (Biome) | 0 errors, 4 warnings (553 files) | warnings: 4× `noImportantStyles` in the reduced-motion block of `global.css` |
| `bun run check:types` | 0 errors / 0 warnings (569 files) | |
| `bun run test` | 493 passed / 20 skipped (98 files), ~6 s | DB suites auto-skip without `RUN_DB_TESTS` |
| `bun run test:coverage` | 85.8 % stmts / 83.24 % branches / 85.2 % funcs / 86.31 % lines | **no thresholds enforced** |
| `bun run build` (Vercel) | exit 0, ~39 s wall | `.vercel/output` ≈ 66 MB (serverless function w/ node_modules) |
| `bun run build` (`ASTRO_ADAPTER=bun`) | exit 0, server ~9 s | boots and serves after restoring lockfile deps |
| Client artifacts | 348.8 KB raw / **113.2 KB gzip total** | `client.*` ReactDOM 58.4 gz · `page.*` Sentry SDK 45.4 gz · router 4.5 gz · rest ≈ 5 gz |
| `bun audit` | **70 advisories at high/critical** (6 critical) | astro AVIF RCE (latent), astro/drizzle/better-auth/vercel upgrades available |

Environment findings from the baseline itself:
- **Dependency drift (fixed during audit):** local `node_modules` had `astro@7.3.8` / `@astrojs/vercel@11.0.14` while `bun.lock` pins `6.1.2` / `10.0.8`. The drifted tree builds a Bun artifact that **crashes at boot** (`TypeError: new App(t).getAdapterLogger is not a function`) because `@nurodev/astro-bun@2.1.2` peers `astro ^5.1.1`. CI is green only because it installs with `--frozen-lockfile`. Restored with `bun install --frozen-lockfile`; all baseline numbers re-measured afterwards.
- **Local dev DB was unmigrated** (empty `public` schema). Migrated + seeded with the documented flow (`db:migrate`, `db:seed:e2e`) to obtain live evidence; test rows/cache keys created during probes were removed.

## 2. Findings register

Severity scale: **P1** high (security/privacy/integrity/availability or broken architecture), **P2** justified hardening/optimization, **P3** minor hygiene. No verified P0 existed.

### 2.1 P1 — fix first

| ID | Finding | Evidence | Target |
|---|---|---|---|
| F-01 | ✅ Anonymous `GET /api/user/:userId` returns `preferences` + `history.watchedAnimes` (owner-only per domain policies); `canViewUserPreferences`/`canViewUserHistory` are dead code; cache hit skips authorization by design | live curl returned full private payload after warming cache; `user-profile/policy.ts:44`, `user/mapper.ts:70-85`, `user service.ts:67-88` | B.1 |
| F-02 | ✅ Zero rate limiting platform-wide; Better Auth's limiter is not mounted (no `auth.handler` route) → unlimited brute force / stuffing / media DoS | `grep rateLimit` = 0; `src/pages/api/auth/` has no catch-all | B.3, B.4 |
| F-03 | ✅ Reflected XSS on public `/showcase`: URL controls reach `href` unvalidated; CSP meta allows `'unsafe-inline'` → `javascript:` executes on click | live render of `href="javascript:alert(1)"`; `service-unavailable.astro:39`, `entries-primitives.ts:78`, `base-layout.astro:47-53` | B.5, B.9 |
| F-04 | ⚠️ Media pipeline: no HTTP `Range`/`206`, full-file `Buffer` in RAM, unbounded `tmpdir()/media-cache` writes, `fetch` without timeout/SSRF guard/byte cap | `fetch-raw-media/service.ts:73-89`, `media-fetch/service.ts:33-58`, `pages/media/[...path].ts` (0 Range matches) | C.2, C.3, C.4 |
| F-05 | ⚠️ `pg.Pool` without `max`/idle/connection timeouts; only PKs exist on 16 media tables; `profile.user_id` has no unique index (verified in DB: `\di` shows only `*_media_pkey`) | `lib/db/client.ts:26`; psql `\di`, `\d profile` | D.1, D.2 |
| F-06 | ✅ Profile row with `gender = NULL` → `500 RESPONSE_VALIDATION_ERROR` (schema requires the enum), and the mapped-but-invalid payload **is cached**, so the 500 persists for the whole TTL; mapper casts stored strings into typed unions without runtime validation | live: 500 → DB fixed → still 500 until `DEL user:profile:*` → 200 | B.2 |
| F-07 | ⚠️ Shared layer imports domains (`src/shared/utils/image/*` → `@media/*`, five repos in `normalize-media-util.ts`) — violates the documented `shared ∉ domains` invariant and blocks independent evolution | grep of non-test files | C.7 (one move) + B.9 biome rule (from superseded T-06) |
| F-08 | ⚠️ 4 repository methods `return db.…` without `await` inside `try/catch`, so DB failures escape the `dbError` wrapper → `500 UNKNOWN_ERROR` instead of typed `503` (`anime-characters:39`, `character:53`, `staff:35`, `music:86`) | code reading; pattern proven by control flow | D.5 |

### 2.2 P2 — justified hardening / optimization

| ID | Finding | Evidence | Target |
|---|---|---|---|
| F-09 | Error envelope inconsistencies (media route, validation wrapper, 503 details, home page 503) — carried from superseded T-04 | re-verified in code | B.10 |
| F-10 | Raw media responses inherit upstream `Content-Type` (a `text/html` upstream executes same-origin) and have no MIME allowlist / `nosniff` | `pages/media/[...path].ts:97-102` | C.4 |
| F-11 | Optimization params unbounded (`w` has no max) + `/_image` registered in the production build with sharp transforms (remote branch blocked today only by the absence of `remotePatterns`) | media schema; `.vercel/output/config.json` contains `^/_image/?$` | C.5 |
| F-12 | `astro@6.1.2` carries a critical AVIF RCE advisory + multiple XSS fixes; upgrade blocked by the stale Bun adapter (`@nurodev/astro-bun` peers `astro ^5.1.1`) — needs an explicit decision | `bun audit`; adapter boot crash on astro 7.3.8; npm peer metadata | F.4 |
| F-13 | `drizzle-orm@0.45.1` / `better-auth@1.5.5` / `@astrojs/vercel@10.0.8` / `vitest@4.1.10` have patch/minor fixes available; advisories not reachable with current config (documented reachability) | `bun audit` + config review | F.4, F.5 |
| F-14 | Shell hydrates a React island (`Toolbar`, 5 buttons) → React+ReactDOM (~58 KB gz) on **every** route; Sentry browser SDK (~45 KB gz) injected on every page | live scripts + chunk inspection | F.1, F.2 |
| F-15 | Every page carries the header brand `<h1>AniDev</h1>` next to the page title `<h1>` (verified live: `/showcase` has 2 `<h1>`; `/` has none of its own) | live HTML | F.3 |
| F-16 | Carousel hot path: full `anime_media` scan + in-memory intersection + `2+2N` queries (media & genres per slide); batch accessor exists unused; cache mitigates to ~1×/h | repo + service reading; coverage shows carousel service 0 % | D.3 |
| F-17 | `search_history.record` runs INSERT→SELECT→DELETE without a transaction: cap can drift under concurrency and partial failure leaves rows beyond cap | `search-history/repository.ts:29-54` | D.4 |
| F-18 | `animeFullService` marks stale via an impure closure captured at first compute: a payload assembled from stale sub-reads reports fresh on later cache hits | `anime-full/service.ts:54,91,108` | D.7 |
| F-19 | List/count sequential + synonym table unused in search (from superseded T-09); unbounded `page` → huge OFFSETs | `anime-list/service.ts:63-64`; `filters.ts` matches only 3 title columns; schemas | D.6, B.8 |
| F-20 | No observability floor: no request IDs, no access logs, no redaction (`pino` has no `redact`), Better Auth logs emails to the Rustrak bridge, no alert rules/runbooks, restore never drilled | logger config; 23 log call sites; `with-error-handling.ts:94` logs full payloads | E.1–E.4 |
| F-21 | Auth surface leaks: registration distinguishes existing emails (`User already exists…` forwarded), login/register return the session `token` in JSON, `meta.details` carries the raw provider error, credential mapping branch unreachable | `map-better-auth-error:94-96`; `login.ts:93-97`; envelope builder | B.6 |
| F-22 | Request bodies unbounded before `request.json()`; `/media` + `/_image` unthrottled; deep `page` unbounded (amplifiers) | `with-validation.ts:87-94`; route surface table | B.7, B.8, B.3 |
| F-23 | Production image installs devDependencies; `pino-pretty`, `dotenv`, `@types/react-dom` live in runtime deps; Docker Bun 1.2 vs CI 1.3.11; `@formkit/tempo` used once; `db:migrate:prod` script contradicts the migration policy; `.env.local.example` commits Rustrak creds (`admin@example.com:admin` + secret); `deploy.yml` lacks `permissions`; `ci.yml` still declares `TURSO_*`/`UPSTASH_*` placeholders | package.json, Dockerfile, workflows, example env | F.5, F.6 |
| F-24 | Coverage measured but never enforced; no e2e assertion for profile privacy; UI e2e layer is a single smoke spec; integration layer depends on a seeded DB nobody auto-provisions locally | `vitest.config.ts` (no thresholds), `e2e/` listing | G.1, G.2 |

### 2.3 P3 — hygiene (tasked, not detailed here)

`isPublicRoute('//…')` prefix quirk (F-25/B.11) · media cache namespace collision `anime:list:carousel` (F-26/D.3) · `toArray` dropping empty-string filters (F-27/D.8) · `ORDER BY` fallback verified **fine** · 4 files over the 150-line rule: `carousel-item.astro` 157, `map-error-to-http.ts` 156, `app-error.ts` 156, `pages/api/user/[userId].ts` 152 (F-28/G.4) · `studio` entity → 503 instead of 4xx (C.6) · Biome's 4 `!important` warnings are intentional in the reduced-motion block (leave; documented) · email verification stance undocumented (decision in §5).

### 2.4 Rejected after verification (do not task)

- ❌ "Search-history race is P0" — real but bounded cap drift, no data loss: **P2** (→ D.4).
- ❌ "Empty carousel cached 24 h poisons startup after DB outage" — compute throws on DB failure; `[]` is only cached when the catalog is genuinely empty. Not a poisoning path (TTL 1 h, not 24).
- ❌ "`null` profile cache poisoning" — compute throws before caching; no null is ever stored.
- ❌ "`ORDER BY null DESC` always emitted" — verification shows a `score` fallback; not present.
- ❌ "BigInt silently corrupted via JSON cache" — no BigInt reaches cached payloads; `JSON.stringify` would throw, not corrupt.
- ❌ "Carousel two-query read race corrupts data" — reads only; mapper has explicit missing-artwork fallbacks.
- ❌ "No source file exceeds 150 lines" — false: four files exceed it (listed above).
- ❌ "ADO `/showcase` XSS is only `javascript:` navigation" — confirmed real (F-03) but requires a click; kept P1 because the route is public and the payload acts with the victim's session.

## 3. Decisions and trade-offs

1. **Consolidation (owner-approved).** `foundation-hardening-and-media-streaming` was moved here (7 delta specs + tasks T-01…T-09, re-verified vigente) and extended. One board, one archive, deltas stay single-sourced. `ROADMAP.md`/`ARCHITECTURE.md` references updated in the same planning step.
2. **Fix order:** security/privacy (B) → media (C) → data/perf (D) → observability (E) → bundle/deps/build (F) → gates/release (G). Rationale: F-01/F-02/F-03 are reproducible today; everything else rides behind them.
3. **Privacy projection model:** keep the cache but make it actor-safe — cache the persisted row/projection under an actor-aware key or apply the projection *after* the cache read; the public DTO drops private sections for non-owners (see `user/profile-privacy` delta). Projection is pure and unit-testable.
4. **Frame the profile contract, not the data:** F-06 is fixed by making the read contract tolerate every persisted shape (omit defaults, drop malformed CSV) **and** by never caching payloads that fail validation — so future Track D imports cannot re-break reads.
5. **CSP strategy:** move CSP to a real header (middleware) so it covers JSON/binary responses; remove `'unsafe-inline'` from `script-src` if Astro's inline injections (ClientRouter/Sentry/astro-font) can be hashed/nonced in the current Astro version; otherwise document the residual and ship the rest of the header set (`nosniff`, `frame-ancestors 'none'`, HSTS, Referrer-Policy). Tracked in B.9.
6. **Astro upgrade + Bun adapter (needs approval at implementation time):** the AVIF RCE fix requires astro ≥ 7.2.8, but `@nurodev/astro-bun` (the self-host adapter) peers `astro ^5.1.1` and the boot crash reproduces on 7.3.8. Options: (a) keep astro 6 + mitigate reachability (no `remotePatterns`, decide on `/_image`), (b) migrate the self-host runtime to `@astrojs/node` (Node-compatible server that Bun can run) and upgrade to astro 7, (c) re-check for a maintained Bun adapter. Task F.4 is a timeboxed spike producing a written decision; nothing ships without the CI e2e layer green.
7. **Rate limiting semantics:** Dragonfly token buckets, fail-open with warning log when the cache is down (availability > perfect limiting for public reads), tighter per-IP+email limits for credentials with lockout + security-event logs.
8. **Body/param bounds are part of the API contract**, not a hack: 1 MiB bodies, `page ≤ 10_000`, `w ∈ [16, 2048]` — documented as BREAKING in the proposal.
9. **No new infrastructure by fashion:** no queues, no microservices, no Prometheus stack. Observability stays on Pino → Rustrak + the readiness endpoint; alerts and runbooks are repo-versioned docs.
10. **`getMediaByAnimeIds` reuse over new abstractions** for the carousel; set-based eligibility in SQL. Cache namespace for the carousel becomes its own prefix.

## 4. Scalability strategy (three horizons)

**Horizon 1 — current scale (execute in this change):** remove the bottlenecks that are already wrong: indexed FKs + pool bounds, set-based carousel, batched media, atomic cap, bounded inputs, zero-cost shell JS. Targets: home cold path ≤ 3 queries; zero sequential scans on hot read paths (`EXPLAIN` before/after recorded); `/media` streams without RAM spikes.

**Horizon 2 — anticipated growth (prepare now, execute when data grows):** adopt **keyset pagination** for catalog lists when deep pages appear in logs, keep `OFFSET` for the UI (top pages) while the API exposes a cursor; move heavy Track D ingestion to the separate ingestion path (already planned); size Dragonfly memory budget per cache family; add per-route latency histograms if Rustrak grows the capability. Trigger: catalog > ~50 k anime or p95 list > 300 ms.

**Horizon 3 — advanced scale (only with measurable triggers):** read replicas / PgBouncer (trigger: sustained pool saturation with `connectionTimeout` errors), dedicated media/edge caching (trigger: media egress > 70 % of bandwidth cost), or horizontal app scaling (trigger: sustained CPU > 70 % on the VPS). Each requires an ADR with cost analysis — explicitly out of scope today.

## 5. Observability & operations design (explicit non-goals included)

- **Logs:** one access line/request (`method, route, status, duration, requestId, actorClass`), `x-request-id` propagated and bound to child loggers; `redact` for cookies/authorization/tokens/emails; auth provider payloads stay in `cause`, never in client bodies.
- **Signals:** readiness endpoint stays the machine check; error rate and p95 per route group derive from the access lines; Rustrak receives errors by severity (4xx warning / 5xx error) as today.
- **Alert rules (versioned doc, applied manually in Rustrak):** 5xx rate > 1 % / 5 min on `/api/*`; readiness failing twice consecutively; media proxy 5xx burst; auth lockout surges; disk > 85 %. Each with a first-response step.
- **Runbooks:** backup/restore drill (perform once during this change and record it), release rollback (image tag + additive-only migration policy), incident triage (readiness → logs by requestId → Rustrak issue).
- **Decision pending (approval):** email verification is not implemented; either scope it in a dedicated change or record the product stance. Not silently ignored.

## 6. Verification plan

- **Unit (TDD):** failing test first for every behavior change above; existing 493 tests must stay green.
- **Coverage thresholds** added to `vitest.config.ts` (floor set just below the current baseline: statements 85 %, branches 82 %, functions 84 %, lines 85 %) and enforced in CI.
- **Integration (real Postgres):** index presence (`EXPLAIN` assertions where practical), search history cap under concurrency, profile privacy queries.
- **E2E (real stack):** owner vs non-owner vs anonymous profile visibility; 429 after threshold on login; response headers present; invalid `w`/`page` rejected; `/media` `Range` behavior when a fixture source exists.
- **Manual/live:** rebuild the Bun artifact from frozen deps and re-run the probe script used in the audit (headers, privacy, h1 count, client chunk sizes) recording before/after numbers.
- **Gate:** `format → check → check:types → test → build` + `test:integration` + `test:e2e` locally; CI jobs unchanged but now with thresholds + audit gate.

## 7. Consolidation record (superseded → here)

Moved verbatim from `foundation-hardening-and-media-streaming` and extended:
`anime/advanced-search` · `frontend/error-pages` · `infrastructure/database` · `infrastructure/error-handling` · `infrastructure/security-middleware` · `media/range-streaming-and-cache` · `user/profile-privacy`.
Its tasks T-01…T-09 map to B.1/B.2 (T-01), C.1 (T-02), C.2/C.3 (T-03), B.10 (T-04), D.1/D.2 (T-05), C.7 + B.9 (T-06), C.5 (T-07), B.3/E.1/B.9 (T-08), D.6/F.6/D.4 (T-09). The change directory was removed; git history keeps it.

## 8. Risks, residuals, approvals

- **Residual risk accepted:** CSP may retain `'unsafe-inline'` if Astro's inline injections cannot be hashed in 6.1.2 — documented, mitigated by F-03 fix + real headers; revisited with the astro upgrade.
- **Approval needed:** the astro-7/Bun-adapter path (F.4) changes the self-host runtime; present options + spike results before executing.
- **Approval needed:** removing/replacing `@formkit/tempo` and moving packages to `devDependencies` (F.6) — low risk, verified by build + tests.
- **Not covered by this audit (declared):** dynamic pentest/fuzzing, cloud/Vercel account configuration, deployed Rustrak exposure, git history secret scan, load testing. Recommended follow-up: one DAST pass + one load test before the first public release, tracked in the ROADMAP.
- **Rollback:** app is image-tagged; migrations in this change are additive (indexes + unique index on `profile.user_id` — requires a pre-flight duplicate check query documented in the migration task); no destructive DDL.

## 9. D.2 evidence (indexes migration `drizzle/0002`)

- **Generated with `db:generate`** from schema edits (no hand-written DDL; the
  synonym GIN uses drizzle's native `.using('gin', t.title.op('gin_trgm_ops'))`
  and emits `USING gin ("title" gin_trgm_ops)`).
- **Added:** composite B-tree `(entity_id, media_type)` on `anime_media`,
  `character_media`, `staff_media`, `episode_media`, `music_media`;
  `music_version(music_id)`; `music_resolution(music_version_id)`; catalog
  filters `anime(year, season, score, status, type, rating)`, `genre(name)`;
  GIN trgm `anime_title_synonym(title)`; `UNIQUE profile(user_id)`.
- **Skipped by evidence:** `episode(anime_id)` is already the leftmost prefix
  of `episode_anime_number_unique` — a second index would be redundant.
- **Cascade added:** `anime_music`, `anime_relation` (both FKs),
  `music_artist` (both FKs); all other catalog junctions already cascade.
- **Pre-flight (additive-only rule):** `SELECT user_id, COUNT(*) FROM profile
  GROUP BY user_id HAVING COUNT(*) > 1` → 0 rows (0 profiles locally), so the
  unique index is safe.
- **EXPLAIN (local seed scale, 4 anime):**
  - `anime_media WHERE anime_id=1 AND media_type='poster'`: before → `Seq Scan
    (cost=0.00..19.15)`; after → `Index Scan using
    anime_media_anime_id_type_idx (cost=0.15..8.17)`. Proven used by default.
  - `anime WHERE year=2024 AND status IN (...) ORDER BY popularity_rank LIMIT
    10` and `anime_title_synonym WHERE title ILIKE '%cowboy%'`: still `Seq
    Scan` after — correct planner choice at this row count; indexes verified
    present in `pg_indexes` and valid (migration applied cleanly). Value is at
    production volume.
- **Integration:** `test:integration` 6 files / 20 tests green after migrate.

## 10. D.3 evidence (carousel hot path)

- **Before (code reading):** `getTopPopularWithMedia` ran 2 queries (full
  `anime_media` type scan + anime list) plus JS-side eligibility, then the
  service fanned out per slide: `getAnimeMedia(id)` × N and
  `getGenresByAnimeId(id)` × N → **2 + 2N queries (14 at N = 6)**.
- **After:** single set-based eligibility (`WHERE media_type IN
  ('banner','clearlogo') GROUP BY anime_id HAVING COUNT(DISTINCT media_type)
  = 2` over the D.2 composite index, as an `IN` subquery ordered by
  `popularity_rank`) + one `getMediaByAnimeIds` fan-out + one
  `getGenresByAnimeIds` fan-out → **3 cold queries** (1 when eligibility is
  empty via short-circuit, asserted in unit test).
- **EXPLAIN (seed scale):** single query, `GroupAggregate` + `Nested Loop`;
  seq scans on 6-row tables are the correct planner choice locally — the
  composite index it ranges over was proven index-scanned in §9.
- **Cache:** key moved from `anime:list:carousel` to the dedicated
  `anime:carousel:slides` prefix (`CacheKeyPrefix.AnimeCarousel`); the old
  key expires via TTL, no migration needed.
- **Domain boundary:** batching lives behind `getAnimeMediaByIds`
  (media service groups into `Record<malId, MediaAsset[]>`) so the anime
  domain never touches media repositories directly.
- **Tests:** service unit (short-circuit, grouping, prefix), media grouping
  unit, taxonomy batch unit (+ async-rejection `DB_ERROR`), integration
  (reserved `999_004_xxx`, real SQL eligibility + both fan-outs).
- **Incidental fix:** the new integration file first used `999_002_xxx` and
  collided with the music suite's `ANIME = 999_002_101` (parallel workers,
  shared DB) — moved to `999_004_xxx`; all 7 integration files green.

## 11. D.4/D.6/D.7/D.8 evidence

- **D.4:** `searchHistoryRepository.record` runs insert + prune inside
  `db.transaction` with `pg_advisory_xact_lock(hashtext(userId))` first, so
  concurrent writes for one user serialize and the 50-row cap holds.
  Integration proves it: 45 pre-filled + 20 parallel records → exactly 50.
- **D.6:** `animeListService` runs list + count via `Promise.all`;
  `buildAnimeListFilters` adds `OR EXISTS (SELECT 1 FROM
  anime_title_synonym WHERE anime_id = anime.mal_id AND title ILIKE …)`.
  EXPLAIN shows the planner using the composite
  `(anime_id, title)` B-tree with the ILIKE as filter at seed scale (GIN
  valid, wins at volume). Integration: synonym-only term finds the probe
  row; 5× parallel list/count pairs agree.
- **D.7:** degraded assembly persists an `anime:full:{id}:degraded` marker
  (same TTL) alongside the payload; reads OR it into `isStale`, so a stale
  payload reports stale on every read including cache hits until a fresh
  recompute clears the marker. Unit covers compute + hit + mark/clear.
- **D.8:** `stableStringify` (recursive key sort) backs `animeListCache` and
  `musicListCache` keys; permuted filter objects produce one key (unit +
  facade tests). Deep-imported (`@lib/cache/stable-stringify`) so existing
  `@lib/cache` test mocks keep working.

## 12. G.3 verification record (2026-10-15, local stack)

Full gate green: `format` clean · `check` 4 baseline warnings · `check:types`
0 errors · unit 579 passed · integration 26 passed · `build` clean ·
`test:coverage` 86.02/82.58/87.03/86.31 with enforced thresholds (85/82/84/85)
· `bun run audit` 0 unlisted high/critical · Docker image builds and boots
with production-only deps on `oven/bun:1.3`.

| Probe | Before | After |
|---|---|---|
| Security headers | none | `x-request-id`, `nosniff`, `DENY`, `Referrer-Policy`, HSTS (prod), CSP header on documents |
| Profile privacy (anon read) | `preferences` + `history` leaked | public identity only (e2e owner/other/anonymous) |
| `h1` count (`/`, `/showcase`, `/anime/[id]/[slug]`) | 0 / 2 / 2 (brand heading) | 1 / 1 / 1, verified live |
| Client JS chunks | 7 incl. React runtime (~110.7 KB gzip) | 5, React chunks gone; 111,884 B total, ~94% Sentry SDK (documented in `docs/monitoring.md`) |
| Unit tests | 493 | 579 |
| Carousel cold queries | 14 (2 + 2N) | 3 (1 when empty) |
| DB indexes (media/filter) | PKs only | 16 + `profile.user_id` unique + junction cascades (`drizzle/0002`) |
| E2E api project | — | 33/33 green (visibility, 429, headers, bounds, `/_image` 403) |

Caveat: the `ui` smoke is red **only in this sandbox** — every page subresource
fails with `ERR_INVALID_ARGUMENT` under the test-runner-driven
headless-shell-1234 while the identical page, server build, and browser
binaries load clean outside the runner (plus curl/Node-fetch green). No app
code is involved in Chromium subresource fetching. Kept strict; CI (Ubuntu +
pinned browsers) adjudicates.
