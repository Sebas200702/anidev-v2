## Purpose

Ensures every API route and validation wrapper returns the complete error envelope with `code` and transport headers while keeping internal `InfraError` details out of client-facing 503 responses.

## MODIFIED Requirements

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
