# anime/catalog-coverage Specification

## Purpose

Define the anime catalog fields that Track D ingestion must be able to store —
studio/licensor/producer roles, broadcast schedule, trailer, aired window and
community stats — and the contract by which the pipeline populates them, so
deferred features (studio filter, broadcast-day filter, schedule, popularity
sorting) have a target schema.

## ADDED Requirements

### Requirement: Production companies carry a role

Studios, licensors and producers SHALL be modeled as the same company entity
linked to an anime with a `role` discriminator (`studio`, `licensor` or
`producer`), where the link's uniqueness includes the role, so the same
company can hold different roles for the same title.

#### Scenario: One company, two roles on one title

- **WHEN** a title lists the same company as both producer and licensor
- **THEN** two link rows exist with the same anime and company ids and
  different roles, and neither violates the primary key

#### Scenario: Studio-filtered lookup is indexed

- **WHEN** the catalog is queried for titles of a given studio
- **THEN** the query filters link rows by `role = 'studio'` and company id
  using the role/company index, without scanning unrelated link rows

### Requirement: Broadcast schedule is queryable by day

The anime record SHALL store a nullable broadcast schedule as day, time and
timezone as delivered by the source, indexed by day, and titles without an
ongoing schedule SHALL remain null rather than being rejected.

#### Scenario: Schedule by day

- **WHEN** the app queries airing titles for a given weekday
- **THEN** it receives exactly the titles whose broadcast day matches, and
  titles with a null schedule are excluded from results (not errors)

#### Scenario: Finished titles are null, not stale

- **WHEN** a title has finished airing and the source no longer reports a
  schedule
- **THEN** the title remains in the catalog with a null schedule and is not
  deleted or flagged

### Requirement: Trailer reference is stored

An anime SHALL store an optional trailer reference (YouTube id and embed URL)
for display, without duplicating the underlying video metadata.

#### Scenario: Trailer available

- **WHEN** the source reports a trailer for a title
- **THEN** the anime row exposes its YouTube id and embed URL for rendering

### Requirement: Aired window, duration and source

An anime SHALL store an optional aired window as timestamps plus textual
duration and source values, so "airing now" and provenance queries are
possible without touching the source.

#### Scenario: Airing window computed locally

- **WHEN** the app computes whether a title is currently airing
- **THEN** it can do so from `aired_from`/`aired_to` without any source call

### Requirement: Community stats are sortable

An anime SHALL store optional `rank`, `members` and `favorites` values,
complementing the existing score/popularity columns, so popularity-based
sorting and lists are served from PostgreSQL alone.

#### Scenario: Sort by members

- **WHEN** a list query sorts by member count
- **THEN** it uses the stored `members` column with no request-time source
  access

### Requirement: AniList identifier slot exists

`anime_external_ids` SHALL provide a nullable AniList identifier column so
external imports and deep links have a stable target once the mapping source is
integrated.

#### Scenario: Column present before population

- **WHEN** the schema is migrated
- **THEN** the AniList id column exists as nullable and all rows are
  unaffected until the mapping task populates them

### Requirement: New fields are additive and pipeline-populated

Every new field SHALL be nullable and added without dropping or renaming
existing columns; the existing producer link primary key SHALL be extended
non-destructively; and the fields SHALL be written only by the ingestion
pipeline, never at request time.

#### Scenario: Existing readers unaffected after migration

- **WHEN** the migration is applied and the app restarts
- **THEN** every existing catalog query returns the same rows as before, with
  pre-existing producer links preserved as role `producer`

#### Scenario: Coverage is measurable

- **WHEN** an operator runs the coverage query for a new column
- **THEN** it reports the non-null percentage across the catalog, distinguishing
  "not yet backfilled" from "source has no value"
