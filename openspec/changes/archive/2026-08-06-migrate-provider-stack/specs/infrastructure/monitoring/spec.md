## Purpose

Provides self-hosted error and performance monitoring compatible with the Sentry SDK surface, so error and trace reporting works against Rustrak (or any Sentry-SDK-compatible backend) while remaining a no-op when a DSN is absent.

## ADDED Requirements

### Requirement: Sentry-SDK-compatible monitoring init
The system SHALL expose `initServerSentry`, `initAstroSentry`, and `wrapReactComponentWithSentry` functions that initialize monitoring using the Sentry SDK pointed at a configurable DSN, and no-op when the DSN is unset.

#### Scenario: Monitoring enabled
- **WHEN** a valid monitoring DSN is configured
- **THEN** server and Astro contexts initialize the SDK with the environment profile and the React wrapper attaches an error boundary

#### Scenario: Monitoring disabled no-ops
- **WHEN** no DSN is configured
- **THEN** all monitoring functions return without side effects and the React wrapper passes the component through unchanged

### Requirement: Self-hosted backend target
The monitoring DSN SHALL be able to point at a self-hosted backend compatible with the Sentry SDK (e.g. Rust Rak), replacing the third-party-hosted Sentry endpoint.

#### Scenario: DSN points to self-hosted backend
- **WHEN** the configured DSN targets the self-hosted backend
- **THEN** error and trace reports are sent to that backend using the standard Sentry protocol

### Requirement: Environment-aware reporting
The monitoring layer SHALL tag reports with the runtime `NODE_ENV` and apply a fixed trace sampling rate for cost control.

#### Scenario: Environment tagged
- **WHEN** the backend records a report
- **THEN** it surfaces the running environment alongside the error or trace

### Requirement: Runtime never throws
The monitoring functions SHALL never throw in runtime, including when the monitoring backend is unavailable, so an outage cannot crash the application.

#### Scenario: Backend unreachable does not crash
- **WHEN** the monitoring backend is unreachable and an error occurs
- **THEN** the application continues serving without propagating a monitoring error

#### Scenario: No DSN keeps behavior no-op
- **WHEN** no DSN is configured
- **THEN** all monitoring functions return without side effects and never throw