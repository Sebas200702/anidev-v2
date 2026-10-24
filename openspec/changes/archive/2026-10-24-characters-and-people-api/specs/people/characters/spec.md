## Purpose

Let clients open a character, see who voices it and where it appears.

## ADDED Requirements

### Requirement: Character search
The system SHALL serve `GET /api/characters` with a required `query`
(trimmed, 2–100 chars) matched against the character name. Results SHALL be
paginated (`page`, `limit` ≤ 100) and ordered by favorites (descending), then
MAL id.

#### Scenario: Search by partial name
- **WHEN** a client requests `/api/characters?query=lelouch`
- **THEN** the response lists matching characters with `malId`, `name`,
  `nameKanji`, `imageUrl` and `favorites`, plus `meta.total` and `meta.hasNext`

#### Scenario: Missing or short query
- **WHEN** `query` is absent or has fewer than 2 characters
- **THEN** the API responds `400 VALIDATION_ERROR`

### Requirement: Character profile
The system SHALL serve `GET /api/characters/:malId` with:
- the name and the kanji name;
- the biography;
- gender, date of birth, blood type, height, weight, age and favorites;
- the portrait URL;
- the voice actors grouped by language (`staffId`, `name`, `imageUrl`).

The response SHALL be `404 CHARACTER_NOT_FOUND` when the id does not exist or
the character still has a provisional name.

#### Scenario: Character with Japanese and English voices
- **WHEN** a character has voice credits in two languages
- **THEN** `voiceActors` contains one group per language with its actors

#### Scenario: Provisional character
- **WHEN** the character's name is `Personaje <id>`
- **THEN** the API responds `404 CHARACTER_NOT_FOUND`

### Requirement: Character appearances
The system SHALL serve `GET /api/characters/:malId/appearances` with the anime
and manga where the character appears. Each entry SHALL have `medium`,
`malId`, `title`, `role` (`main | supporting | background`) and `imageUrl`.
The list SHALL be paginated, SHALL apply the `safe` parental floor, and SHALL
be ordered by role importance, then title.

#### Scenario: Role normalization
- **WHEN** the source stores the role as `MAIN` or `Main`
- **THEN** the API returns `role: "main"`
