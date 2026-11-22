# auth/google-oauth Specification

## Purpose

Let people sign in with their Google account without opening an account
takeover path while email ownership is unverified.

## Requirements

### Requirement: Google sign-in flow
When `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured, the system
SHALL serve `GET /api/auth/sign-in/google`. The route SHALL answer `302` to
Google's consent screen and set the OAuth state cookie. After the callback
(`GET /api/auth/callback/google`), the user SHALL be signed in with the
standard session cookie and redirected to `callbackURL`.

#### Scenario: New Google user
- **WHEN** a person with no account completes Google sign-in
- **THEN** a user, a `google` account and a profile (name and last name from
  Google, avatar from the Google picture) are created
- **AND** the browser lands on `callbackURL` signed in

#### Scenario: Open redirect attempt
- **WHEN** `callbackURL` is absolute or points to another origin
  (`https://evil.example`, `//evil.example`)
- **THEN** the flow redirects to `/` after sign-in

#### Scenario: Provider not configured
- **WHEN** the Google env vars are missing
- **THEN** the sign-in and link routes answer `404 PROVIDER_NOT_CONFIGURED`

### Requirement: No implicit account merge
A Google sign-in whose email matches an existing user without a Google
account SHALL NOT sign in to that user. It SHALL redirect to `callbackURL`
with `error=ACCOUNT_EXISTS_USE_PASSWORD`.

#### Scenario: Email already registered with a password
- **WHEN** `ana@example.com` has a password account and someone signs in with
  a Google account for the same email
- **THEN** no session is created for the existing user and the error is
  reported

### Requirement: Explicit linking
An authenticated user SHALL be able to link Google with
`GET /api/auth/link/google`. Later Google sign-ins SHALL then open that
account. Unauthenticated calls SHALL answer `401 AUTH_REQUIRED`.

#### Scenario: Link from settings
- **WHEN** a signed-in user completes the link flow
- **THEN** a `google` account row is attached to that user

### Requirement: Onboarding status in the session
`GET /api/auth/session` SHALL include `profileStatus`:
- `missing` when there is no profile row;
- `incomplete` when gender or birthday is empty;
- `complete` otherwise.

#### Scenario: Fresh Google user
- **WHEN** a Google user signs in for the first time
- **THEN** `profileStatus` is `incomplete` (gender and birthday are unknown)
