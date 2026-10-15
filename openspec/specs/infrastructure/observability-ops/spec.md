## Purpose

Defines what the platform emits so an operator can run it: structured correlated logs without PII, per-route latency/availability signals, alert rules versioned in the repo, and documented recovery procedures.

## ADDED Requirements

### Requirement: Every request produces a structured, correlated log line

The server SHALL log one structured access line per handled request (method, route, status, duration, `x-request-id`, actor class) at `info` level, with the request ID bound to child loggers so errors and access lines correlate.

#### Scenario: One access line per request with correlation

- **WHEN** a client requests `GET /api/anime?query=x` and the handler logs an error
- **THEN** both the access line and the error line carry the same `x-request-id` value

### Requirement: Logs and monitoring events redact credentials and personal data

The logger and monitoring configuration SHALL redact secrets (tokens, cookies, authorization headers) and personal data (emails) from logs and Sentry events, and auth error envelopes SHALL NOT include provider-internal payloads in client-visible `meta.details`.

#### Scenario: Failed login does not leak the attempted email to monitoring

- **WHEN** a login attempt fails for `victim@example.com`
- **THEN** the emitted monitoring event and logs do not contain the raw email in cleartext fields

#### Scenario: Session token never appears in logs or response bodies

- **WHEN** any request is handled
- **THEN** no log line contains a session token value

### Requirement: Availability and latency are measurable per route

The system SHALL expose, at minimum, the readiness endpoint (per-dependency status) and emit request status/duration signals sufficient to compute error rate and p95 latency per route group (pages, `/api/*`, `/media/*`), so alerts can be defined on impact rather than raw noise.

#### Scenario: Error-rate alert inputs exist

- **WHEN** the operator wants to alert on 5xx rate for `/api/*`
- **THEN** the exported logs/events allow computing 5xx counts per route group over a window

### Requirement: Alert rules and recovery runbooks are versioned

Alert definitions (recommended Rustrak/Sentry rules with thresholds) and operational runbooks (backup/restore verification, incident procedure, rollback strategy for app and migrations) SHALL live in the repository and be updated with the system.

#### Scenario: Restore procedure is documented and tested

- **WHEN** an operator needs to restore the database from backup
- **THEN** a versioned runbook describes the exact steps, and a restore drill has been performed and recorded at least once before the release is deemed stable

#### Scenario: Rollback path exists for a bad release

- **WHEN** a deployed release is faulty
- **THEN** the runbook identifies the previous image tag, the database migration policy (additive-only, no destructive steps in a release), and the rollback commands
