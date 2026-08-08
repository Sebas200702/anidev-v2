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

### Requirement: Monitoring initializes before any request handling
The Astro server SHALL initialize the monitoring SDK before handling any request, including API endpoints, so log bridging and error capture are active for page and API traffic alike.

#### Scenario: API endpoint triggers SDK init
- **WHEN** the first request to the running server is an API endpoint (e.g. `GET /api/health`)
- **THEN** the SDK is initialized before the endpoint handler runs and logs from that handler are forwarded to the backend

#### Scenario: Page and middleware both call init
- **WHEN** both the Astro middleware and an SSR page attempt to initialize the SDK
- **THEN** the SDK is initialized exactly once and subsequent calls are no-ops
