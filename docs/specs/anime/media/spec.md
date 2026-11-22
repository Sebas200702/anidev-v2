# anime/media Specification

## Purpose

Expose the media assets of an anime (posters, banners, …) read-only over the
public API as on-site `/media` proxy URLs, so clients never load upstream hosts
directly.

## Requirements

### Requirement: Paginated media list per anime

The system SHALL serve `GET /api/anime/:malId/media` returning the anime's
media assets in preference order (`priority`, then `id`), optionally filtered
by a case-insensitive `type` (1–32 chars) and paginated by `page` (1–1 000,
default 1) and `limit` (1–100, default 24). Each item SHALL include `id`,
`mediaType`, `size` (`small` | `large` | `default`), `source` (detected from
the asset host) and `url`; the response meta SHALL include `page`, `limit`,
`total` (counting the filter) and `hasNext`.

#### Scenario: Banners of an anime

- **WHEN** a client requests `/api/anime/1/media?type=banner`
- **THEN** the response is `200` with only `banner` assets and `meta.total`
  equal to the anime's banner count

#### Scenario: Anime without media

- **WHEN** an existing anime has no media matching the request
- **THEN** the response is `200` with an empty list and `meta.hasNext` false

#### Scenario: Invalid filter or pagination

- **WHEN** `type` is empty or too long, or `page` / `limit` is out of range
- **THEN** the response is `400 VALIDATION_ERROR`

### Requirement: Media detail

The system SHALL serve `GET /api/anime/:malId/media/:mediaId` returning one
asset of that anime with the same fields as a list item.

#### Scenario: Asset of another anime

- **WHEN** `mediaId` exists but belongs to a different anime, or does not exist
- **THEN** the response is `404 MEDIA_NOT_FOUND`

### Requirement: Stable proxy URLs

Each `url` SHALL be `/media/anime/{malId}/{type}/{size}/{index}?source={source}`,
where `index` is the 1-based position of the asset inside its
(type, size, source) group across **all** of the anime's media, so filtering
or paginating never changes which asset a URL resolves to, and the list and
detail endpoints return the same URL for the same asset.

### Requirement: Missing anime

Both endpoints SHALL answer `404 ANIME_NOT_FOUND` when no anime exists for
`malId`.
