# Design: taxonomy browsing (`/search`)

## 1. Findings (evidence-first)

| # | Finding | Evidence |
|---|---|---|
| T-01 | `#Genre` pills link to `/search?genre=<name>` | `anime-carousel/mapper.ts:98` (`/search?genre=…`) |
| T-02 | No `/search` route exists | `src/pages/` has `index`, `anime/[malId]`, `showcase` only |
| T-03 | The list API already filters by genre | `buildAnimeListFilters` (`genreTable.name` IN) + `genre_name_idx` (migration `0002`) |
| T-04 | `animeListService.getAnimeList` is container-ready | filters + `page`/`limit` + `Promise.all` list/count (D.6) |

## 2. Decisions

- **Container-only page** (`src/pages/search.astro`): validates query with
  the existing `animeListRequestSchema`, calls `animeListService`, passes
  `list`/`total`/`page` down. No data-fetching in components.
- **Reuse, don't invent**: `AnimeCard` grid (same markup as `/`), pagination
  via plain `<a>` links (zero JS, back-button friendly, `astro:transitions`
  compatible).
- **Single `h1`**: `Discover anime` + active filter context (F.3 contract).
- **Cache**: none new — `animeListCache` already keys these filter shapes.
- **Errors**: unknown genre → valid empty result (not 404 — genres are
  open-vocabulary); infra failure → `<ServiceUnavailable />` 503 like `/`
  (B.10 precedent).

## 3. Risks

- Large genre result sets paginate with OFFSET (bounded `page` ≤ 10 000 per
  B.8); keyset pagination is a future optimization, not this change.
