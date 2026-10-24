# Proposal: SEO base and producer taxonomy (backend)

## Problem

Two roadmap items are still open on the backend:

- **Fase 0 — SEO base.** There is no `sitemap.xml` or `robots.txt`. Crawlers
  only find pages they reach by links, and nothing tells them to keep out of
  `/api/*` or `/showcase`.
- **Fase 1 — taxonomy by studio/producer.** The catalog has 2,988 producers.
  `anime_producer` holds 60,720 links (studio 20,128, producer 34,283, licensor
  6,309), and `manga_producer` holds 51,749 serialization links. None of it is
  queryable through the API. A client cannot list a studio's works or filter
  the anime list by studio.

## Scope

Backend only. Pages and components belong to the UI owner, who consumes this
API contract.

1. **Sitemaps**
   - `GET /sitemap.xml` is a sitemap index.
   - `GET /sitemaps/<segment>-<n>.xml` are paged URL sets.
   - The first segments are `static` (`/`, `/search`), `anime` (every anime
     detail page that passes the `safe` parental floor) and `genres`
     (`/search?genre=<name>`).
   - Segments come from a registry, so a new page family (manga, producers)
     adds one entry.
2. **`GET /robots.txt`**
   - Allows crawling.
   - Disallows `/api/` and `/showcase`.
   - Points to the sitemap index on `APP_BASE_URL`.
3. **Producer API** (new `producer` domain, alias `@producer`)
   - `GET /api/producers`: paginated list with optional `query` (title match),
     `role` (`studio | producer | licensor | serialization`) and sort by work
     count or name.
   - `GET /api/producers/:malId`: default name, alternative titles,
     established date, about, and work counts per role.
   - `GET /api/producers/:malId/anime?role=`: anime cards credited to the
     producer, paginated, with the `safe` floor applied.
   - `GET /api/producers/:malId/manga`: printed works it serialized,
     paginated, with the `safe` floor applied.
4. **Anime list filter.** `GET /api/anime` gains `producer=<ids>` (comma list
   of MAL ids) and `producerRole=<role>`. This makes "anime by studio X" one
   query, and the cache key includes the new filters.
5. **Middleware.** `/sitemap.xml`, `/sitemaps` and `/robots.txt` become public
   routes, and so does `/api/producers`.

## Non-goals

- Producer, studio or manga **pages**, and links to them from existing pages.
  These are UI work. The sitemap registry lets that work add its segment
  without touching this change.
- Manga sitemap segment. `/manga/*` pages do not exist yet, and listing URLs
  that return 404 hurts crawling.
- Structured data (JSON-LD) on pages. That is UI/layout work.
- Producer logos. `producer_media` is empty and `/media` has no `studio`
  resolver. Both belong in a later change, after the images are ingested.

## Breaking changes

None. All routes and query params are additive.
