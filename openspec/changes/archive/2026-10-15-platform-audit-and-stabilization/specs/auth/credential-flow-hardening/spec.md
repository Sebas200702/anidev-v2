## Purpose

Hardens the email/password credential flow: registration and login responses do not allow account enumeration, the session secret travels only in the HttpOnly cookie, and client-visible errors never embed provider internals.

## ADDED Requirements

### Requirement: Registration does not reveal whether an email is registered

`POST /api/auth/register` MUST answer with a neutral outcome for the "email already exists" case (same status shape and message as a new registration, or an explicit product decision to notify by email instead), and MUST NOT echo provider error texts that distinguish it.

#### Scenario: Duplicate email is indistinguishable

- **WHEN** a client registers an email that already exists
- **THEN** the response body is indistinguishable from other registration failures, and the specific reason is only visible in server logs

### Requirement: Session tokens travel only in HttpOnly cookies

Login and registration responses MUST NOT include the session token in the JSON body; the session is established exclusively through the `HttpOnly`, `SameSite=Lax` cookie.

#### Scenario: Login response body has no token

- **WHEN** a client successfully logs in
- **THEN** the JSON `data` contains public user/session metadata and no `token` field

### Requirement: Auth error envelopes expose codes, not provider payloads

Auth failures MUST map to the domain's stable error codes and generic messages; the raw provider error object (status, headers, provider code) MUST live only in server-side logs (`cause`), never in client-visible `meta.details`.

#### Scenario: Wrong password returns a generic 401

- **WHEN** a login attempt uses a wrong password
- **THEN** the `401` body contains the stable auth code and a generic message with no provider payload in `meta.details`

#### Scenario: Credential mapping matches by stable provider code

- **WHEN** Better Auth rejects credentials (`INVALID_EMAIL_OR_PASSWORD`)
- **THEN** the mapping produces the documented `401` code path instead of falling through to an unrelated branch
