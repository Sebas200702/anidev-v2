## Why

The E2E harness landed in `e2e-testing-methodology` (merged PR #102) but the three
test layers were uneven: unit coverage was thin across most domains, only a
handful of integration specs existed, and the E2E suite covered a few flagship
routes. Running a full cross-layer campaign against the real stack exposed gaps
that a mocked unit suite could not: two routes 500'd on inputs that should never
reach the repository, and one endpoint crashed when a record legitimately lacked
a related row.

## What Changes

- **Fix `GET /api/anime/:malId/full` 500 on missing external ids.** `mapExternalIds`
  read `.animeThemesSlug` over `undefined` when an anime has no
  `anime_external_ids` row; the repository returns `undefined` and the mapper
  crashed. It now treats "no row" as "no external identifiers" and returns an
  empty list instead of a 500.
- **Fix `GET /api/music/:id` 500 on non-numeric ids.** `getMusicSchema` accepted
  any string, so a non-numeric id reached the repository as `NaN` and Postgres
  threw a 500. The param is now validated with a numeric regex and rejects
  non-numeric ids as a `400` (Zod-wrapper envelope), preserving the existing
  string-based handling downstream.
- **Expand unit coverage across domains.** New `__tests__` for anime (mappers,
  repositories, services, cache), music (mappers, repositories, services, cache),
  user (policies, repository, service, cache), auth, search history, media image
  utilities, shared error/helpers/image utils, config, middleware, and the API
  route handlers (`src/pages/api/*`).
- **Add integration specs** (`*.integration.test.ts`, `RUN_DB_TESTS`) for the
  anime repositories and the user repository against real Postgres, gated by
  `describe.skipIf`, so the unit gate auto-skips them.
- **Add E2E API specs** for anime detail (`/full`), music detail, media asset
  paths, and the user profile lifecycle — the routes that exposed the two bugs.
- **Drift-aware user specs.** The integration + E2E user specs detect the local
  `profile.user_id` type drift (integer vs `text`) and self-skip with a clear
  message instead of failing confusingly on a desynced local DB; on a fresh DB
  (CI) they validate for real.
- **Vitest coverage config.** Exclude type-only modules, Drizzle DDL schemas, and
  infra wiring (env, DB pool, auth SDK binding) from the coverage `include`, so
  coverage reflects testable runtime logic rather than declarations/SDK glue.

## Capabilities

### New Capabilities

- (none — this is a test-coverage and robustness-fix change over existing
  behavior; the endpoints and their contracts are unchanged in intent)

### Modified Capabilities

- (none under `openspec/specs/` — the anime/music domains have no committed
  specs yet, and no spec-level behavior contract changes)

## Impact

- **Code:** `src/domains/anime/mappers/anime-external/mapper.ts`,
  `src/domains/music/schemas/api-schema.ts`,
  `src/domains/media/types/media-enums.ts`, `vitest.config.ts`; ~48 new test
  files under `src/**/__tests__/`, 2 integration specs, 4 E2E specs
  (`e2e/api/`).
- **API:** `GET /api/anime/:malId/full` returns `200` with `externalIds: []` for
  anime without external-ids rows (was 500). `GET /api/music/:id` returns `400`
  for non-numeric ids (was 500). Both remain backward-compatible for valid
  inputs.
- **Tests:** unit suite grows (~460+ passing), integration green on a migrated
  DB, E2E `api` project green on the real stack.