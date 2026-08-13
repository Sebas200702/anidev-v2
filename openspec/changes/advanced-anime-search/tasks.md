## 1. Schemas and types

- [ ] 1.1 Extend `animeFiltersParamsSchema` with `season?`, `scoreMin?`, `scoreMax?` (coerced 0–10, `scoreMin ≤ scoreMax` refinement), `sort?` / `order?` enums; extend normalized `animeFiltersSchema` to match
- [ ] 1.2 Add `searchHistoryQuerySchema` (limit) + search-history entry/response schemas; export all from `@anime/schemas`
- [ ] 1.3 Add `AnimeFilters` type fields + `ParentalVariant` and search-history types under the anime domain `types/`

## 2. Filters mapper (TDD)

- [ ] 2.1 Write failing tests for `mapAnimeFilters` covering `season`, score range, and `sort/order` defaults + passthrough
- [ ] 2.2 Implement the new fields in `mappers/anime-filters/mapper.ts` (keep cache-key stability)

## 3. Repository query (TDD)

- [ ] 3.1 Write failing tests (Vitest + Postgres service container) for: `season` equality, score range (nulls excluded when bounded), whitelist `sort`/`order` with defaults, index-backed text predicate + ranking, and **deterministic pagination** across adjacent `LIMIT/OFFSET` pages for `score`/`year`/`title`/`relevance` (tie-break by `malId`)
- [ ] 3.2 Add migration: `CREATE EXTENSION IF NOT EXISTS pg_trgm`, GIN trigram index on `anime.title` (+ `anime_title_synonym`), `tsvector` expression/index as needed
- [ ] 3.3 Implement the extended query: **index-backed match predicate** (`title % :q` / `tsvector @@ plainto_tsquery`) before `similarity()`/`ts_rank`, new filters, and strict whitelist sort with **`malId` secondary key** (no raw interpolation)

## 4. Parental floor + service (TDD)

- [ ] 4.1 Write failing tests for `parentalVariant` resolution: anonymous → `safe`; **fail-closed** (unreadable preference/config → `safe`, never `full`); `safe` excludes `ADULT_RATINGS`
- [ ] 4.2 Finalize `ADULT_RATINGS` strings against live `anime.rating` values. **Note: `profile` has no opt-in column → Stage-1 is safe-only**; do NOT add the preference field here (prerequisite change). Ship the `full` plumbing but leave it unreachable
- [ ] 4.3 Implement variant resolution in `animeListService.getAnimeList` and fold the variant into `animeListCache.key`
- [ ] 4.4 Write failing test proving cache produces at most `safe`/`full` variants per filter set (never keyed by user id)

## 5. Search history unit (TDD)

- [ ] 5.1 Add migration for `search_history` (`id`, `user_id` text, `query` text, `filters` jsonb, `created_at`) + **index on (`user_id`, `created_at` DESC)**; enforce a **per-user row cap** (default 50) by pruning on record
- [ ] 5.1a Write failing test proving history read is newest-first, `limit` default 20 / max 100, empty history → empty list, and per-user cap prunes older rows
- [ ] 5.2 Write failing tests for `searchHistoryRepository` (record / list-by-user / clear-by-user, `dbError` on failure)
- [ ] 5.3 Implement repository + `searchHistoryService` (owner-only) as anime-domain unit folders
- [ ] 5.4 Write failing test proving `record` is best-effort: a history write failure does NOT fail the search

## 6. API routes (TDD)

- [ ] 6.1 Write failing route tests for extended `GET /api/anime` (new params validate; existing behavior unchanged; parental variant applied; history recorded when session present)
- [ ] 6.2 Migrate/keep `GET /api/anime` on `withZodValidation(...)(withErrorHandling(handler, { responseSchema }))` (**after** `api-response-schema-in-wrapper` lands; **remove** inline `animeListResponseSchema.parse` + success-path `jsonResponse`); wire new filters + best-effort history record
- [ ] 6.3 Write failing tests for `GET`/`DELETE /api/anime/search-history` (401 anon, 200 owner list, 200 clear)
- [ ] 6.4 Implement authed search-history read + clear routes (`private, no-store`)

## 7. Verification

- [ ] 7.1 Run `bun run format`, `bun run check`, `bun run check:types`, `bun run test`, `bun run build`
- [ ] 7.2 `EXPLAIN` the text + filter query on the live dataset; confirm index usage and acceptable plan on the VPS
- [ ] 7.3 Mark tasks complete; Conventional Commits per task group; release only when the user requests a PR/release per AGENTS.md
