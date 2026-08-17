## Purpose

Centralizes the HTTP response contract in the route wrapper: `withErrorHandling` optionally validates the successful `data` payload against a domain response schema, so routes declare once and the wrapper guarantees the envelope never leaks a malformed body.

## ADDED Requirements

### Requirement: Route wrapper validates successful response data

The system MUST support validating a route's successful `data` payload against an optional Zod response schema passed to the route wrapper. When a schema is provided and `data` fails validation, the system MUST return an HTTP **500** response with code `RESPONSE_VALIDATION_ERROR` rather than a `200` with malformed data.

#### Scenario: Valid response data passes through unchanged

- **WHEN** a route provides a response schema and the handler returns `data` that satisfies the schema
- **THEN** the response is serialized normally with the standard success envelope and the handler's status/meta

#### Scenario: Invalid response data yields server error

- **WHEN** a route provides a response schema and the handler returns `data` that fails schema validation
- **THEN** the system responds with HTTP **500**, code `RESPONSE_VALIDATION_ERROR`, and a null `data` in the error envelope

#### Scenario: No response schema skips validation

- **WHEN** a route does not provide a response schema
- **THEN** the wrapper serializes the handler's `data` without validation (current behavior)

### Requirement: Malformed response maps to HTTP 500 with stable code

The error mapper MUST recognize `RESPONSE_VALIDATION_ERROR` as a server error (HTTP 500) reported at `error` severity, so malformed internal output is distinguishable from client-caused 4xx and from generic unknown errors.

#### Scenario: Response validation failure reported as server error

- **WHEN** `mapErrorToHttp` receives an error carrying code `RESPONSE_VALIDATION_ERROR`
- **THEN** it maps to HTTP **500** and reports at `error` severity via the monitoring pipeline

### Requirement: Routes declare response schema declaratively

Route handlers MUST NOT manually build error envelopes or parse response schemas when using the wrapper; they return `{ data, status, meta }` and the wrapper applies the declared response schema (or none).

#### Scenario: Handler returns plain data contract

- **WHEN** a route is composed as `withZodValidation(requestSchema)(withErrorHandling(handler, { responseSchema }))`
- **THEN** the handler only returns `{ data, status, meta }` and the wrapper handles serialization and validation
