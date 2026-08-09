## Purpose

Provides a public readiness endpoint that detects dependency availability per-component (database and cache), returning an aggregated status so operators and load balancers can tell whether the app is merely alive or actually ready to serve traffic.

## ADDED Requirements

### Requirement: Public readiness endpoint
The system SHALL expose a public `GET /api/health/readiness` route that is reachable without authentication and responds using the standard API envelope.

#### Scenario: Readiness without session
- **WHEN** a client requests `GET /api/health/readiness` without a session
- **THEN** the route is treated as public and responds without redirecting to auth

#### Scenario: Response uses the API envelope
- **WHEN** the readiness endpoint responds
- **THEN** the body matches `{ data, status, meta }` with per-dependency status inside `data`

### Requirement: Dependency probes report per-component status
The readiness endpoint SHALL check the database (a trivial `SELECT 1`) and the cache (a SET+GET round-trip) and report the status of each dependency individually.

#### Scenario: All dependencies healthy
- **WHEN** the database and cache probes succeed
- **THEN** the response is `200` with `data` reporting both dependencies as healthy

#### Scenario: Database probe fails
- **WHEN** the database probe throws or times out
- **THEN** the response reports the database as down and includes it in the degraded list

#### Scenario: Cache probe fails
- **WHEN** the cache probe throws or times out
- **THEN** the response reports the cache as down and includes it in the degraded list

### Requirement: Aggregated status reflects readiness
The readiness endpoint SHALL return `200 OK` only when every dependency is healthy, and `503 Service Unavailable` when at least one dependency is down.

#### Scenario: Partial outage returns 503
- **WHEN** the database is healthy but the cache is down
- **THEN** the response has status `503` and the body identifies the cache as the failing dependency

#### Scenario: Full outage returns 503
- **WHEN** both the database and the cache are down
- **THEN** the response has status `503` and the body lists both failing dependencies

### Requirement: Probes never crash the endpoint
The readiness endpoint SHALL treat probe failures as degraded status (never an unhandled error or process crash), logging the failure and continuing to report the other dependencies.

#### Scenario: One probe fails while the other succeeds
- **WHEN** a single dependency probe fails
- **THEN** the endpoint still resolves with per-dependency status and warns via the logger

### Requirement: Liveness remains dependency-free
The existing `GET /api/health` liveness endpoint SHALL keep responding `200` without contacting dependencies, so it reflects process liveness only.

#### Scenario: Liveness works while dependencies are down
- **WHEN** the database and cache are both down
- **THEN** `GET /api/health` still returns `200 { status: 'ok' }` without probing dependencies