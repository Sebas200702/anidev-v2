## Purpose

Improves catalog search latency and recall by matching `anime_title_synonym` in free-text queries and executing list and count queries in parallel.

## MODIFIED Requirements

### Requirement: Indexed free-text relevance (Stage 1)

The system MUST match the free-text `query` against `anime.title`, `anime.title_english`, `anime.title_japanese`, and `anime_title_synonym.title` using indexed `pg_trgm` matching, and `animeListService.getAnimeList` MUST execute `getAnimeList` and `getAnimeListCount` concurrently via `Promise.all`.

#### Scenario: Free-text query returns ranked matches

- **WHEN** a client searches `GET /api/anime?query=cowboy`
- **THEN** matching anime are returned ranked by text relevance, using the index

#### Scenario: Free-text search matches a title synonym

- **WHEN** a client requests `GET /api/anime?query=Oregairu` where `"Oregairu"` exists only in `anime_title_synonym`
- **THEN** the parent anime is returned in the paginated results

#### Scenario: List and count queries run concurrently on cache miss

- **WHEN** `animeListService.getAnimeList` computes a cache miss
- **THEN** it invokes `animeListRepository.getAnimeList` and `animeListRepository.getAnimeListCount` in parallel with `Promise.all`
