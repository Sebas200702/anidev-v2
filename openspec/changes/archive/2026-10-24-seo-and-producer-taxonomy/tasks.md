# Tasks — SEO base and producer taxonomy (backend)

> TDD-first: a failing Vitest test precedes each implementation step. One
> commit per task. Backend only: no pages or components.

## 1. Foundations

- [x] 1.1 Add aliases `@seo` and `@producer` (`tsconfig.json`,
      `astro.config.mjs`, `vitest.config.ts`). Add `PRODUCER_NOT_FOUND` to
      `ErrorCodes` and its HTTP mapping test (404).
- [x] 1.2 Add `/sitemap.xml`, `/sitemaps`, `/robots.txt` and `/api/producers`
      to `publicRoutes`. Write the tests first in `public-routes.test.ts`.

## 2. Sitemaps and robots (`@seo`)

- [x] 2.1 Pure XML builders (`buildUrlSetXml`, `buildSitemapIndexXml`) with
      escaping and absolute URLs. Unit tests.
- [x] 2.2 Repositories:
      - anime sitemap rows (`safe` floor, ordered by `mal_id`, paged) and
        their count;
      - genre names without adult genres.

      Unit tests with the drizzle mock, plus one integration spec on the
      seeded DB (adult row excluded).
- [x] 2.3 Segment registry + sitemap service with `withStaleCache`
      (`seo:sitemap:*`, `CacheTtl.Long`). Unit tests cover:
      - the index lists every page;
      - `404` for an unknown segment or page.
- [x] 2.4 Routes `src/pages/sitemap.xml.ts`, `src/pages/sitemaps/[file].ts`
      and `src/pages/robots.txt.ts` (content types, `Cache-Control`, `503`
      with `Retry-After` on `InfraError`). Route tests.

## 3. Producer taxonomy (`@producer`)

- [x] 3.1 Schemas (list query, detail, card responses) and types.
- [x] 3.2 Repositories:
      - list (role filter, title query, sort by works or name, count);
      - detail (name fallback, titles, counts per role).

      Unit tests, plus an integration spec against the real DB.
- [x] 3.3 Anime list filter `producer` / `producerRole`:
      - params schema;
      - `mapAnimeFilters`;
      - `EXISTS` in `buildAnimeListFilters`;
      - cache key.

      Tests: unit (SQL contains the subquery, `400` on bad id) + integration
      (studio filter).
- [x] 3.4 Internal manga filter `producer` (`EXISTS` on `manga_producer`).
      Unit test.
- [x] 3.5 Services (list, detail, works) with stale cache and
      `producerNotFound`. Unit tests.
- [x] 3.6 Routes:
      - `GET /api/producers`
      - `/api/producers/:malId`
      - `/api/producers/:malId/anime`
      - `/api/producers/:malId/manga`

      Route tests (`200`, `400`, `404`).

## 4. Verification, release & archive

- [x] 4.1 E2E (`e2e/api/seo.spec.ts`, `e2e/api/producers.spec.ts`):
      - sitemap index + anime page + `404`;
      - robots content;
      - seeded studio detail, its anime list, the anime filter, and `404`.

      Extend `e2e/fixtures/seed-*` with a seeded producer + credits.
- [x] 4.2 Full gate (`format → check → check:types → test → test:integration
      → test:e2e → build`), `AGENTS.md` public-routes line, release on the
      branch (`release:minor`), PR, merge, push the tag, archive (sync
      `seo/sitemap` and `producer/taxonomy` into `openspec/specs/`).
