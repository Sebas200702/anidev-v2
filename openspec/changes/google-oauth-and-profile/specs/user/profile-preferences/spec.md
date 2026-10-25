## Purpose

Let the owner save the taste profile collected during onboarding. It feeds
recommendations in Fase 4.

## ADDED Requirements

### Requirement: Owner-only preferences update
The system SHALL serve `PATCH /api/user/:userId/preferences`, accepting any
non-empty subset of:
- `fanaticLevel` (`low | medium | high`);
- `frequency` (`daily | weekly | monthly`);
- `preferredFormat` (`tv | movie | ova | ona | special | music`);
- `favoriteGenres`, `favoriteStudios`, `favoriteAnimes`: arrays of positive
  MAL ids, unique, at most 50 each.

Only the profile owner SHALL be allowed. The response SHALL be the updated
profile, and later reads SHALL not be served from a stale cache.

#### Scenario: Owner saves preferences
- **WHEN** the owner sends `{ fanaticLevel: 'high', favoriteGenres: [1, 4] }`
- **THEN** the response is `200` with `preferences.fanaticLevel = 'high'` and
  `preferences.favoriteGenres = [1, 4]`

#### Scenario: Someone else's profile
- **WHEN** a signed-in user patches another user's preferences
- **THEN** the API answers `403` and nothing changes

#### Scenario: Unknown catalog ids
- **WHEN** `favoriteStudios` contains an id with no `producer` row (or
  `favoriteGenres` with no `genre` row, or `favoriteAnimes` with no `anime`)
- **THEN** the API answers `400 VALIDATION_ERROR` listing the unknown ids

#### Scenario: Empty body
- **WHEN** the body has no fields
- **THEN** the API answers `400 VALIDATION_ERROR`
