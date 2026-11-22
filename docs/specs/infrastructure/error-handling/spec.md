# infrastructure/error-handling Specification

## Purpose

Maps infrastructure failures (database, cache, external APIs) to correct HTTP semantics — `503 Service Unavailable` with a `Retry-After` hint — and exposes the stable error code in the API envelope so clients and operators can distinguish which dependency is down versus a server bug.

## Requirements

### Requirement: Infrastructure errors map to 503 Service Unavailable
The system SHALL respond with HTTP `503 Service Unavailable` for any infrastructure error (`DB_ERROR`, `CACHE_ERROR`, `EXTERNAL_API_ERROR`), keeping the client-visible message generic while the original message and details remain in logs and monitoring.

#### Scenario: Database is down
- **WHEN** a route throws an infrastructure error with code `DB_ERROR`
- **THEN** the response has status `503`, a generic client-safe message, and the `DB_ERROR` code is retained for diagnosis

#### Scenario: Cache is down
- **WHEN** a route throws an infrastructure error with code `CACHE_ERROR`
- **THEN** the response has status `503` and the code is `CACHE_ERROR`

#### Scenario: External upstream is down
- **WHEN** a route throws an infrastructure error with code `EXTERNAL_API_ERROR`
- **THEN** the response has status `503` and the code is `EXTERNAL_API_ERROR`

### Requirement: Stable error code exposed in the envelope
The system SHALL expose the `code` of application errors in the error envelope so clients can branch on `DB_ERROR` vs `CACHE_ERROR` vs `UNKNOWN_ERROR` instead of parsing prose.

#### Scenario: Infrastructure error carries its code
- **WHEN** an infrastructure error is mapped
- **THEN** the JSON envelope includes `error.code` equal to the error's stable code

#### Scenario: Unknown error carries UNKNOWN_ERROR
- **WHEN** a non-application error (not a `BaseError`) is thrown
- **THEN** the envelope includes `error.code: UNKNOWN_ERROR` and status `500`

### Requirement: Unknown and non-infrastructure errors remain 500
The system SHALL keep HTTP `500` for unknown errors and any failure that is not an infrastructure dependency outage.

#### Scenario: Unexpected throwable maps to 500
- **WHEN** a handler throws a value that is not an application error
- **THEN** the response has status `500` with code `UNKNOWN_ERROR` and a generic message

### Requirement: 503 responses include a Retry-After header
The system SHALL include a `Retry-After` header on `503 Service Unavailable` responses so clients and load balancers know when to retry.

#### Scenario: Retry hint on outage
- **WHEN** a route returns `503`
- **THEN** the response includes a `Retry-After` header with a duration in seconds

### Requirement: Infra errors remain reported to monitoring
The system SHALL keep reporting infrastructure and unknown errors to the monitoring backend while mapping them, without changing client-visible responses.

#### Scenario: Outage reported but not leaked
- **WHEN** an infrastructure error is converted to a `503`
- **THEN** the error is captured by monitoring and the client still receives only the generic envelope

### Amended 2026-10-15 (`platform-audit-and-stabilization`)

### Requirement: Infrastructure errors map to 503 Service Unavailable

The system SHALL respond with HTTP `503 Service Unavailable` for any infrastructure error (`DB_ERROR`, `CACHE_ERROR`, `EXTERNAL_API_ERROR`), keeping the client-visible message generic and omitting internal `error.details` from the client JSON body while preserving them in logs and monitoring.

#### Scenario: Database is down

- **WHEN** a route throws an infrastructure error with code `DB_ERROR`
- **THEN** the response has status `503`, a generic client-safe message, and the `DB_ERROR` code is retained for diagnosis

#### Scenario: Cache is down

- **WHEN** a route throws an infrastructure error with code `CACHE_ERROR`
- **THEN** the response has status `503` and the code is `CACHE_ERROR`

#### Scenario: External upstream is down

- **WHEN** a route throws an infrastructure error with code `EXTERNAL_API_ERROR`
- **THEN** the response has status `503` and the code is `EXTERNAL_API_ERROR`

#### Scenario: Database or upstream URL details are not leaked on 503

- **WHEN** a route throws an `InfraError` containing internal query context or upstream URLs in `details`
- **THEN** the `503` response body omits `details` from `meta` while Pino and Rustrak receive the full `details` object

### Requirement: Stable error code exposed in the envelope

The system SHALL expose the `code` of application errors in the error envelope across all route wrappers—including `withZodValidation`, `withErrorHandling`, and `/media/[...path]`—so clients can branch on `VALIDATION_ERROR`, `DB_ERROR`, `CACHE_ERROR`, or `UNKNOWN_ERROR` consistently.

#### Scenario: Infrastructure error carries its code

- **WHEN** an infrastructure error is mapped
- **THEN** the JSON envelope includes `error.code` equal to the error's stable code

#### Scenario: Unknown error carries UNKNOWN_ERROR

- **WHEN** a non-application error (not a `BaseError`) is thrown
- **THEN** the envelope includes `error.code: UNKNOWN_ERROR` and status `500`

#### Scenario: Validation failure includes VALIDATION_ERROR code

- **WHEN** a request fails `withZodValidation`
- **THEN** the `400` JSON response envelope includes `code: 'VALIDATION_ERROR'` alongside `error` and `meta.details.issues`

#### Scenario: Media route infrastructure error includes code and Retry-After

- **WHEN** `GET /media/[...path]` encounters an `InfraError`
- **THEN** the `503` JSON response envelope includes `code` and the `Retry-After` HTTP header

## ADDED Requirements

### Requirement: Repository failures always surface as typed database errors

Every repository method MUST `await` its database promise inside its `try/catch` guard so database failures are wrapped by the shared error factory (`dbError`) with the operation context, instead of escaping as untyped rejections that map to `500 UNKNOWN_ERROR`.

#### Scenario: Character, staff, and music lookups fail typed

- **WHEN** the database rejects a query from `anime-characters`, `character`, `staff`, or `music` repositories
- **THEN** the caller receives the typed `InfraError` (`DB_ERROR`) with its operation tag, and the API maps it to `503`, not `500`

#### Scenario: Stalled query does not resolve after the response

- **WHEN** any repository issues a query
- **THEN** the promise is awaited within the guarded scope so no floating rejection escapes the wrapper
