## Purpose

Provides self-hosted error and performance monitoring compatible with the Sentry SDK surface, so error and trace reporting works against Rustrak (or any Sentry-SDK-compatible backend) while remaining a no-op when a DSN is absent.

## MODIFIED Requirements

### Requirement: Sentry-SDK-compatible monitoring init
The system SHALL expose `initServerSentry`, `initAstroSentry`, and `wrapReactComponentWithSentry` functions that initialize monitoring using the Sentry SDK pointed at a configurable DSN, and no-op when the DSN is unset.

#### Scenario: Monitoring enabled
- **WHEN** a valid monitoring DSN is configured
- **THEN** server and Astro contexts initialize the SDK with the environment profile and the React wrapper attaches an error boundary

#### Scenario: Monitoring disabled no-ops
- **WHEN** no DSN is configured
- **THEN** all monitoring functions return without side effects and the React wrapper passes the component through unchanged

### Requirement: Health check emits an explicit Sentry event
The public health endpoint SHALL emit an explicit Sentry event (`captureMessage`) on each request, independent of the Pino log bridge, to verify end-to-end connectivity to the configured monitoring backend.

#### Scenario: Health request with DSN configured
- **WHEN** a client requests `GET /api/health` and a monitoring DSN is configured
- **THEN** the endpoint sends an explicit `captureMessage` event to the backend in addition to the Pino log

#### Scenario: Health request without DSN
- **WHEN** a client requests `GET /api/health` and no monitoring DSN is configured
- **THEN** the endpoint still returns `200` and does not throw (Sentry no-ops)
