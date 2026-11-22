# printed-media Specification

## Purpose

Catálogo de obras impresas (manga, novela, one-shot) y fichas de personaje
completas: el dominio que hoy no existe en el catálogo y que la app necesita
para cubrir "anime **y manga**" y las fichas de personajes/seiyuus (Fase 6).

## Requirements

### Requirement: Printed media catalog
The system SHALL expose the printed-media catalog (`manga` table) keyed by
MyAnimeList id, discriminated by `type` (`manga`, `novel`, `one_shot`, `doujin`,
`manhwa`, `manhua`), with synopsis, chapter/volume counts, publication window,
serialization, origin, score, popularity and cover artwork.

#### Scenario: Listing printed media
- **WHEN** a client requests the printed-media list with filters and pagination
- **THEN** the response returns the matching works with their type, titles,
  artwork and catalog metadata

#### Scenario: Work detail
- **WHEN** a client requests a work by its MyAnimeList id
- **THEN** the response returns the work with its taxonomy, cast, staff,
  publisher, related works and external links

#### Scenario: Extended work detail
- **WHEN** a client requests `GET /api/manga/:malId/full`
- **THEN** the response nests the taxonomy as `{ malId, name }`, lists every
  title (main, english, japanese, synonyms) and groups the related works by
  relation type

#### Scenario: Catalog search by type
- **WHEN** a client requests `GET /api/search?q=<term>&type=manga`
- **THEN** the response returns the printed works whose title or synonyms
  match the term, with the searched type in `meta.type` (default `anime`)

#### Scenario: Unknown work
- **WHEN** a client requests an id that does not exist
- **THEN** the API responds `404` with the standard error envelope

### Requirement: Shared entities across media types
The system SHALL link printed media to the same taxonomy, staff, character and
publisher entities used by the anime domain, so the same person is a single
record regardless of the medium.

#### Scenario: Author also voices an anime
- **WHEN** an author of a manga and a voice actor of an anime are the same
  person
- **THEN** both media reference the same staff row and can be cross-linked

### Requirement: Complete cast
The system SHALL store the complete cast of an anime, not only the entries
shown on the source's summary page, with the character role and the voice
actors.

#### Scenario: Long series with a large cast
- **WHEN** an anime has more characters than the source's summary page lists
- **THEN** every character is stored with its role and voice actor

#### Scenario: Provisional character names
- **WHEN** a character still carries the provisional scraper name
  `Personaje <id>`
- **THEN** it is left out of every cast returned by the API

#### Scenario: Character profile
- **WHEN** a character's profile is requested
- **THEN** it exposes the name, native name, biography, portrait and the media
  it appears in

### Requirement: External links
The system SHALL store the official sites, wikis and social profiles linked
from a catalog entry, with the site, the URL and its kind.

#### Scenario: Entry with official site and wiki
- **WHEN** a work links to an official site and to a wiki
- **THEN** both links are stored and returned by the detail endpoint

## MODIFIED Requirements

### Requirement: Catalog search
The search index SHALL cover printed media as well as anime, and the search
API SHALL accept a media-type filter.

#### Scenario: Searching for a manga title
- **WHEN** a client searches for a title that only exists as printed media
- **THEN** the manga is returned, tagged with its type

#### Scenario: Filtering by media type
- **WHEN** a client filters by `type=manga`
- **THEN** only printed media are returned
