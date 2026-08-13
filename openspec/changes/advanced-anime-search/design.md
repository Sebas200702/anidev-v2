## Context

See `proposal.md` — Why, and `ROADMAP.md` decisions D3 (Postgres-only staged
search), D5 (personalization vs cache), D1/Track D (data backfill gates
studio/day). Today:

- `GET /api/anime` → `animeListService.getAnimeList` → `animeRepository` query,
  read-through cached via `animeListCache.key(filters)`.
- Request validated by `animeFiltersParamsSchema`; `mapAnimeFilters` normalizes
  scalars → arrays for `genre/status/rating/type`, passes `year/query/page/limit`.
- Free-text `query` is a naive `ILIKE` (unindexed).
- `anime` has `season`, `score` (real), `rating`; facet joins exist
  (`anime_genre`, `anime_theme`, `anime_demographic`, `anime_producer`).
- No `broadcast_*` columns; `producer` has no studio/licensor split → **studio and
  day filters are not data-backed** and are out of scope here.
- The sibling change `api-response-schema-in-wrapper` moves routes to
  `withZodValidation(...)(withErrorHandling(handler, { responseSchema }))`; this
  change targets that composition.

## Goals / Non-Goals

**Goals**

- Add `season`, `scoreMin`, `scoreMax`, `sort`, `order` to the list/search query,
  backward-compatible with existing params and cache behavior.
- Replace `ILIKE` free-text with an indexed `pg_trgm` + `tsvector` match (Stage 1).
- Apply a parental-control floor as a coarse `safe`/`full` **cache-key variant**.
- Persist per-user search history (record on search; authed read + clear).
- Keep the query layer swappable so Stage 2 (ParadeDB BM25) needs no API change.

**Non-Goals**

- Studio filter, broadcast-day filter, facet counts — blocked on Track D backfill.
- ParadeDB/BM25 relevance and pgvector semantic search — Stage 2/3, separate.
- Any frontend page/island (`/showcase` demo + search UI are follow-ups).
- Per-user response caching (personalization stays client-side per D5).

## Decisions

### 1. Query approach — Stage 1 stock Postgres

- **Free-text:** GIN `pg_trgm` index on `anime.title` (+ `anime_title_synonym`)
  and/or a `tsvector` expression; rank with `similarity()` / `ts_rank`. No new
  extension beyond `pg_trgm` (`CREATE EXTENSION IF NOT EXISTS pg_trgm`).
- **Filters:** `season` = equality on `anime.season`; `scoreMin/scoreMax` = range
  on `anime.score` (nulls excluded when a bound is set). Existing array facets
  (`genre/status/rating/type`) unchanged.
- **Sort:** `sort ∈ { score, year, title, relevance }`, `order ∈ { asc, desc }`,
  applied via a **whitelist** (never interpolate raw input into SQL). `relevance`
  only valid when `query` is present; default sort stays as today when unset.

### 2. Parental-control floor (D5)

- Compute a coarse `parentalVariant: 'safe' | 'full'`. `safe` = default for
  anonymous and non-opted-in users; excludes a configured `ADULT_RATINGS` set on
  `anime.rating`. `full` = authenticated user whose profile preference opts in.
- The variant is a **cache-key dimension** (`animeListCache.key` includes it), so
  there are at most two cached variants per filter set — never keyed by user id.

### 3. Search history — anime-domain unit

- New unit `@anime/repositories/search-history` + `@anime/services/search-history`
  (kind files `repository.ts` / `service.ts` + `types.ts`, per unit-folder rule).
- New table `search_history` (`id`, `user_id` text, `query` text, `filters`
  jsonb, `created_at`). FK-light: `user_id` matches the auth user id string used
  elsewhere (see user-domain `profile.id` convention; do not invent a migration
  beyond this table).
- **Record** best-effort after a successful authed search (failure to record
  MUST NOT fail the search). **Read** returns the caller's recent searches;
  **clear** deletes the caller's rows. All authed, owner-only, `private, no-store`.

### 4. HTTP surface

- `GET /api/anime` — unchanged route, extended query params; response schema
  validated by the wrapper. Records history when a session is present.
- `GET /api/anime/search-history` — authed; returns recent searches.
- `DELETE /api/anime/search-history` — authed; clears caller's history.

### 5. Layering (same vertical slice as existing reads)

```text
Route (Zod params + wrapper responseSchema)
  → animeListService.getAnimeList(filters, actor)
    → parental variant → repository (indexed text + filters + whitelist sort)
    → map cards → cache by key(filters + variant)
  → (session) searchHistoryService.record(actor, query, filters)  // best-effort
```

### 6. Validation schemas

- Extend `animeFiltersParamsSchema`: `season?`, `scoreMin?`/`scoreMax?`
  (`z.coerce.number().min(0).max(10)`, `scoreMin ≤ scoreMax`), `sort?`/`order?`
  as enums. Extend `animeFiltersSchema` (normalized) accordingly.
- `searchHistoryQuerySchema` (limit) and response schema for history entries.

### 7. Cache

- Extend `animeListCache.key` to fold in `season/scoreMin/scoreMax/sort/order` and
  the `parentalVariant`. Keep key ordering stable for hit rate.

## Risks / Trade-offs

- **[Text index cost on the VPS (D8)]** GIN `pg_trgm` on title/synonyms adds
  index memory; scope indexes to the searched columns only, verify `EXPLAIN` on
  the live dataset.
- **[Sort injection]** mitigated by strict whitelist mapping, no raw interpolation.
- **[History write coupling]** record is best-effort and out of the response path;
  never blocks or fails the search.
- **[Stage-1 relevance is modest]** `pg_trgm`/`ts_rank` < BM25; acceptable for MVP,
  and the swappable query layer keeps Stage 2 cheap.

## Migration Plan

- Add `pg_trgm` extension + GIN index migration and the `search_history` table via
  Drizzle (`db:generate` / `db:migrate`); anidev-v2 owns the schema (D1).
- TDD per task group; ship on `feat/advanced-anime-search`; pass the gate
  (`format → check → check:types → test → build`); PR, no release bump until asked.

## Open Questions

- Exact `ADULT_RATINGS` set + where the opt-in preference is read on `profile`
  (confirm against live schema during task 4, mirroring user-domain conventions).
