# infrastructure/local-development Specification

## Purpose

Provides an isolated local instance of the full infrastructure stack (PostgreSQL, Dragonfly, Rustrak) orchestrated with docker-compose, using connection URLs and credentials separate from production so development and tests run without touching the production environment.

## Requirements

### Requirement: Local stack via docker-compose
The system SHALL provide a `docker-compose` definition that runs PostgreSQL, Falcon Dragonfly, and Rustrak locally as a self-contained, isolated instance.

#### Scenario: Single command starts the local stack
- **WHEN** a developer runs the docker-compose command for the local stack
- **THEN** PostgreSQL, Dragonfly, and Rustrak start with their own local ports and volumes

#### Scenario: Services isolated from production
- **WHEN** the local stack is running
- **THEN** its connection URLs, ports, and credentials differ from the production environment so no production data is touched

### Requirement: Local connection configuration
The system SHALL provide documented local connection values (database URL, cache URL, monitoring DSN) tailored to the local docker-compose instance, distinct from production values.

#### Scenario: Local env values ready to use
- **WHEN** a developer initializes the local environment
- **THEN** the configuration points the application at the local PostgreSQL, Dragonfly, and Rustrak services without exposing production credentials

### Requirement: Health and readiness
The docker-compose definition SHALL expose health checks so the application can start once the local services are ready.

#### Scenario: Readiness gated startup
- **WHEN** the local stack starts
- **THEN** services report health and the application is able to connect once dependencies are ready
### Requirement: Local services start with bounded resources
Every service in the local stack SHALL start with resource limits it can satisfy
on an ordinary developer machine, independent of how many CPU cores the host
reports. A service MUST NOT refuse to boot because a host-derived default demands
more memory than the machine can back.

#### Scenario: Cache service on a many-core host
- **WHEN** a developer starts the local stack on a host with many CPU cores
- **THEN** the cache service starts successfully, because its thread count and
  memory budget are pinned in the stack definition rather than derived from the
  core count

#### Scenario: Application connects to the local cache
- **WHEN** the local stack is up and the application performs a cached read
- **THEN** the cache accepts the connection instead of failing the request with a
  connection error caused by a restarting service
