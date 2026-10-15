## Purpose

Enforces owner-only visibility for private user profile sections (`preferences` and `history`) across both cached and uncached reads on `GET /api/user/:userId`.

## ADDED Requirements

### Requirement: Private profile sections are visible only to the owner

The system MUST evaluate `canViewUserPreferences` and `canViewUserHistory` for the requesting actor on every `GET /api/user/:userId` request, including when the target profile is served from cache.

#### Scenario: Owner reads own profile

- **WHEN** an authenticated user requests `GET /api/user/:userId` where `:userId` equals their session user ID
- **THEN** the response includes the user's full persisted `preferences` and `history.watchedAnimes`

#### Scenario: Anonymous or non-owner reads another user's profile after cache warm

- **WHEN** `user-a` warms the profile cache by reading `GET /api/user/user-a` and subsequently `user-b` or an anonymous caller requests `GET /api/user/user-a`
- **THEN** the response returns `user-a`'s public identity fields (`id`, `name`, `lastName`, `avatar`) with `preferences` and `history.watchedAnimes` redacted to empty defaults
