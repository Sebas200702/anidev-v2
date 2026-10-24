## Purpose

Let clients open a person (voice actor, staff member, author, musician) and
browse everything they took part in.

## ADDED Requirements

### Requirement: Person search
The system SHALL serve `GET /api/people` with a required `query` (trimmed,
2–100 chars) matched against the person's name. Results SHALL be paginated
and ordered by favorites (descending), then MAL id.

#### Scenario: Search by family name
- **WHEN** a client requests `/api/people?query=kanno`
- **THEN** matching people are listed with `malId`, `name`, `imageUrl` and
  `favorites`

### Requirement: Person profile
The system SHALL serve `GET /api/people/:malId` with:
- name, given name and family name;
- birthday, gender, biography and favorites;
- the portrait URL;
- `counts` of voice roles, anime credits, manga credits and music themes.

The response SHALL be `404 PERSON_NOT_FOUND` when the id does not exist.

#### Scenario: Composer who also performs themes
- **WHEN** a person is linked to a music artist by MAL id
- **THEN** `counts.music` is the number of themes credited to that artist

### Requirement: Voice roles
The system SHALL serve `GET /api/people/:malId/voices`. It lists the
characters the person voices, each with its language and the anime where that
character appears, in a paginated list. An optional `language` filter SHALL
keep only that language.

#### Scenario: Japanese roles only
- **WHEN** a client requests `/api/people/<id>/voices?language=Japanese`
- **THEN** only Japanese voice credits are returned

### Requirement: Staff credits
The system SHALL serve `GET /api/people/:malId/credits?medium=anime|manga`.
It lists the works the person worked on, with every position held on each
work, in a paginated list with the `safe` parental floor applied.

#### Scenario: Director and storyboard on the same anime
- **WHEN** a person holds two positions on one anime
- **THEN** the anime appears once with both positions in `positions`

### Requirement: Music themes
The system SHALL serve `GET /api/people/:malId/music` with the OP/ED themes
credited to the music artist that has the person's MAL id, as music cards in
a paginated list.

#### Scenario: Person without artist link
- **WHEN** no artist has the person's MAL id
- **THEN** the response is `200` with an empty list
