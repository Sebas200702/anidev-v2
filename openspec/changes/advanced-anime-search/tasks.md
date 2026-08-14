> **Status (Stage 1 — code complete):** filters + deterministic sort + safe
> parental floor + index-backed `pg_trgm` free-text (`ILIKE` + `similarity`
> relevance) + `search_history` unit + API routes (list migrated to the wrapper,
> `/api/search-history` read/clear, best-effort recording) are implemented and
> the full gate is green. **Remaining = production sync only:** apply migrations
> `0001`/`0002` on the VPS (baseline `__drizzle_migrations` first — the DB was
> seeded externally) and re-confirm the `EXPLAIN` there; then PR/release.
> **No ParadeDB in this change** — that is Stage 2 (D3), a separate future change.

## 1. Schemas and types

- [x] 1.1 Extend `animeFiltersParamsSchema` with `season?`, `scoreMin?`, `scoreMax?` (coerced 0–10, `scoreMin ≤ scoreMax` refinement), `sort?` / `order?` enums; extend normalized `animeFiltersSchema` to match
- [x] 1.2 `searchHistoryQuerySchema` (limit) + entry schema in §5.5; request (`get`/`delete`) + envelope (`list`/`clear`) response schemas added under `@search/schemas` for the §6 routes
- [x] 1.3 Add `AnimeSortField` + `ParentalVariant` types and the `parentalVariant` normalized-filter field _(search-history types deferred to §5; `AnimeFilters` fields are `z.infer`-derived)_

## 2. Filters mapper (TDD)

- [x] 2.1 Failing tests for `mapAnimeFilters` covering `season`, score range, and `sort/order` defaults + passthrough
- [x] 2.2 Implement the new fields in `mappers/anime-filters/mapper.ts` (defaults score/desc; cache-key stable)

## 3. Repository query (TDD)

### 3a — filters, sort, parental floor (done, offline SQL-gen verified)

- [x] 3a.1 SQL-generation tests via `.toSQL()`: `season` equality, score range (gte/lte), whitelist `sort`/`order` with defaults, and **deterministic pagination** (`malId` secondary key)
- [x] 3a.2 Implement `season`/score filters + `buildAnimeListSort` (whitelist + `malId`) and wire `ORDER BY` into `getAnimeList`

### 3b — pg_trgm free-text + relevance (done locally; prod sync pending)

- [x] 3b.1 Migration `0001_search_text_trgm_indexes.sql`: `CREATE EXTENSION pg_trgm` + GIN trgm indexes on `anime.title` / `title_english` / `title_japanese`. Applied locally via `drizzle-kit migrate`. ⚠️ **Prod:** `drizzle.__drizzle_migrations` was empty (externally-seeded DB) — baseline 0000 before `db:migrate` (see PR notes)
- [x] 3b.2 Replaced normalized `LIKE` with **index-backed `ILIKE '%q%'`** (GIN trgm — EXPLAIN shows `Bitmap Index Scan on anime_title_trgm_idx`); `relevance` sort ranks by `similarity(title, q)` selected as `sim_rank` alias (SELECT DISTINCT constraint)
- [x] 3b.3 Opt-in integration test (`anime-list.integration.test.ts`, `RUN_DB_TESTS=1`) against the local DB: free-text returns Cowboy Bebop ranked first; safe floor excludes `Rx - Hentai`. Caught a real `SELECT DISTINCT` + ORDER BY bug (`42P10`/`42703`), now fixed. _(CI service container: follow-up)_

## 4. Parental floor + service (TDD) — **safe-only (fail-closed)**

- [x] 4.1 Failing tests: `safe`/unset → excludes `ADULT_RATINGS` (keeps null ratings); `full` → no restriction
- [x] 4.2 `ADULT_RATINGS = ['Rx - Hentai']` (⚠️ confirm/extend against live `anime.rating` values). `profile` has **no opt-in column** → shipped **safe-only**; the `full` plumbing exists but is unreachable (opt-in field = prerequisite change, out of scope)
- [x] 4.3 Service pins `parentalVariant: 'safe'` and folds it into `animeListCache.key`
- [x] 4.4 Explicit cache test (`anime-list-cache.test.ts`): `safe`/`full` produce distinct keys, the key is deterministic and fully determined by the normalized filters (`key.endsWith(JSON.stringify(filters))`, no `user` substring) → at most `safe`/`full` variants per filter set, never keyed by user id

## 5. Search history unit (TDD) — **moved to a new `search` domain**

> Redesign: search history is user-scoped **and transversal** (not only anime →
> music, characters, …), so it lives in `src/domains/search/` (alias `@search`)
> with a `scope` discriminator column, not in `anime`.

- [x] 5.1 Migration `0002_fixed_jackpot.sql`: `search_history` (`id`, `user_id`, `scope`, `query`, `filters` jsonb, `created_at`) + index (`user_id`, `created_at` DESC). Applied locally. ⚠️ Trimmed unrelated pre-existing drift (`account`/`session` defaults, `profile.user_id` int→text) — see below
- [x] 5.1a/5.2 Integration test (`RUN_DB_TESTS`) against local DB: record/list newest-first/**cap 50**/clear, with `scope`
- [x] 5.3 Implement `searchHistoryRepository` + `searchHistoryService` (owner-only) as **`@search` unit folders**
- [x] 5.4 Unit test proving `record` is best-effort: a history write failure does NOT throw
- [x] 5.5 Add `searchHistoryQuerySchema` + entry schema under `@search/schemas`

> ⚠️ **Pre-existing schema drift** surfaced by `db:generate` (not this change):
> `profile.user_id` is `integer` in the DB but `text` in the TS schema. Trimmed
> from migration 0002; track/resolve separately (see user-profile change).

## 6. API routes (TDD) — wrapper (`api-response-schema-in-wrapper`) merged to master

- [x] 6.1 Route tests for `GET /api/anime` (`anime-list-route.test.ts`): 200 envelope + pagination meta; malformed card → 500 `RESPONSE_VALIDATION_ERROR`; history recorded when authed **and** search intent present; **not** recorded for anonymous callers or plain pagination
- [x] 6.2 `GET /api/anime` already runs on `withZodValidation(...)(withErrorHandling(handler, { responseSchema }))` after the wrapper merge (rebased in); wired **best-effort history record** — authed + `hasSearchIntent(query)` → `searchHistoryService.record({ scope: 'anime', query, filters })` (pagination stripped from the persisted `filters` snapshot)
- [x] 6.3 Route tests for `GET`/`DELETE /api/search-history` (`search-history-route.test.ts`): 401 `AUTH_REQUIRED` anon (both verbs), 200 owner list (newest-first, `userId` not leaked, `limit` validated), 400 out-of-range `limit`, 200 clear (`{ removed }`)
- [x] 6.4 Implemented authed read + clear routes at **`/api/search-history`** (transversal path — history is cross-domain, not nested under `anime`), `Cache-Control: private, no-store`, owner-scoped via `requireAuthSession`

## 7. Verification

- [x] 7.1 Full gate green: `format` ✓ · `check` ✓ · `check:types` 0 errors ✓ · `test` 156 passed ✓ · `build` Complete ✓
- [x] 7.2 `EXPLAIN` on the local dataset (29,705 anime) confirms `Bitmap Index Scan on anime_title_trgm_idx` for `ILIKE`. Re-confirm on the VPS after applying `0001`
- [~] 7.3 Conventional Commits per task group (done for Stage 1); release only when the user requests a PR/release
