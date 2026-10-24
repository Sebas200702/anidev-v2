# anime/episodes Specification

## Purpose

Expose the per-anime episode catalog (number, title, duration, air date and
synopsis) read-only over the public API, independent of streaming sources.

## ADDED Requirements

### Requirement: Paginated episode list per anime

The system SHALL serve `GET /api/anime/:malId/episodes` returning the anime's
episodes ordered by episode number ascending, paginated by `page` (1–10 000,
default 1) and `limit` (1–100, default 24). Each item SHALL include `id`,
`number`, `title`, `duration`, `aired`, an `imageUrl` thumbnail link and its
`altImageText`; the response meta SHALL include
`page`, `limit`, `total` and `hasNext`.

#### Scenario: First page of a series

- **WHEN** a client requests `/api/anime/1/episodes?limit=2`
- **THEN** the response is `200` with the episodes numbered 1 and 2 in order,
  `meta.total` equal to the anime's episode count and `meta.hasNext` true when
  more episodes exist

#### Scenario: Page past the end

- **WHEN** a client requests a page beyond the last episode of an existing
  anime
- **THEN** the response is `200` with an empty list and `meta.hasNext` false

#### Scenario: Invalid pagination

- **WHEN** `page` or `limit` is outside its range or not an integer
- **THEN** the response is `400 VALIDATION_ERROR`

### Requirement: Episode detail

The system SHALL serve `GET /api/anime/:malId/episodes/:number` returning one
episode with `id`, `number`, `title`, `synopsis`, `duration`, `aired`,
`imageUrl` and `altImageText`.

#### Scenario: Existing episode

- **WHEN** a client requests an episode number that exists for the anime
- **THEN** the response is `200` with that episode, including its synopsis

#### Scenario: Missing episode of an existing anime

- **WHEN** the anime exists but has no episode with that number
- **THEN** the response is `404 EPISODE_NOT_FOUND`

### Requirement: Every episode links an image with alt text

Each episode payload SHALL carry `imageUrl` pointing at
`/media/episode/{id}/thumbnail` and a non-empty `altImageText`
(`Image for Episode {number}: {title}`). The link SHALL resolve to an image
even before thumbnails are ingested (the media placeholder).

#### Scenario: Thumbnail not yet ingested

- **WHEN** a client follows an episode `imageUrl` and no thumbnail is stored
- **THEN** the response is `200` with an image (the placeholder)

### Requirement: Unknown anime is not found

Both episode routes SHALL respond `404 ANIME_NOT_FOUND` when no anime exists
for `malId`, and SHALL NOT report it as an empty list.

#### Scenario: Unknown anime list

- **WHEN** a client requests episodes for a MAL id with no anime row
- **THEN** the response is `404 ANIME_NOT_FOUND`

### Requirement: Cached and stale-tolerant reads

Episode reads SHALL be cached in Dragonfly and, when the database is
unavailable, SHALL serve the last known payload flagged stale instead of
failing; not-found outcomes SHALL NOT be cached.

#### Scenario: Database outage with a warm stale copy

- **WHEN** the database fails and a stale copy exists for the requested page
- **THEN** the response is `200` with that payload and `meta.stale` true
