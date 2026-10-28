## Purpose

Tell crawlers which public pages exist and which paths to skip, using only
pages that actually render and only content that passes the default parental
floor.

## ADDED Requirements

### Requirement: Sitemap index
The system SHALL serve `GET /sitemap.xml` as a sitemaps.org sitemap index that
lists one `<sitemap>` entry per page of every registered segment, with
absolute URLs built from `APP_BASE_URL`.

#### Scenario: Index lists every segment page
- **WHEN** a crawler requests `/sitemap.xml`
- **THEN** the response is `200` with `Content-Type: application/xml`
- **AND** it lists `/sitemaps/static-1.xml`, `/sitemaps/genres-1.xml` and one
  `/sitemaps/anime-<n>.xml` entry per page of the anime segment

### Requirement: Paged URL sets
The system SHALL serve `GET /sitemaps/<segment>-<n>.xml` as a sitemaps.org
URL set with at most 10,000 URLs per page, and SHALL answer `404` for an
unknown segment or a page number outside the segment's range.

#### Scenario: Anime segment page
- **WHEN** a crawler requests `/sitemaps/anime-1.xml`
- **THEN** each `<url>` points to an existing anime detail page
  (`/anime/<malId>/<slug>`), ordered by MAL id

#### Scenario: Adult works are excluded
- **WHEN** an anime fails the `safe` parental floor
- **THEN** it does not appear in any sitemap page

#### Scenario: Unknown segment or page
- **WHEN** a crawler requests `/sitemaps/unknown-1.xml` or `/sitemaps/anime-999.xml`
- **THEN** the response is `404`

### Requirement: Crawler directives
The system SHALL serve `GET /robots.txt` as `text/plain`. The file SHALL
allow crawling, disallow `/api/` and `/showcase`, and reference the absolute
sitemap index URL.

#### Scenario: robots.txt content
- **WHEN** a crawler requests `/robots.txt`
- **THEN** the body contains `Disallow: /api/`, `Disallow: /showcase` and
  `Sitemap: <APP_BASE_URL>/sitemap.xml`

### Requirement: Public and cacheable
Sitemaps and `robots.txt` SHALL be reachable without a session. They SHALL be
served from cache, and SHALL degrade to `503` with `Retry-After` when the
database is unavailable and no cached copy exists.

#### Scenario: Anonymous crawler
- **WHEN** a request without session cookies hits `/sitemap.xml`
- **THEN** it is not redirected to login
