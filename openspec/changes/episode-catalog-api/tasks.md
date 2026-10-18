# Tasks — episode catalog API

> TDD-first: failing Vitest unit test before each implementation step.

## A. Domain (TDD)

- [x] A.1 `EPISODE_NOT_FOUND` error code mapped to 404 + `EpisodeNotFoundError`
  factory (test in `map-error-to-http` suite first).
- [x] A.2 Schemas + types: `anime-episode-schema.ts` (item, detail, request
  schemas for list/detail, response schemas) and `EpisodeDB`.
- [x] A.3 Repository `anime-episodes`: page query ordered by number + concurrent
  count; detail by `(animeId, number)`; `dbError` on failure.
- [x] A.4 Mapper `anime-episode`: DB row → list item (no synopsis) / detail.
- [x] A.5 Cache `anime-episodes`: list/detail keys, `CacheTtl.Long`.
- [x] A.6 Service `anime-episodes`: stale-cache pipeline; anime existence check
  only on empty total / missing episode (D-E3).

## B. Routes (TDD)

- [x] B.1 `GET /api/anime/[malId]/episodes` route + route tests (200 envelope
  and meta, 400 on bad page/limit).
- [x] B.2 `GET /api/anime/[malId]/episodes/[number]` route + route tests.

## C. Real-stack verification

- [x] C.1 Integration spec for the repository (ordering, pagination, total).
- [x] C.2 E2E: seed episodes for a seed anime; list, detail, 404s.

## D. Verification, release & archive

- [ ] D.1 Gate (`format` → `check` → `check:types` → `test` →
  `test:integration` → `test:e2e` → `build`).
- [ ] D.2 Doubt pass against this spec and `AGENTS.md`.
- [ ] D.3 Release on the branch, open PR, archive the change.
