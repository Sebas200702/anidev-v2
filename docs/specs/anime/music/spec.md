# anime/music Specification

## Purpose

Expose the openings and endings of an anime read-only over the public API,
each addressable by its music `id`, with the same theme fields `/full` returns.

## Requirements

### Requirement: Paginated music list per anime

The system SHALL serve `GET /api/anime/:malId/music` returning the anime's
openings and endings in theme order (`sequence` NULLS LAST, then `id`),
optionally filtered by a case-insensitive `type` (`opening` | `ending`) and
paginated by `page` (1–1 000, default 1) and `limit` (1–100, default 24). Each
item SHALL include `id`, `order`, `title`, `type`, `episodes` and `url`; the
response meta SHALL include `page`, `limit`, `total` (counting the filter) and
`hasNext`. Tracks that are neither an opening nor an ending (insert songs, …)
are not listed.

#### Scenario: Openings of an anime

- **WHEN** a client requests `/api/anime/1/music?type=opening`
- **THEN** the response is `200` with only `opening` items and `meta.total`
  equal to the anime's opening count

#### Scenario: Anime without music

- **WHEN** an existing anime has no music matching the request
- **THEN** the response is `200` with an empty list and `meta.hasNext` false

#### Scenario: Invalid filter or pagination

- **WHEN** `type` is not `opening` / `ending`, or `page` / `limit` is out of
  range
- **THEN** the response is `400 VALIDATION_ERROR`

### Requirement: Music detail

The system SHALL serve `GET /api/anime/:malId/music/:musicId` returning one
opening or ending of that anime with the same fields as a list item.

#### Scenario: Music of another anime

- **WHEN** `musicId` exists but is not linked to that anime as a theme, or does
  not exist
- **THEN** the response is `404 MUSIC_NOT_FOUND`

### Requirement: Consistent theme fields

`order`, `title`, `type`, `episodes` and `url` SHALL equal the values `/full`
exposes for the same theme: `order` is the theme number (`sequence`), falling
back to the 1-based position within its type; a missing title is
`Unknown Title`.

### Requirement: Missing anime

Both endpoints SHALL answer `404 ANIME_NOT_FOUND` when no anime exists for
`malId`.
