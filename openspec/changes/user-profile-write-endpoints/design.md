## Context

See `proposal.md` — Why. Today:

- `userRepository` only `getUserProfileById` (lookup by `profile.id`).
- `userService.getUserProfile` is read-through cached; policies evaluate only on cache miss.
- `mapUserProfile` is DB → API only (CSV → `number[]`).
- `userProfileCache` has `key` / `get` / `set` only.
- `GET /api/user/:userId` is public; middleware does not list `/api/user` under `publicRoutes`, but unauthenticated reads still work with actor `'anonymous'`.
- `profile` table already stores identity + preference/history columns; preferences/history **mutation APIs** are deferred.
- Known schema smell: `profile.userId` is typed as `integer` FK while Better Auth `user.id` is `text`. Runtime reads key off `profile.id` (text). Design must not silently invent a migration; create/update MUST set and match `profile.id` to the auth user id string used by the rest of the app. If insert requires `userId`, document the concrete column value strategy in implementation tasks after inspecting live schema/types — prefer aligning with existing row conventions over a drive-by type migration in this change.

## Goals / Non-Goals

**Goals:**

- Owner can create a missing profile and patch identity fields via HTTP.
- Writes are validated at the boundary, authorized with `canEditUserProfile`, persisted through repository + `dbError`, mapped consistently, and invalidate profile cache.
- TDD: failing tests first for service/repo/mapper/route behavior of the write path.

**Non-Goals:**

- Preferences-only / history-only endpoints.
- Creating profile automatically inside Better Auth register.
- Changing public GET visibility of preferences/history.
- Migrating `profile.userId` column type unless insert is blocked without it (then minimal fix only, called out in tasks).
- React UI / pages.

## Decisions

### 1. HTTP surface

- **`POST /api/user`** — create profile for the **session user** (no path id; body carries identity fields). Reject if profile already exists (conflict).
- **`PATCH /api/user/:userId`** — partial update of identity fields; `params.userId` MUST equal session user id (policy + explicit equality).

**Alternatives:** single `PUT` upsert — rejected to keep create vs update errors distinct (`409` vs `404`). Nested `/me` routes — rejected to stay consistent with existing `/:userId` style.

### 2. Auth on write routes

- Require session via existing session resolution (`locals.user` or `sessionService.getSession()` pattern used elsewhere). Missing session → auth error (`AUTH_REQUIRED` / domain unauthorized per existing mapping).
- Actor id = session user id; never trust body `id` for ownership.

### 3. Layering (same vertical slice as reads)

```
Route (Zod + error map) → userService.create|update → policy → repository → map → invalidate cache → return UserProfile
```

- Reverse mapper: identity fields API/partial → DB insert/update columns. List CSV helpers only if create seeds empty preference/history columns; do not expose prefs/history mutation in this API body.
- Cache: add `invalidate(userId)` using existing `cacheDel` / cache primitives; call after successful write.

### 4. Validation schemas

- `createUserProfileSchema`: body required fields `name`, `lastName`, `gender`; optional `avatar` (url), `birthday`.
- `updateUserProfileSchema`: params `userId` + body partial of the same identity fields (at least one field required).
- Reuse `userProfileSchema` / response envelope for success payloads.

### 5. Errors

- Reuse `userUnauthorized`, `userNotFound`, `userInvalidId` where they fit.
- Add conflict error (or shared pattern) when create hits existing profile — map to **409** if the shared error map supports it; otherwise document chosen code and HTTP status in tasks and extend `ErrorCodes` + map consistently with anime/music/user patterns.

### 6. Testing (TDD)

- Tests under `src/domains/user/__tests__/` and route tests under `src/pages/api/user/__tests__/` as needed.
- Mock `@config/env`, DB, cache boundaries per existing Vitest patterns.
- Cover: policy deny, not found on patch, conflict on create, happy path create/patch, cache invalidate called, validation 400.

## Risks / Trade-offs

- **[Risk] `profile.userId` type mismatch** → Mitigation: inspect insert path early; minimal compatibility only; full FK migration deferred.
- **[Risk] Cache still serves stale profile if invalidate fails** → Mitigation: same degradation posture as rest of cache layer; document best-effort invalidate; do not fail the write if cache delete fails (match project cache degradation norms unless existing write patterns differ).
- **[Risk] GET still caches full preferences/history** → Acceptable; privacy fix is a later change.
- **[Trade-off] POST without `:userId`** → Clearer ownership; clients must use session, not invent ids.

## Migration Plan

- Deploy is additive (new methods + routes). No data backfill required for this change.
- Rollback: revert PR; GET remains intact.
- No release/tag steps inside design — follow AGENTS.md release on the feature branch after verification.

## Open Questions

- None that block specs/tasks: conflict HTTP code will follow existing `ErrorCodes` / `mapErrorToHttp` conventions when implementing (extend map if 409 is missing).
