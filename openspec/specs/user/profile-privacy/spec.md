## Purpose

Enforces owner-only visibility for private user profile sections (`preferences` and `history`) across both cached and uncached reads on `GET /api/user/:userId`, and keeps the profile read contract valid for every persisted row shape.

## ADDED Requirements

### Requirement: Private profile sections are visible only to the owner

The system MUST evaluate `canViewUserPreferences` and `canViewUserHistory` for the requesting actor on every `GET /api/user/:userId` request, including when the target profile is served from cache. `canViewUserPreferences` and `canViewUserHistory` MUST NOT remain dead code: the read path uses them to decide which sections the response includes (public DTO vs owner DTO).

#### Scenario: Owner reads own profile

- **WHEN** an authenticated user requests `GET /api/user/:userId` where `:userId` equals their session user ID
- **THEN** the response includes the user's full persisted `preferences` and `history.watchedAnimes`

#### Scenario: Anonymous or non-owner reads another user's profile after cache warm

- **WHEN** `user-a` warms the profile cache by reading `GET /api/user/user-a` and subsequently `user-b` or an anonymous caller requests `GET /api/user/user-a`
- **THEN** the response returns `user-a`'s public identity fields (`id`, `name`, `lastName`, `avatar`) with `preferences` and `history.watchedAnimes` redacted to empty defaults

#### Scenario: Anonymous read of a populated profile never leaks private sections

- **WHEN** an anonymous client requests `GET /api/user/:userId` for a profile whose row stores favorite genres, fanatic level, frequency, and watched anime IDs
- **THEN** the response is `200` and contains none of those private values

### Requirement: Profile reads tolerate every persisted row shape

The profile read contract MUST handle nullable persisted columns (`gender`, `birthday`, `avatar`, CSV preference columns) without failing: nullable identity fields are omitted or defaulted, malformed CSV entries are dropped, and no row shape produces `RESPONSE_VALIDATION_ERROR` or `500`.

#### Scenario: Profile row without gender

- **WHEN** a persisted profile has `gender = NULL`
- **THEN** `GET /api/user/:userId` responds `200` with the identity fields present and `gender` omitted

#### Scenario: Preference column with non-numeric entries

- **WHEN** a persisted `favorite_genres` value contains non-numeric segments
- **THEN** the response drops the invalid entries and validates against the response schema

### Requirement: Cache never stores payloads that fail the response contract or bypass authorization

Values written to the user-profile cache MUST satisfy the declared response schema, and cached reads MUST re-apply the actor projection so a cache hit can never widen visibility. A response payload that fails validation MUST NOT be cached.

#### Scenario: Invalid payload is not cached

- **WHEN** a read produces a payload that fails response validation
- **THEN** the error surfaces once and the invalid payload is absent from the cache on the next request

#### Scenario: Cached owner payload is reprojected for anonymous readers

- **WHEN** the owner warms the cache and an anonymous caller reads the same profile
- **THEN** the anonymous response is projected from the cached data without its private sections
