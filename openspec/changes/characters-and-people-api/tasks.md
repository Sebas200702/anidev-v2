# Tasks — characters and people API (backend)

> TDD-first; one commit per task. Backend only.

## 1. Foundations

- [ ] 1.1 Alias `@people` (tsconfig, astro, vitest, biome restricted list).
      Add `CHARACTER_NOT_FOUND` / `PERSON_NOT_FOUND` with their 404 mapping
      tests, and `/api/characters` and `/api/people` as public routes
      (tests first).
- [ ] 1.2 Index migration plus schema `index(...)` entries:
      - reverse B-tree indexes on `anime_character(character_id)`,
        `anime_staff(staff_id)`, `character_voice_actor(staff_id)`,
        `music_artist(artist_id)` and `artist(mal_id)`;
      - GIN trigram indexes on `character.name` and `staff.name`.

      Apply locally (`db:migrate`) and verify with `EXPLAIN` that the reverse
      lookups use them.

## 2. Characters

- [ ] 2.1 Pure mappers: `normalizeCastRole`, character card/profile (voices
      grouped by language). Unit tests.
- [ ] 2.2 Repositories:
      - search + count (provisional names excluded);
      - profile + voices;
      - appearances `UNION ALL` with both `safe` floors and role ordering.

      Unit tests + integration spec (seeded probe rows).
- [ ] 2.3 Character service (cache + `CHARACTER_NOT_FOUND`) and routes
      `GET /api/characters`, `/:malId` and `/:malId/appearances`. Service and
      route tests.

## 3. People

- [ ] 3.1 Repositories:
      - search + count;
      - profile + counts;
      - voices (per character, up to 3 anime);
      - credits grouped per work and medium.

      Unit tests + integration spec.
- [ ] 3.2 Internal `artistIds` scope on the music list
      (`EXISTS music_artist`). Unit test.
- [ ] 3.3 Person service (cache + `PERSON_NOT_FOUND`) and routes
      `GET /api/people`, `/:malId`, `/:malId/voices`, `/:malId/credits` and
      `/:malId/music`. Service and route tests.

## 4. Verification, release & archive

- [ ] 4.1 E2E:
      - `e2e/api/characters.spec.ts`: search, profile, appearances, 404;
      - `e2e/api/people.spec.ts`: search, profile, voices, credits, music, 404.

      Seed a character, a voice actor, an artist link and staff credits.
- [ ] 4.2 Full gate + `test:integration` + `test:e2e`, update AGENTS.md
      (alias, public routes) and ROADMAP (Fase 6 API), release minor, PR
      (note the production migration), merge, push tag, archive.
