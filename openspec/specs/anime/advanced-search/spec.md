# anime/advanced-search Specification

## Purpose

Extends anime catalog search with data-backed filters (`season`, score range),
configurable sort, indexed free-text relevance, a parental-control floor modeled
as a coarse cache-key variant, and per-user search history — all on Stage-1 stock
Postgres, with the query layer swappable for later BM25/vector stages.

## Requirements

### Requirement: Extended, data-backed catalog filters

The system MUST let `GET /api/anime` filter by `season` (equality on the anime
season) and by a score range (`scoreMin` / `scoreMax`, each 0–10). Existing
filters (`genre`, `status`, `rating`, `type`, `year`, `query`, `page`, `limit`)
MUST keep working unchanged. Invalid values (e.g. `scoreMin > scoreMax`) MUST be
rejected at the request boundary.

#### Scenario: Filter by season and score range

- **WHEN** a client requests `GET /api/anime?season=spring&scoreMin=7&scoreMax=9`
- **THEN** the response contains only anime whose season matches and whose score
  is within `[7, 9]`, in the standard paginated envelope

#### Scenario: Invalid score range

- **WHEN** a client requests a score range where `scoreMin > scoreMax`
- **THEN** the system responds `400 VALIDATION_ERROR` and does not run a query

#### Scenario: Backward compatibility

- **WHEN** a client requests `GET /api/anime` with only the pre-existing params
- **THEN** the response **shape** and the behavior of those filters are unchanged
  from before this change — with the sole exception that the new parental-control
  **safe** floor now applies to anonymous and non-opted-in callers (see the
  parental-control requirement)

### Requirement: Configurable sort over a whitelist

The system MUST accept `sort` from the exact whitelist `{ score, year, title,
relevance }` (default `score`) and `order` from `{ asc, desc }` (default `desc`).
`order` supplied without `sort` MUST use the default sort. Values outside either
whitelist MUST be rejected. `relevance` MUST be valid only when `query` is present
and **non-empty after trimming whitespace**. Every sort MUST append a unique
secondary key (`malId`) so paginated results are deterministic across adjacent
pages. Raw sort input MUST NOT be interpolated into SQL.

#### Scenario: Sort by score descending

- **WHEN** a client requests `GET /api/anime?sort=score&order=desc`
- **THEN** results are ordered by score, highest first

#### Scenario: Relevance sort without a usable query

- **WHEN** a client requests `sort=relevance` with no `query`, or a
  whitespace-only `query`
- **THEN** the system responds `400 VALIDATION_ERROR`

#### Scenario: Unknown sort field

- **WHEN** a client requests a `sort` value outside the whitelist
- **THEN** the system responds `400 VALIDATION_ERROR`

#### Scenario: Deterministic pagination

- **WHEN** a client pages through the same sorted search via `LIMIT`/`OFFSET`
- **THEN** adjacent pages neither duplicate nor skip rows (ties broken by `malId`)

### Requirement: Indexed free-text relevance (Stage 1)

The system MUST match the free-text `query` against anime titles (and synonyms)
using an indexed `pg_trgm` / `tsvector` match instead of an unindexed `ILIKE`
scan. The API contract for `query` MUST remain unchanged so later ranking stages
(BM25/vector) can replace the implementation without an API change.

#### Scenario: Free-text query returns ranked matches

- **WHEN** a client searches `GET /api/anime?query=cowboy`
- **THEN** matching anime are returned ranked by text relevance, using the index

### Requirement: Parental-control floor as a cache variant

The system MUST exclude adult-rated anime by default (the `safe` variant) for
anonymous callers and authenticated users who have not opted in. Adult-rated
anime MUST be included only for an authenticated user whose preference opts in
(the `full` variant). Resolution MUST be **fail-closed**: if the opt-in
preference or the adult-ratings configuration cannot be read, the system MUST use
`safe` and MUST NOT select `full`. The parental variant MUST be a coarse
cache-key dimension (`safe` / `full`) and MUST NOT be keyed by user id.

> Note: no parental opt-in field exists on `profile` yet, so this change ships
> `safe`-only (fail-closed); enabling `full` requires a prerequisite migration.

#### Scenario: Anonymous caller gets the safe catalog

- **WHEN** an anonymous client searches the catalog
- **THEN** adult-rated anime are excluded from results

#### Scenario: Opted-in authenticated user sees full catalog

- **WHEN** an authenticated user who opted in searches the catalog
- **THEN** adult-rated anime are included

#### Scenario: Cache is not per-user

- **WHEN** two different users produce the same filters and parental variant
- **THEN** they resolve to the same cache entry (at most two variants per filter set)

### Requirement: Per-user search history

The system MUST record an authenticated user's executed searches (query + filters)
on a best-effort basis, and MUST expose authenticated, owner-only endpoints to
read recent searches and to clear them. Anonymous searches MUST NOT be persisted.
A failure to record history MUST NOT fail the search request. History responses
MUST NOT be cached (`private, no-store`).

**HTTP contract:** history endpoints MUST use the same response envelope/wrapper
as the anime API route. A read entry MUST expose `{ id, query, filters, createdAt }`,
ordered **newest-first**, bounded by a `limit` (default 20, max 100); an empty
history MUST return an empty list (`200`), not an error. Clear MUST return a
success envelope reporting the number of rows removed. Unauthenticated access MUST
return the standard `401` authentication-error envelope and touch no data.

#### Scenario: Search is recorded for an authenticated user

- **WHEN** an authenticated user runs a search
- **THEN** the search (query + filters) is stored against their user id

#### Scenario: Anonymous search is not recorded

- **WHEN** an anonymous client runs a search
- **THEN** no history row is written

#### Scenario: History write failure does not break search

- **WHEN** recording the history row fails
- **THEN** the search still returns its results successfully

#### Scenario: Owner reads and clears history

- **WHEN** an authenticated user calls read, then clear, on their search history
- **THEN** read returns their recent searches and clear deletes only their rows

#### Scenario: Unauthenticated history access

- **WHEN** an anonymous client calls the search-history read or clear endpoint
- **THEN** the system responds with an authentication error and touches no data