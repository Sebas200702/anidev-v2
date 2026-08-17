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