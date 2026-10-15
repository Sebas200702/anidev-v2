# Spec Delta

## Purpose

Isolates provider execution in a separate deployment so provider code never runs in the main app process or in users browsers.

## ADDED Requirements

### Requirement: Provider code executes only in the isolated service

Provider modules SHALL execute only inside the isolated provider deployment, never in the main Astro/Bun process nor in client JavaScript.

#### Scenario: Main app handles a playback request

- **WHEN** a user requests episode sources or starts playback
- **THEN** the main app serves data from PostgreSQL without importing or evaluating any provider file

#### Scenario: Audit finds no dynamic code loading in the app

- **WHEN** the app codebase is scanned for `eval`, `new Function`, or runtime remote imports in provider paths
- **THEN** no such pattern exists in `src/domains/watch/providers/`

### Requirement: Remote invocation is HMAC-signed with expiry

Calls to the isolated service SHALL carry an HMAC-SHA256 signature over the request body plus a short-lived expiry timestamp.

#### Scenario: Valid signed scrape request succeeds

- **WHEN** ingestion posts a correctly signed request within its expiry window
- **THEN** the isolated service executes the matching provider and returns validated sources

#### Scenario: Missing or expired signature is rejected

- **WHEN** a request arrives unsigned, mis-signed, or past expiry
- **THEN** the service responds `401` without executing any provider

### Requirement: Outbound fetches enforce allowlist, timeout, and byte cap

The isolated service SHALL fetch only HTTPS URLs passing `assertSafeExternalUrl`, using GET with an 8s timeout and a response byte cap.

#### Scenario: Provider targets a blocked address

- **WHEN** a provider attempts to fetch a loopback, private, or link-local address
- **THEN** the fetch is blocked before connection and recorded as a provider error

#### Scenario: Upstream stalls or returns oversized body

- **WHEN** an upstream exceeds the timeout or byte cap
- **THEN** the fetch aborts cleanly and the provider run fails closed for that source

### Requirement: Isolated service uses least-privilege credentials and limits

The isolated deployment SHALL run without main-app secrets, with CPU/RAM limits and a Postgres role scoped to `episode_source` writes only.

#### Scenario: Credential audit of the isolated service

- **WHEN** the isolated service environment is inspected
- **THEN** it contains no `BETTER_AUTH_SECRET`, no user-table credentials, and its DB role cannot read auth or profile tables
