## Purpose

Keeps cache-first reads serving data during dependency outages: a cached entry is returned (marked stale) when the database recompute fails, and a down cache degrades to a direct database read instead of breaking the request.

## ADDED Requirements

### Requirement: Stale cache fallback on database failure
Cache-first reads SHALL return a previously cached value when recomputing the data fails due to a database outage, marking the response as stale.

#### Scenario: Cached value served when database is down
- **WHEN** a cached entry exists for a key and the database compute operation fails
- **THEN** the read returns the cached value and the response is flagged as stale

#### Scenario: Stale fallback not attempted without cache
- **WHEN** no cached entry exists and the database compute operation fails
- **THEN** the read surfaces the typed infrastructure error instead of fabricating data

### Requirement: Stale responses are explicitly flagged
Reads that serve stale data SHALL signal consumers that the data is stale so caches and clients can tell degraded from fresh data.

#### Scenario: Stale header on degraded response
- **WHEN** a read returns stale cached data
- **THEN** the response includes a stale indicator (e.g. `x-stale: true`) alongside the payload

### Requirement: Cache outage falls through to the database
When the cache backend is unreachable, cache-first reads SHALL degrade to misses so the read-through flow computes the data from the source of truth (database) without throwing.

#### Scenario: Cache down resolves as miss
- **WHEN** the cache backend is unreachable and a read-through wrapper runs
- **THEN** the read resolves from the database and returns the fresh result without error

#### Scenario: Cache write becomes a no-op
- **WHEN** the cache backend is unreachable and a read-through wrapper tries to store the computed result
- **THEN** the write completes without throwing and the computed value is still returned to the caller

### Requirement: Fresh reads are not flagged stale
Reads satisfied entirely by fresh computation (no stale fallback involved) SHALL NOT carry the stale indicator.

#### Scenario: Healthy dependency serves fresh data
- **WHEN** the database compute succeeds and a value is produced
- **THEN** the response contains fresh data with no stale indicator