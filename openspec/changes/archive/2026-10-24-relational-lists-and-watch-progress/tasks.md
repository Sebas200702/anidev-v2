# Tasks — Relational lists and watch progress (Etapa 3A)

## 1. Drizzle schemas and migrations (`T-10.1`)

- [x] 1.1 Define `userAnimeList` and `watchProgress` tables in `src/lib/db/schemas/user-media.ts` with composite primary keys, cascade foreign keys to `user.id`, `anime.malId`, and `episode.id`, and B-tree indexes.
- [x] 1.2 Re-export `userAnimeList` and `watchProgress` from `src/lib/db/schemas/index.ts` and generate the Drizzle migration (`bun run db:generate`).

## 2. User anime lists vertical slice (`T-10.2`)

- [x] 2.1 Write failing unit and integration tests for `userListRepository` and `userListService` in `src/domains/user/__tests__/`.
- [x] 2.2 Implement `src/domains/user/repositories/user-list/`, `mappers/user-list/`, `schemas/user-list-schema.ts`, and `services/user-list/` with atomic `ON CONFLICT (user_id, anime_id) DO UPDATE` and delete-returning-snapshot for undo.
- [x] 2.3 Add `src/pages/api/user/lists.ts` (`GET`, `PUT`, `DELETE`) with `withZodValidation`, `withErrorHandling`, `requireAuthSession`, and `Cache-Control: private, no-store`.

## 3. Watch progress reconciliation & API slice (`T-10.3`)

- [x] 3.1 Write failing unit tests for `isNewerOrBetter` (`NEWEST_WINS_TOLERANCE_MS = 1000`), automatic `>= 90%` completion calculation, and per-anime collapsing in `src/domains/user/__tests__/`.
- [x] 3.2 Implement `watchProgressRepository` and `watchProgressService` with conditional upsert and collapsed *Continue Watching* query.
- [x] 3.3 Add `src/pages/api/user/watch-progress.ts` (`GET`, `PUT`) validated with Zod and protected by `requireAuthSession`.

## 4. Client persistence & E2E verification (`T-10.4`)

- [x] 4.1 ~~Implement the client progress sync helper (`localStorage` synchronous mirror + `navigator.sendBeacon` flush on `visibilitychange` + guest-to-account merge on login). ~~ → movida a `watch-progress-client-sync`.
- [x] 4.2 ~~Add Playwright E2E specs in `e2e/api/` verifying list CRUD, undo snapshot, 90% completion, and *Continue Watching* collapsing. ~~ → movida a `watch-progress-client-sync`.

> Cerrado 2026-10-24: slices 1–3 mergeados en #118 (release `0.13.0`). El
> sync del cliente y el e2e quedan en el change `watch-progress-client-sync`.
