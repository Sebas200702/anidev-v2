# Spec Delta

## Purpose

Guarantees the ingestion boundary so request-time traffic never executes provider code and only validated rows reach the catalog.

## ADDED Requirements

### Requirement: Request-time routes read only from PostgreSQL

All request-time catalog and media routes SHALL resolve episode sources exclusively from the `episode_source` table, never by invoking a provider.

#### Scenario: Episode sources endpoint serves from database

- **WHEN** a client requests episode sources for a known episode
- **THEN** the response is built from `episode_source` rows without any outbound provider fetch

### Requirement: Ingestion writes only validated provider output

Ingestion SHALL persist provider results only after contract validation, dropping invalid rows and logging provider, operation, and cause.

#### Scenario: Partial provider output with one invalid row

- **WHEN** a provider returns three valid sources and one malformed entry
- **THEN** the three valid rows are upserted and the invalid row is dropped with a logged warning

### Requirement: Provider failures degrade to empty sources

When all providers fail, time out, or the circuit is open, ingestion SHALL complete with empty sources rather than failing the app.

#### Scenario: All providers unreachable during ingest run

- **WHEN** every configured provider errors or the isolated service is down
- **THEN** the ingest run records the failure per provider and leaves existing `episode_source` rows unchanged
