# Proposal: characters and people API (backend)

## Problem

Fase 6 of the roadmap ("Personajes / artistas / seiyuu") needs dedicated
profiles, and the data is already in the catalog:

- **Characters:** 253,820 profiles, 111,364 with kanji name and 56,843 with a
  biography. Each one has a portrait (`character_media`).
- **People:** 66,354 (staff and voice actors), with given/family name,
  birthday, biography and portrait (`staff_media`).
- **Links:**
  - 475,982 anime cast links and 194,596 manga cast links;
  - 379,601 voice credits in 30+ languages;
  - 82,370 anime staff credits and 177,561 manga staff credits;
  - 2,493 music artists linked to a person by MAL id (`artist.mal_id`).

None of it is reachable from the API except as nested lists inside one anime
or manga. A client cannot open a character, a voice actor or an author.
Reverse lookups (from a character or a person to their works) also have no
index. Only `manga_character.character_id` and `manga_staff.staff_id` are
indexed.

## Scope

Backend only, in a new `people` domain (alias `@people`):

1. **Characters**
   - `GET /api/characters`: search by name (`query`, required), paginated,
     ordered by favorites.
   - `GET /api/characters/:malId`: profile fields, portrait, and the voice
     actors grouped by language.
   - `GET /api/characters/:malId/appearances`: anime and manga where the
     character appears, with the role. Paginated, with the `safe` floor.
2. **People** (staff, voice actors, authors, artists)
   - `GET /api/people`: search by name (`query`, required), paginated,
     ordered by favorites.
   - `GET /api/people/:malId`: profile fields, portrait, and counts of voice
     roles, anime credits, manga credits and music themes.
   - `GET /api/people/:malId/voices`: characters voiced, each with the anime
     it appears in. Paginated; optional `language`.
   - `GET /api/people/:malId/credits?medium=anime|manga`: staff credits with
     their positions, grouped per work. Paginated, with the `safe` floor.
   - `GET /api/people/:malId/music`: OP/ED themes the person performs, found
     through `artist.mal_id`. Paginated.
3. **Index migration** (local `db:generate`; the maintainer applies it in
   production, as the repo policy requires):
   - B-tree indexes: `anime_character(character_id)`, `anime_staff(staff_id)`,
     `character_voice_actor(staff_id)`, `music_artist(artist_id)` and
     `artist(mal_id)`.
   - GIN `pg_trgm` indexes: `character.name` and `staff.name`.
4. **Normalization.** Cast roles come as `MAIN`/`Main` and
   `SUPPORTING`/`Supporting`. The API returns them as `main | supporting |
   background`.
5. All routes are public (`/api/characters`, `/api/people`). Characters with a
   provisional name are never returned.

## Non-goals

- Pages (`/character`, `/voice-actor`, `/artist`) and their sitemap
  segments. That is UI work; the sitemap registry takes one entry when the
  pages exist.
- Backfilling missing voice links or portraits. That is ingestion (Track D).
- Merging duplicate people across sources. `mal_id` is the identity.

## Breaking changes

None. Additive routes and indexes only.
