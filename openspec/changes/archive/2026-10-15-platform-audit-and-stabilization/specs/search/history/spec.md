## Purpose

Documents the shipped per-user search history (owner-scoped record, read, and clear endpoints with bounded growth) as a committed capability.

## ADDED Requirements

### Requirement: Search history is owner-scoped

`GET /api/search-history` and `DELETE /api/search-history` SHALL require an authenticated session and operate exclusively on the caller's rows (`Cache-Control: private, no-store`); no endpoint may read or clear another user's history.

#### Scenario: Anonymous read is refused

- **WHEN** a client without a session requests `GET /api/search-history`
- **THEN** the response is `401 AUTH_REQUIRED` and no rows are returned

#### Scenario: Responses are never cached by intermediaries

- **WHEN** an authenticated client reads its history
- **THEN** the response carries `Cache-Control: private, no-store`

### Requirement: History growth is bounded per user

Recording a search SHALL keep at most the configured per-user cap of newest rows, enforced atomically (see `infrastructure/database` transaction requirement), and recording SHALL remain best-effort: failures never surface as request errors.

#### Scenario: Cap holds under concurrent records

- **WHEN** many records race for the same user
- **THEN** the stored rows for that user stay within the cap and ordering remains newest-first

#### Scenario: Recording failure does not break the search

- **WHEN** the history insert fails while serving `GET /api/anime`
- **THEN** the search response is still served successfully and the failure is logged as a warning
