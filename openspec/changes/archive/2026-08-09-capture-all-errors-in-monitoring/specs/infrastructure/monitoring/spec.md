## ADDED Requirements

### Requirement: Server-side handled errors are reported to monitoring
The system SHALL report every handled application error to the active monitoring backend through the shared error-to-HTTP mapper, regardless of error class. Client-caused (4xx) errors SHALL be reported at `warning` level and server errors (5xx) at `error` level; existing HTTP responses are unchanged.

#### Scenario: Client error 4xx captured as warning
- **WHEN** a route produces a handled `ValidationError`, `AuthError`, or `DomainError` (HTTP 400/401/403/404)
- **THEN** the error is reported to the monitoring backend with `warning` level and the client still receives the standard JSON error envelope

#### Scenario: Server error 5xx captured as error
- **WHEN** a route produces an `InfraError` (503) or an unknown error (500)
- **THEN** the error is reported to the monitoring backend with `error` level and the client still receives the standard JSON error envelope

#### Scenario: Monitoring disabled no-ops
- **WHEN** no monitoring DSN is configured
- **THEN** error handling still returns the same HTTP responses and no reporting side effects occur

### Requirement: Browser monitoring captures client-side errors
The system SHALL initialize the Sentry browser SDK on every delivered page when a client-exposed monitoring DSN is configured, capturing global window errors and unhandled promise rejections in the browser.

#### Scenario: Client DSN configured
- **WHEN** a page is delivered and a public monitoring DSN is configured
- **THEN** the browser SDK initializes on page load and reports global errors and unhandled promise rejections to the monitoring backend

#### Scenario: Client DSN absent
- **WHEN** a page is delivered and no public monitoring DSN is configured
- **THEN** the page renders without loading the client monitoring SDK and no browser events are reported