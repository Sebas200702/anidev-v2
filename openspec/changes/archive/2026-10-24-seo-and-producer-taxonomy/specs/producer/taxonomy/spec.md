## Purpose

Expose studios, producers, licensors and magazines (one shared `producer`
entity) and the works credited to them, so clients can browse the catalog by
company.

## ADDED Requirements

### Requirement: Producer list
The system SHALL serve `GET /api/producers` with `page`/`limit` pagination,
an optional `query` matched against every producer title, an optional `role`
(`studio | producer | licensor | serialization`) that keeps only producers
credited in that role, and `sort` by `works` (default, descending) or `name`.

#### Scenario: Studios ordered by work count
- **WHEN** a client requests `/api/producers?role=studio`
- **THEN** the response lists producers with at least one `studio` credit,
  most credited first, with `meta.total` and `meta.hasNext`

#### Scenario: Search by alternative title
- **WHEN** a client requests `/api/producers?query=<alternative title>`
- **THEN** the producer whose non-default title matches is returned

### Requirement: Producer detail
The system SHALL serve `GET /api/producers/:malId` with the default name,
alternative titles, established date, about text and the number of credited
works per role. The response SHALL be `404 PRODUCER_NOT_FOUND`
when the id does not exist.

#### Scenario: Studio detail
- **WHEN** a client requests an existing studio
- **THEN** the response includes `counts.studio` equal to the number of anime
  that credit it as studio

#### Scenario: Unknown producer
- **WHEN** a client requests a MAL id with no producer row
- **THEN** the API responds `404` with code `PRODUCER_NOT_FOUND`

### Requirement: Works by producer
The system SHALL serve `GET /api/producers/:malId/anime` (optional `role`) and
`GET /api/producers/:malId/manga` as paginated card lists. Both lists SHALL
apply the same fail-closed `safe` parental floor as the catalog lists.

#### Scenario: Anime produced as studio
- **WHEN** a client requests `/api/producers/<id>/anime?role=studio`
- **THEN** only anime crediting the producer as `studio` are returned

#### Scenario: Unknown producer works
- **WHEN** the producer does not exist
- **THEN** both endpoints respond `404 PRODUCER_NOT_FOUND`

### Requirement: Anime list filter by producer
`GET /api/anime` SHALL accept `producer` (comma-separated MAL ids) and
`producerRole`, returning only anime credited to any of those producers, in
that role when one is given. The filters SHALL be part of the list cache key.

#### Scenario: Filter by studio
- **WHEN** a client requests `/api/anime?producer=<id>&producerRole=studio`
- **THEN** every returned anime credits `<id>` as studio

#### Scenario: Invalid producer id
- **WHEN** `producer` contains a non-numeric value
- **THEN** the API responds `400 VALIDATION_ERROR`
