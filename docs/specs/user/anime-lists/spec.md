# user/anime-lists Specification

## Purpose

Provides authenticated users with relational anime list management (`watching`, `completed`, `plan_to_watch`, `on_hold`, `dropped`, `is_favorite`, `score`) backed by PostgreSQL foreign keys and atomic upserts.

## Requirements

### Requirement: Authenticated users can upsert and remove anime list entries

The system MUST allow an authenticated user to add, update, or remove an anime entry in their personal list keyed by `(user_id, anime_id)`, validating `status` against the allowed enum and optional `score` between `1` and `10`.

#### Scenario: Add or update an anime in the user's list

- **WHEN** an authenticated user sends `PUT /api/user/lists` with `{ animeId: 5114, status: 'watching', isFavorite: true, score: 10 }`
- **THEN** the system upserts the row in `user_anime_list` and returns `200` with the persisted entry in the standard envelope

#### Scenario: Remove an anime from the user's list

- **WHEN** an authenticated user sends `DELETE /api/user/lists` with `{ animeId: 5114 }`
- **THEN** the system deletes only that user's `(user_id, 5114)` entry and returns the previous entry snapshot so the client can offer an undo action

#### Scenario: Unauthenticated list mutation is rejected

- **WHEN** an anonymous client sends `PUT /api/user/lists` or `DELETE /api/user/lists`
- **THEN** the system responds with `401 AUTH_REQUIRED` and modifies no data

### Requirement: Authenticated users can query their lists filtered by status

The system MUST expose `GET /api/user/lists` returning the authenticated user's list entries hydrated with `AnimeCard` metadata, filterable by `status` and `isFavorite`, ordered by `updated_at DESC` with `Cache-Control: private, no-store`.

#### Scenario: Filter list by watching status

- **WHEN** an authenticated user requests `GET /api/user/lists?status=watching`
- **THEN** only entries with `status = 'watching'` for that user are returned, ordered most-recently-updated first
