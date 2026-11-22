## Purpose

Documents the shipped music catalog read surface (public list and detail endpoints backed by PostgreSQL + Dragonfly, with validated envelopes and graceful degradation) as a committed capability.

## ADDED Requirements

### Requirement: Public music list endpoint

`GET /api/music` SHALL be public, validate its query (bounded `limit`, valid `type` values, pagination), return the standard envelope `{ data: { list, total }, status, meta }`, and serve cached reads with the stale-fallback semantics of `infrastructure/resilience`.

#### Scenario: List returns validated page

- **WHEN** a client requests `GET /api/music?limit=20`
- **THEN** the response is `200` with the envelope validated by the response schema and cached for the configured TTL

#### Scenario: Out-of-range limit is rejected

- **WHEN** a client requests `GET /api/music?limit=100000`
- **THEN** the request fails validation with `400 VALIDATION_ERROR`

### Requirement: Public music detail endpoint

`GET /api/music/:id` SHALL validate the numeric id, return the mapped music detail (title, type, artists, versions/resolutions where present) in the standard envelope, and respond `404` with the domain's stable code when the id does not exist.

#### Scenario: Unknown music id is a typed 404

- **WHEN** a client requests `GET /api/music/999999`
- **THEN** the response is `404` with the music domain's not-found code and the standard envelope

#### Scenario: Malformed id is rejected before querying

- **WHEN** a client requests `GET /api/music/abc`
- **THEN** the request fails parameter validation with `400` and no database query runs
