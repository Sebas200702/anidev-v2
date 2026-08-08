# infrastructure/monitoring Specification

## Purpose

Provides self-hosted error and performance monitoring compatible with the Sentry SDK surface, so error and trace reporting works against Rustrak (or any Sentry-SDK-compatible backend) while remaining a no-op when a DSN is absent.

## Requirements

### Requirement: Sentry-SDK-compatible monitoring init
The system SHALL expose `initServerSentry`, `initAstroSentry`, and `wrapReactComponentWithSentry` functions that initialize monitoring using the Sentry SDK pointed at a configurable DSN, and no-op when the DSN is unset.

#### Scenario: Monitoring enabled
- **WHEN** a valid monitoring DSN is configured
- **THEN** server and Astro contexts initialize the SDK with the environment profile and the React wrapper attaches an error boundary

#### Scenario: Monitoring disabled no-ops
- **WHEN** no DSN is configured
- **THEN** all monitoring functions return without side effects and the React wrapper passes the component through unchanged

### Requirement: Monitoring initializes before any request handling
The Astro server SHALL initialize the monitoring SDK before handling any request, including API endpoints, so log bridging and error capture are active for page and API traffic alike.

#### Scenario: API endpoint triggers SDK init
- **WHEN** the first request to the running server is an API endpoint (e.g. `GET /api/health`)
- **THEN** the SDK is initialized before the endpoint handler runs and logs from that handler are forwarded to the backend

#### Scenario: Page and middleware both call init
- **WHEN** both the Astro middleware and an SSR page attempt to initialize the SDK
- **THEN** the SDK is initialized exactly once and subsequent calls are no-ops

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

### Requirement: Health check emits an explicit Sentry event
The public health endpoint SHALL emit an explicit Sentry event (`captureMessage`) on each request, independent of the Pino log bridge, to verify end-to-end connectivity to the configured monitoring backend.

#### Scenario: Health request with DSN configured
- **WHEN** a client requests `GET /api/health` and a monitoring DSN is configured
- **THEN** the endpoint sends an explicit `captureMessage` event to the backend in addition to the Pino log

#### Scenario: Health request without DSN
- **WHEN** a client requests `GET /api/health` and no monitoring DSN is configured
- **THEN** the endpoint still returns `200` and does not throw (Sentry no-ops)
