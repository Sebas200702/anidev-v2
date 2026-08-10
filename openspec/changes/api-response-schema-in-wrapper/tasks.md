## 1. Wrapper option and error code (TDD)

- [ ] 1.1 Add failing tests for `withErrorHandling(handler, { responseSchema })`: valid data passes, invalid data yields 500, no schema skips validation
- [ ] 1.2 Add `ErrorCodes.RESPONSE_VALIDATION_ERROR` and map it to HTTP 500 with `error` severity in `mapErrorToHttp` (add failing tests first)
- [ ] 1.3 Implement the `responseSchema` option in `withErrorHandling` (safeParse on success, throw on invalid)

## 2. Refactor anime routes

- [ ] 2.1 Refactor `GET /api/anime` (`anime/index.ts`) to `withErrorHandling(handler, { responseSchema: animeListResponseSchema })`, preserving `meta` (stale/page/total/hasNext) and `x-stale` header
- [ ] 2.2 Refactor `GET /api/anime/:malId` (`anime/[malId]/index.ts`) with `animeDetailsResponseSchema`
- [ ] 2.3 Refactor `GET /api/anime/:malId/characters` with `animeCharacterResponseSchema`
- [ ] 2.4 Refactor `GET /api/anime/:malId/full` with `animeFullDetailsResponseSchema`
- [ ] 2.5 Refactor `GET /api/anime/:malId/staff` with `animeStaffResponseSchema`

## 3. Refactor music routes

- [ ] 3.1 Refactor `GET /api/music` (`music/index.ts`) with `musicListResponseSchema`, preserving pagination meta and `x-stale`
- [ ] 3.2 Refactor `GET /api/music/:id` (`music/[id].ts`) with `musicDetailsResponseSchema`

## 4. Refactor user routes

- [ ] 4.1 Refactor `GET /api/user/:userId` to pass `{ responseSchema: userProfileResponseSchema }`
- [ ] 4.2 Refactor `POST /api/user` to pass `{ responseSchema: userProfileResponseSchema }`
- [ ] 4.3 Refactor `PATCH /api/user/:userId` to pass `{ responseSchema: userProfileResponseSchema }`

## 5. Route tests for migrated routes

- [ ] 5.1 Add/extend route tests verifying migrated routes still return 200 success envelopes and 4xx/5xx errors
- [ ] 5.2 Add a wrapper-level test that a route with a response schema returns 500 `RESPONSE_VALIDATION_ERROR` on invalid `data`

## 6. Verification

- [ ] 6.1 Run `bun run format`, `bun run check`, `bun run check:types`, `bun run test`, `bun run build`
- [ ] 6.2 Mark tasks complete; Conventional Commits per task group; release only when user requests PR/release per AGENTS.md
