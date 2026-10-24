# Design: characters and people API (backend)

## 1. Findings (evidence-first)

Measured on the local clone of prod (2026-10-24):

- **Tables.**
  - `character` (253,820 rows): `name`, `name_kanji`, `about`, `gender`,
    `date_of_birth`, `blood_type`, `height`, `weight`, `age`, `favorites`.
  - `staff` (66,354 rows): `name`, `given_name`, `family_name`, `birthday`,
    `about`, `gender`, `date_of_birth`, `favorites`.
  - Portraits: `character_media` / `staff_media` (`poster`). They are already
    served by `/media` (`entity` `character` / `staff`).
- **Links.**
  - `anime_character` (475,982), `manga_character` (194,596).
  - `character_voice_actor` (379,601; Japanese 151,774, English 76,233, …).
  - `anime_staff` (82,370), `manga_staff` (177,561).
  - `music_artist` (38,010) → `artist` (15,165, of which 2,493 have a
    `mal_id` that matches a `staff.mal_id`).
- **Indexes.** Only the forward PKs exist. Reverse lookups by character or
  person have no index, except `manga_character_character_id_idx` and
  `manga_staff_staff_id_idx`. There is no trigram index on `character.name` or
  `staff.name`, and both tables are searched with `ILIKE`.
- **Dirty data.**
  - Roles mix cases (`MAIN` 51,129 vs `Main` 53,849; `SUPPORTING` vs
    `Supporting`; `BACKGROUND`).
  - Provisional names (`Personaje <id>`) are 0 today, but the scraper can
    write them. `PROVISIONAL_CHARACTER_NAME_PREFIX` exists in `@anime/constants`.
- **Reusable pieces.**
  - `buildMediaUrl`.
  - The `safe` floors: `ADULT_RATINGS` for anime, `ADULT_MANGA_GENRES` for
    manga.
  - The `withStaleCache` pattern.
  - The music card mapper and the music list service, which have no artist
    filter yet.

## 2. Decisions

1. **One domain `people`** (alias `@people`) owns both characters and persons.
   They share search, portrait and voice-credit code, and the roadmap groups
   them ("personajes / artistas / seiyuu"). Unit folders:
   - repositories: `character-profile`, `character-appearances`,
     `character-search`, `person-profile`, `person-voices`, `person-credits`;
   - mappers: `character`, `person`, `cast-role`;
   - services: `character`, `person`.
2. **Search** is `ILIKE '%q%'` on `name` (characters also on `name_kanji`)
   with a minimum of 2 characters, backed by the new GIN `pg_trgm` indexes.
   Order: `favorites DESC NULLS LAST, mal_id`. Count uses the same predicate.
   Provisional character names are excluded in SQL.
3. **Role normalization** in a pure mapper `normalizeCastRole`:
   `lower(trim(role))` mapped to `main | supporting | background`, with
   anything else becoming `supporting`. Appearances sort by
   `CASE lower(role)`, then title, in SQL.
4. **Appearances** use a `UNION ALL` of anime (with the `safe` rating floor)
   and manga (with the adult-genre floor), paginated in SQL. Each row carries
   `medium`, so cover URLs are built per medium.
5. **Voices** join `character_voice_actor` → `character` → `anime_character` →
   `anime`. Each voiced character comes with up to 3 anime (most popular
   first), aggregated with `json_agg`. Pagination is per character, not per
   anime, so a prolific voice actor's page size stays predictable.
6. **Credits** group positions per work (`array_agg(role ORDER BY role)`),
   one medium per request (`medium=anime|manga`, default `anime`), with the
   `safe` floor.
7. **Music** reuses `musicListService` through a new **internal** scope
   `artistIds` (an `EXISTS` on `music_artist`), the same pattern as the manga
   `producerId` scope. The person's artist ids come from `artist.mal_id`.
8. **Profiles** are cached for a day (`CacheKeyPrefix.CharacterProfile`,
   `PersonProfile`) with stale fallback. Searches and paginated lists are
   cached for an hour (`CacheTtl.Medium`), keyed by `stableStringify`.
9. **Errors.** `CHARACTER_NOT_FOUND` and `PERSON_NOT_FOUND` are added to
   `ErrorCodes` and the 404 set. Sub-routes check that the entity exists
   first, so an unknown id is a `404`, not an empty `200`.
10. **Migration.** A hand-written SQL migration in Drizzle's journal adds:
    - the five B-tree reverse indexes;
    - two GIN trigram indexes, `CREATE INDEX IF NOT EXISTS`, extension already
      enabled by `0001`.

    The matching `index(...)` entries go in the Drizzle schema files so
    `db:generate` stays in sync. It is applied locally only. The PR states
    that the maintainer must apply it in production.

## 3. Risks

- **Migration number collision.** Another branch
  (`resilient-playback-and-aniskip`) holds an uncommitted `0014` migration.
  Generate this change's migration last, right before the PR. If the other
  branch merges first, rebase and regenerate the number and snapshot.
- **Index build time in prod.** About 1.3M rows across the indexed tables.
  Plain `CREATE INDEX` locks writes for seconds. The maintainer can run them
  `CONCURRENTLY` by hand, and the PR documents this.
- **Large voice lists.** Some voice actors have more than 500 roles.
  Per-character pagination plus the 3-anime cap keeps rows bounded.
