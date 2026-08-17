## 1. Robustness fixes surfaced by the campaign

- [x] 1.1 `mapExternalIds` guards a `undefined` repository result (anime without
      `anime_external_ids` row) and returns an empty list — `GET
      /api/anime/:malId/full` no longer 500s; unit test added
- [x] 1.2 `getMusicSchema` validates the id param with `^\d+$` (raw string, not
      coerced) so non-numeric ids fail as a `400` instead of reaching the DB as
      `NaN`; large valid ids keep working (404-not-found path preserved)

## 2. Unit test coverage expansion

- [x] 2.1 Anime: mappers (card, character, details, external, full, full-helpers,
      music, staff), repositories (list filters, repositories), services
      (characters, full, list, staff), cache (caches, list-cache-rw)
- [x] 2.2 Music: mappers, repositories, cache, services (list, service)
- [x] 2.3 User: policies, repository reads, service reads, cache reads
- [x] 2.4 Auth + middleware: auth tests, session middleware tests
- [x] 2.5 Search: search-history repository
- [x] 2.6 Media: image utils (path guards, segment parsers, normalize-url,
      normalize-media, parse-media-type, optimize-sharp) + media __tests__
- [x] 2.7 Shared: errors, helpers, image utils; config index; API route handlers
      (anime detail, auth, music, user)

## 3. Integration specs (real Postgres, `RUN_DB_TESTS`)

- [x] 3.1 `anime-repositories.integration.test.ts` — `describe.skipIf(!RUN_DB_TESTS)`
- [x] 3.2 `user-repository.integration.test.ts` — `describe.skipIf(!RUN_DB_TESTS)`,
      drift-aware skip when `profile.user_id` is not `text`

## 4. E2E API specs (real stack, Playwright `api` project)

- [x] 4.1 `e2e/api/anime-detail.spec.ts` — `GET /api/anime/:malId/full` envelope,
      empty external ids for anime without a row
- [x] 4.2 `e2e/api/music-detail.spec.ts` — valid detail + non-numeric id `400`
- [x] 4.3 `e2e/api/media.spec.ts` — media asset path handling
- [x] 4.4 `e2e/api/user-profile.spec.ts` — profile lifecycle (create/read/update,
      forbids), drift-aware skip locally

## 5. Tooling

- [x] 5.1 `vitest.config.ts` coverage excludes for type-only modules, Drizzle DDL
      schemas, and infra wiring (env, DB pool, auth SDK binding)

## 6. Verification

- [x] 6.1 Full local run: `docker compose up -d` → `db:migrate` → `db:seed:e2e` →
      `bun run test` (unit green) → `bun run test:integration` (green against
      Postgres) → `bun run test:e2e` (green on the real stack)
- [x] 6.2 `bun run check` + `bun run check:types` clean; fixes covered by new
      unit tests; local DB drift closed with a targeted `ALTER TABLE`