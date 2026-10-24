# Design: SEO base and producer taxonomy (backend)

## 1. Findings (evidence-first)

- **No SEO endpoints.** `src/pages` has no `sitemap*`, `robots*` or `public/robots.txt`.
  Pages that render today are `/`, `/search` (with `?genre=`) and
  `/anime/[malId]/[slug]` (plus `/anime/[malId]`, which redirects to the slug).
- **Catalog size (local clone of prod, 2026-10-24).** 30,565 anime, of which
  1,632 have `rating = 'Rx - Hentai'` (`ADULT_RATINGS`). There are 83 genres
  and 70,860 manga. `anime` has no `updated_at`, so `<lastmod>` cannot be
  truthful and is omitted.
- **Producers.** `producer` has 2,988 rows. Names live in `producer_title`
  (`type = 'Default'` for 2,972 producers; 16 have only alternative titles).
  Credits by role:
  - `anime_producer`: studio 20,128 (1,422 producers), producer 34,283,
    licensor 6,309. The role index is `anime_producer_role_idx (role, producer_id)`.
  - `manga_producer`: `serialization` only, 51,749 links.
  - `producer_media` is empty, and `resolveMediaAssets` has no `studio` branch.
- **Reusable pieces.**
  - `animeListService` / `buildAnimeListFilters` already apply the `safe`
    floor and the cache key.
  - `mangaListService` does the same for manga.
  - The slug comes from `normalizeString` (same as `mapAnimeCard`).
  - `withStaleCache` handles cache + stale fallback.
  - `isPublicRoute` matches by prefix.
- **Layer rule.** `src/shared/` cannot import from `src/domains/`, and the
  sitemap needs anime and genre data. So the sitemap logic lives in a domain.

## 2. Decisions

1. **New domains `seo` and `producer`** (aliases `@seo`, `@producer` in
   `tsconfig.json`, `astro.config.mjs` and `vitest.config.ts`). Both follow the
   unit-folder layout. `seo` reads catalog tables through its own
   repositories. It never calls page code.
2. **Segment registry** (`@seo/config` → `SITEMAP_SEGMENTS`). Each segment
   has three parts:
   - `name`;
   - `count()`;
   - `page(n)`, which returns `{ path }[]`.

   Initial segments:
   - `static` (`/`, `/search`);
   - `anime`: `mal_id, title` where `rating` is not in `ADULT_RATINGS`, ordered
     by `mal_id`, with `LIMIT/OFFSET` pages of `SITEMAP_PAGE_SIZE = 10_000`;
   - `genres`: genre names not in `ADULT_MANGA_GENRES`, sent as
     `/search?genre=<encoded>`.

   A future page family (manga, producers) adds one entry. The proposal's
   non-goal keeps manga out until its pages exist.
3. **XML is built by a pure function** (`buildUrlSetXml`, `buildSitemapIndexXml`)
   with entity escaping and absolute URLs from `config.baseUrl`. It is
   unit-tested without the DB.
4. **Routes are Astro endpoints, not the JSON wrapper.**
   - `src/pages/sitemap.xml.ts`
   - `src/pages/sitemaps/[file].ts` (parses `<segment>-<n>.xml`; anything
     else is `404`)
   - `src/pages/robots.txt.ts`

   They set the content type and `Cache-Control: public, max-age=3600`. An
   `InfraError` with no cached copy returns `503` with `Retry-After`, as a
   plain body and not the JSON envelope. Each error still goes through
   `captureError`.
5. **Caching.** Each rendered XML string is cached through `withStaleCache`
   under `seo:sitemap:<segment>:<n>` (and `seo:sitemap:index`) with
   `CacheTtl.Long` (1 day). The catalog changes by ingestion batches, not per
   request.
6. **Producer name** = the `Default` title, else the first title by
   alphabetical order. This is computed in SQL (`DISTINCT ON`) so list sorting
   by name stays in the DB.
7. **Producer list query.**
   - `producer` LEFT JOINs a credit-count subquery per producer. It counts
     anime credits, plus manga credits for `serialization`, filtered by `role`
     when one is given.
   - `query` is `EXISTS (producer_title ILIKE %q%)`.
   - Sort: `works desc, mal_id asc`, or `name asc, mal_id asc`.
   - Only producers with ≥ 1 credit in the requested role are listed. Without
     a role, all producers are listed.
   - 2,988 rows need no new index. A trigram index on `producer_title.title`
     is deferred until a measured need.
8. **Works by producer reuse the list services.**
   - Anime: `animeListService.getAnimeList({ producer: [id], producerRole })`
     uses the new filter (an `EXISTS` on `anime_producer`). That gives the
     `safe` floor, sorting and caching for free.
   - Manga: a new **internal** normalized filter `producer` on
     `mangaFiltersSchema` (`EXISTS` on `manga_producer`). It is not exposed on
     `/api/manga` in this change.
   - Both routes first check that the producer exists, so an unknown id is a
     `404` and not an empty `200`.
9. **Anime list params.**
   - `producer` is a comma list of positive ints. It is validated in
     `animeFiltersParamsSchema`, and non-numeric values are `400`.
   - `producerRole` is `z.enum(['studio','producer','licensor'])`.
   - Both are normalized to arrays in `mapAnimeFilters` and folded into the
     cache key.
10. **Errors.** Add `PRODUCER_NOT_FOUND` (404) to `ErrorCodes` and a
    `producerNotFound` factory in `@producer/errors`.
11. **Public routes.** Add `/sitemap.xml`, `/sitemaps`, `/robots.txt` and
    `/api/producers` to `publicRoutes`. The middleware loads a session only
    when an auth cookie is present (`hasAuthCookie`). Crawlers send none, so
    they never touch the session table, and no extra skip list is needed.

## 3. Risks

- **Sitemap page cost.** A 10k-row `OFFSET` scan on `anime` is cheap at
  30k rows and is cached for a day. If the catalog grows by orders of
  magnitude, switch the pager to keyset (`mal_id > last`).
- **Name collisions.** Several producers can share a title. The API always
  keys by `mal_id`, and the name is display-only.
- **Crawler load on cold cache.** At most `ceil(30k/10k) + 3` pages need
  rendering. Each page is a single query, so there is no fan-out.
