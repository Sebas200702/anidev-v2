## Purpose

Provides a public health endpoint that returns service liveness and deterministically exercises the structured log pipeline, so the Pino → Sentry/Rustrak bridge can be verified end-to-end.

## ADDED Requirements

### Requirement: Public health endpoint
The system SHALL expose a public `GET /api/health` route that is reachable without authentication and returns a `200 OK` response using the standard API envelope.

#### Scenario: Health request succeeds
- **WHEN** a client requests `GET /api/health` without a session
- **THEN** the route responds `200` with a JSON envelope containing `data` and `status: 200`

#### Scenario: Health route is public
- **WHEN** the auth middleware evaluates `/api/health`
- **THEN** the pathname is treated as public and does not require a session

### Requirement: Health check emits an info log
The health endpoint SHALL emit an `info`-level structured log via the application logger on every request, which is forwarded to the configured monitoring backend through the Pino bridge.

#### Scenario: Info log emitted on health call
- **WHEN** a client requests `GET /api/health` and the monitoring DSN is configured
- **THEN** the logger records an `info`-level event that the monitoring bridge forwards to the backend

#### Scenario: Info log emitted without DSN
- **WHEN** a client requests `GET /api/health` and no monitoring DSN is configured
- **THEN** the endpoint still logs to stdout at `info` level without throwing
