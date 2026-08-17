## Why

The user domain only exposes a public profile **read** (`GET /api/user/:userId`). There is no authenticated way to create or update a profile row, no write validation schemas, no reverse mapping from API lists to CSV DB columns, and no cache invalidation after mutations. Owners cannot complete onboarding or edit identity fields through the API.

## What Changes

- Add **create** and **partial update** of profile identity fields (name, lastName, avatar, birthday, gender) for the authenticated owner.
- Add Zod **request** schemas for create/update bodies and wire them on new/extended user API routes.
- Add repository write methods and a **reverse mapper** (API `number[]` / nested fields → DB text/CSV where needed for identity-adjacent persistence consistency).
- Add **cache invalidation** on successful profile writes so subsequent reads are not stale.
- Enforce **owner-only** edit via existing `canEditUserProfile` (and require a real session actor on write routes).
- **Out of scope for this change:** dedicated preferences/history endpoints, auto-create profile on Better Auth register, public-read privacy tightening for preferences/history, media domain errors, broad domain test campaigns beyond what this feature needs (TDD for the new write path is in scope).

## Capabilities

### New Capabilities

- `user/profile-writes`: Authenticated create and partial update of user profile identity fields, including authorization, validation, persistence, response shape, and cache coherence after writes.

### Modified Capabilities

- (none — there is no committed user-domain spec under `openspec/specs/` yet)

## Impact

- **Code:** `src/domains/user/` (schemas, mappers, repositories, services, cache, errors if needed), `src/pages/api/user/`
- **API:** new write surface on user profile routes (create + `PATCH`); existing `GET` behavior unchanged except benefiting from cache invalidation after writes
- **Auth:** write routes require session; anonymous actors cannot mutate
- **DB:** uses existing `profile` table; no new tables in this change
- **Cache:** `userProfileCache` gains invalidate/delete; write path busts keys
- **Deps:** no new packages
