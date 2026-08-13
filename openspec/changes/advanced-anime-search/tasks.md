> **Status (Stage 1):** filters + deterministic sort + safe parental floor are
> implemented end-to-end and verified offline (unit tests via Drizzle `.toSQL()`,
> Biome, `astro check`). Free-text is still the existing normalized `LIKE`; the
> `pg_trgm` swap, relevance ranking, migrations, and `search_history` are prepared
> for the VPS (need a live Postgres). Routes wait on `api-response-schema-in-wrapper`.
> **No ParadeDB in this change** — that is Stage 2 (D3), a separate future change.

## 1. Schemas and types

- [x] 1.1 Extend `animeFiltersParamsSchema` with `season?`, `scoreMin?`, `scoreMax?` (coerced 0–10, `scoreMin ≤ scoreMax` refinement), `sort?` / `order?` enums; extend normalized `animeFiltersSchema` to match
- [ ] 1.2 Add `searchHistoryQuerySchema` (limit) + search-history entry/response schemas — **reordered into §5** (cohesive with the history unit)
- [x] 1.3 Add `AnimeSortField` + `ParentalVariant` types and the `parentalVariant` normalized-filter field _(search-history types deferred to §5; `AnimeFilters` fields are `z.infer`-derived)_

## 2. Filters mapper (TDD)

- [x] 2.1 Failing tests for `mapAnimeFilters` covering `season`, score range, and `sort/order` defaults + passthrough
- [x] 2.2 Implement the new fields in `mappers/anime-filters/mapper.ts` (defaults score/desc; cache-key stable)

## 3. Repository query (TDD)

### 3a — filters, sort, parental floor (done, offline SQL-gen verified)

- [x] 3a.1 SQL-generation tests via `.toSQL()`: `season` equality, score range (gte/lte), whitelist `sort`/`order` with defaults, and **deterministic pagination** (`malId` secondary key)
- [x] 3a.2 Implement `season`/score filters + `buildAnimeListSort` (whitelist + `malId`) and wire `ORDER BY` into `getAnimeList`

### 3b — pg_trgm free-text + relevance (pending: needs live Postgres / CI)

- [ ] 3b.1 Migration: `CREATE EXTENSION IF NOT EXISTS pg_trgm`, GIN trigram index on `anime.title` (+ synonyms), `tsvector` as needed _(prepare SQL for the VPS to apply)_
- [ ] 3b.2 Replace normalized `LIKE` with an **index-backed predicate** (`title % :q` / `tsvector @@ plainto_tsquery`) before `similarity()`/`ts_rank`; implement `relevance` sort (currently falls back to score)
- [ ] 3b.3 Integration test against a real Postgres service container (index usage + adjacent-page determinism for all sorts incl. `relevance`)

## 4. Parental floor + service (TDD) — **safe-only (fail-closed)**

- [x] 4.1 Failing tests: `safe`/unset → excludes `ADULT_RATINGS` (keeps null ratings); `full` → no restriction
- [x] 4.2 `ADULT_RATINGS = ['Rx - Hentai']` (⚠️ confirm/extend against live `anime.rating` values). `profile` has **no opt-in column** → shipped **safe-only**; the `full` plumbing exists but is unreachable (opt-in field = prerequisite change, out of scope)
- [x] 4.3 Service pins `parentalVariant: 'safe'` and folds it into `animeListCache.key`
- [ ] 4.4 Explicit cache test proving at most `safe`/`full` variants per filter set (never keyed by user id) _(structurally guaranteed today — variant is a constant folded into `JSON.stringify(filters)`; dedicated test pending)_

## 5. Search history unit (TDD) — pending: needs live Postgres

- [ ] 5.1 Migration for `search_history` (`id`, `user_id`, `query`, `filters` jsonb, `created_at`) + index on (`user_id`, `created_at` DESC); per-user row cap (default 50) pruned on record _(prepare SQL for the VPS)_
- [ ] 5.1a Test: read newest-first, `limit` default 20 / max 100, empty → empty list, cap prunes older rows
- [ ] 5.2 Failing tests for `searchHistoryRepository` (record / list-by-user / clear-by-user, `dbError`)
- [ ] 5.3 Implement repository + `searchHistoryService` (owner-only) as anime-domain unit folders
- [ ] 5.4 Test proving `record` is best-effort: a history write failure does NOT fail the search
- [ ] 5.5 Add `searchHistoryQuerySchema` + entry/response schemas (moved from 1.2)

## 6. API routes (TDD) — pending: `api-response-schema-in-wrapper` first

- [ ] 6.1 Failing route tests for extended `GET /api/anime` (new params validate; existing behavior unchanged; parental variant applied; history recorded when session present)
- [ ] 6.2 Migrate `GET /api/anime` to `withZodValidation(...)(withErrorHandling(handler, { responseSchema }))` (**after** the wrapper change lands; remove inline `animeListResponseSchema.parse` + success-path `jsonResponse`); wire best-effort history record
- [ ] 6.3 Failing tests for `GET`/`DELETE /api/anime/search-history` (401 anon, 200 owner list, 200 clear)
- [ ] 6.4 Implement authed search-history read + clear routes (`private, no-store`)

## 7. Verification

- [~] 7.1 Per-commit: `bun run check` (Biome), `check:types`, `test` green. **Pending pre-PR:** `format` + `build`
- [ ] 7.2 `EXPLAIN` the text + filter query on the live dataset; confirm index usage on the VPS
- [~] 7.3 Conventional Commits per task group (done for Stage 1); release only when the user requests a PR/release
