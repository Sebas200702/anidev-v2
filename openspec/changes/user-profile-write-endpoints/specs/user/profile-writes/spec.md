## Purpose

Lets an authenticated user create their application profile and partially update identity fields, with owner-only authorization, validated inputs, consistent API responses, and cache coherence after successful writes.

## ADDED Requirements

### Requirement: Authenticated owner can create a profile

The system MUST allow an authenticated user to create exactly one profile for their own account when no profile row exists yet. The create request MUST reject unauthenticated callers. The create request MUST NOT allow creating a profile for a different user id than the session actor.

#### Scenario: Successful create

- **WHEN** an authenticated user submits a valid create profile payload and no profile exists for that user
- **THEN** the system persists the profile identity fields and returns `201` with the mapped profile in the standard API envelope

#### Scenario: Create without session

- **WHEN** an unauthenticated client attempts to create a profile
- **THEN** the system responds with an authentication error and does not persist a row

#### Scenario: Create when profile already exists

- **WHEN** an authenticated user attempts to create a profile and a profile already exists for that user
- **THEN** the system responds with a conflict error and does not overwrite the existing profile

### Requirement: Authenticated owner can partially update identity fields

The system MUST allow an authenticated user to partially update their own profile identity fields (`name`, `lastName`, `avatar`, `birthday`, `gender`). The system MUST reject updates targeting another user’s id. The system MUST reject unauthenticated update attempts. Unspecified fields MUST remain unchanged.

#### Scenario: Successful partial update

- **WHEN** an authenticated owner submits a valid partial identity payload for their own `userId`
- **THEN** the system updates only the provided fields and returns `200` with the full mapped profile in the standard API envelope

#### Scenario: Update another user’s profile

- **WHEN** an authenticated user attempts to update a `userId` that is not their own
- **THEN** the system responds with an authorization error and does not change the target profile

#### Scenario: Update missing profile

- **WHEN** an authenticated owner attempts to update their profile and no profile row exists
- **THEN** the system responds with a not-found error

#### Scenario: Update without session

- **WHEN** an unauthenticated client attempts to update a profile
- **THEN** the system responds with an authentication error and does not persist changes

### Requirement: Write requests are validated at the boundary

The system MUST validate create and update request shapes before invoking domain services. Invalid bodies or params MUST yield a client validation error without partial persistence.

#### Scenario: Invalid create body

- **WHEN** a create request omits a required identity field or supplies an invalid value
- **THEN** the system responds with a validation error and does not persist a profile

#### Scenario: Invalid update body

- **WHEN** an update request supplies an empty body or invalid field values
- **THEN** the system responds with a validation error and does not persist changes

### Requirement: Successful writes invalidate profile cache

After a successful create or update, the system MUST invalidate any cached profile entry for the affected user id so a subsequent read does not return a pre-write snapshot for that key.

#### Scenario: Cache bust after update

- **WHEN** an owner successfully updates their profile and a cached profile entry existed for that user
- **THEN** the system removes or otherwise invalidates that cache entry as part of the write path

#### Scenario: Read after write sees fresh data

- **WHEN** an owner successfully updates a field and then a profile read is performed for that user without relying on a stale cache entry
- **THEN** the returned profile reflects the updated field values

### Requirement: Create and update do not mutate preferences or history via this API

Identity create/update endpoints in this capability MUST NOT accept or apply changes to preferences or watch-history fields. Those fields MAY be present on read responses per existing read behavior but MUST remain unchanged by these write operations.

#### Scenario: Preferences unchanged on identity patch

- **WHEN** an owner patches only identity fields
- **THEN** stored preference and history values remain as they were before the patch
