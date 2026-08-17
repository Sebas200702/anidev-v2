# infrastructure/cache Specification

## Purpose

Provides a Redis-compatible caching layer backed by a Redis-compatible store such as Dragonfly, exposing typed get, set, delete, TTL, and read-through primitives to domain layers.

## Requirements

### Requirement: Redis-compatible cache client
The system SHALL expose a singleton Redis-compatible client configured from a `REDIS_URL` connection string, serving cache get/set/del/read-through operations.

#### Scenario: Client connects to cache backend
- **WHEN** the application imports the cache module with a valid `REDIS_URL`
- **THEN** it provides a working cache client for read and write operations

#### Scenario: Missing connection fails fast
- **WHEN** `REDIS_URL` is absent or invalid
- **THEN** environment validation rejects the module before any cache use

### Requirement: JSON-serialized cache primitives
The cache primitives SHALL store values as JSON strings and deserialize them on read, preserving the existing `cacheGet`/`cacheSet`/`cacheDel` semantics.

#### Scenario: Round-trip a cached value
- **WHEN** a caller sets a value with a TTL and then reads it back before expiry
- **THEN** the value round-trips with the same serialized/deserialized shape

#### Scenario: Miss returns null
- **WHEN** a caller reads a key that does not exist
- **THEN** `cacheGet` resolves `null`, making the caller fall back to source-of-truth compute

#### Scenario: TTL expiry honored
- **WHEN** a value is stored with a TTL in seconds
- **THEN** the key expires after that duration and subsequent reads return a miss

### Requirement: Read-through wrapper retained
The system SHALL retain the `withCache` read-through wrapper for compute-on-miss with optional caching.

#### Scenario: Cache miss triggers compute
- **WHEN** `withCache` runs and the input key misses
- **THEN** the compute delegate runs, returning the fresh result and storing it unless the caller opts out

### Requirement: Dragonfly compatibility
The cache client SHALL connect to a Redis-compatible backend (Dragonfly) using standard Redis protocol commands, replacing the previous HTTP REST transport.

#### Scenario: Commands use native Redis semantics
- **WHEN** the cache performs operations
- **THEN** it uses standard Redis protocol semantics accepted by Dragonfly

### Requirement: Cache failure degrades to fallback
When the cache backend is unavailable, the cache operations SHALL NOT propagate errors to callers; reads degrade to a miss and writes become no-ops so the application falls back to the source of truth (the database).

#### Scenario: Read degrades to miss on outage
- **WHEN** the cache backend is unreachable and a caller reads a key
- **THEN** the read resolves `null` (a cache miss) without throwing, so the caller falls back to the database

#### Scenario: Write becomes no-op on outage
- **WHEN** the cache backend is unreachable and a caller writes a value
- **THEN** the write completes without throwing and does not persist, while the application continues normally

#### Scenario: Read-through falls back to database
- **WHEN** `withCache` runs while the cache is down
- **THEN** the compute delegate (database) produces the result and the wrapper returns it without error