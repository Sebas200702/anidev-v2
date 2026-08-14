## 1. Wrapper option and error code (TDD)

- [x] 1.1 Failing tests for `withErrorHandling(handler, { responseSchema })`: valid passes, invalid → 500, no schema skips
- [x] 1.2 `ErrorCodes.RESPONSE_VALIDATION_ERROR` + `ResponseValidationError` class (BaseError, severity `error`) mapped to **500** (generic message, no leaked details) in `mapErrorToHttp`
- [x] 1.3 `responseSchema` option in `withErrorHandling` — validates the built **envelope** payload (matches the `*ResponseSchema` = `createApiResponseSchema` shape); throws `ResponseValidationError` on mismatch

> Note: the schema validates the full success envelope (`{ data, status, meta }`),
> not just `data` — the existing `*ResponseSchema` are envelope schemas, matching
> what routes previously did with `*.parse(payload)`.

## 2. Refactor anime routes

- [x] 2.1 `GET /api/anime` → `withErrorHandling(handler, { responseSchema: animeListResponseSchema })`, preserving `meta` (stale/page/total/hasNext) and `x-stale`
- [x] 2.2 `GET /api/anime/:malId` with `animeDetailsResponseSchema`
- [x] 2.3 `GET /api/anime/:malId/characters` with `animeCharacterResponseSchema`
- [x] 2.4 `GET /api/anime/:malId/full` with `animeFullDetailsResponseSchema`
- [x] 2.5 `GET /api/anime/:malId/staff` with `animeStaffResponseSchema`

## 3. Refactor music routes

- [x] 3.1 `GET /api/music` with `musicListResponseSchema`, preserving pagination meta and `x-stale`
- [x] 3.2 `GET /api/music/:id` with `musicDetailsResponseSchema`

## 4. Refactor user routes

- [x] 4.1 `GET /api/user/:userId` passes `{ responseSchema: userProfileResponseSchema }`
- [x] 4.2 `POST /api/user` passes `{ responseSchema: userProfileResponseSchema }`
- [x] 4.3 `PATCH /api/user/:userId` passes `{ responseSchema: userProfileResponseSchema }`

> ⚠️ **Bug surfaced by the wrapper:** `userProfileSchema.avatar` used `z.url()`
> (absolute URL), but real avatars are relative media/proxy paths
> (`/placeholder.webp`). Enabling response validation would 500 valid profiles,
> so `avatar` was loosened to `z.string()` (text; relative or absolute). Anime
> card `imageUrl`/`smallImageUrl` stay `z.url()` (mapper emits absolute proxy URLs).

## 5. Route tests for migrated routes

- [x] 5.1 Migrated-route coverage: user route tests (create/update/get) exercise the composition + response schema (and caught the avatar bug); new `anime-list-route.test.ts` covers `GET /api/anime` (200 envelope + malformed → 500). Music GET routes share the identical composition
- [x] 5.2 Wrapper-level test (`with-error-handling.test.ts`): response schema → 500 `RESPONSE_VALIDATION_ERROR` on invalid data

## 6. Verification

- [x] 6.1 Gate green: `format` ✓ · `check` ✓ · `check:types` 0 errors ✓ · `test` 115 passed ✓ · `build` Complete ✓
- [x] 6.2 Conventional Commits per task group; PR/release only when the user requests it
