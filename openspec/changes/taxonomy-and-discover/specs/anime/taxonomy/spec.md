## Purpose

Let users browse the catalog by taxonomy: a `/search` page that filters by
genre (plus free-text query, sort, and pagination) over the existing anime
list pipeline, so genre pills across the site resolve to real content.

## ADDED Requirements

### Requirement: Discover page filters by genre

The system SHALL serve `GET /search` accepting `genre`, `query`, `page`,
`limit`, `sort`, and `order`, delegating to `animeListService.getAnimeList`
and rendering one `AnimeCard` per result with server-rendered pagination
links. Invalid params SHALL return `400` via the shared validation envelope.

#### Scenario: Genre pill resolves

- **WHEN** a user opens `/search?genre=Action`
- **THEN** the page responds `200` with a single `h1` and only anime tagged
  Action, plus pagination preserving the active filter

#### Scenario: Unknown genre is an empty result, not an error

- **WHEN** a user opens `/search?genre=No-Such-Genre`
- **THEN** the page responds `200` with an empty-state message and no cards

#### Scenario: Invalid pagination is rejected

- **WHEN** a user opens `/search?page=10001`
- **THEN** the page responds `400`
