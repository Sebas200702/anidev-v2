# Spec Delta

## Purpose

Defines the static provider interface and registry semantics so any first-party source resolves episodes to the same validated shape.

## ADDED Requirements

### Requirement: Provider modules implement the static contract

Provider modules SHALL expose `providerId`, `displayName`, `priority`, and `resolveEpisodeSources` matching the shared contract schema.

#### Scenario: Valid provider module loads

- **WHEN** the loader reads a provider file declaring the required fields with valid types
- **THEN** the module is accepted into the registry ordered by ascending `priority`

#### Scenario: Invalid provider module is rejected

- **WHEN** a provider file omits a required field or violates the contract schema
- **THEN** the loader rejects it, logs the validation error, and excludes it from the registry

### Requirement: Resolved sources match the normalized shape

`resolveEpisodeSources` SHALL return `sources` and `subtitles` matching `normalizedSourceSchema` with HTTPS URLs and bounded enums.

#### Scenario: Well-formed resolution is accepted

- **WHEN** a provider returns entries with HTTPS URLs and allowed `format`, `quality`, and `audio` values
- **THEN** the entries pass validation and proceed to persistence

#### Scenario: Malformed resolution is dropped

- **WHEN** a provider returns a non-HTTPS URL or an out-of-enum value
- **THEN** that entry is dropped and logged without failing the whole batch

### Requirement: Public repo ships no concrete third-party provider

The app repository SHALL contain no third-party site domains, resolvers, or credentials; only the contract, executors, and an `example-*` fixture.

#### Scenario: Clean clone has zero streaming sources

- **WHEN** `PROVIDER_PATHS` is empty on a fresh clone
- **THEN** the registry resolves to an empty list and catalog reads are unaffected
