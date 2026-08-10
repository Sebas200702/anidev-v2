## 1. Schemas and types

- [x] 1.1 Add Zod create/update request schemas for identity fields (create body; patch params + partial body with ≥1 field) and export from `@user/schemas`
- [x] 1.2 Add any service param types for create/update (actor id + payload) under the user service unit folder

## 2. Mapper and cache (TDD)

- [x] 2.1 Write failing tests for reverse/identity persistence mapping (API identity fields → DB columns; empty list columns only if required on insert)
- [x] 2.2 Implement reverse/identity-to-DB mapping helpers co-located in the user mapper unit
- [x] 2.3 Write failing tests for `userProfileCache.invalidate` (or delete) by user id
- [x] 2.4 Implement cache invalidation using existing cache delete primitives

## 3. Repository writes (TDD)

- [x] 3.1 Write failing tests for create profile (insert + return row) and update profile (partial update + return row / undefined when missing), including `dbError` on failure
- [x] 3.2 Implement `createProfile` / `updateProfile` on `userRepository`; resolve `profile.id` / `userId` column strategy against live schema without drive-by full migrations unless insert is blocked
- [x] 3.3 Detect existing row on create (query or unique violation) so the service can surface conflict

## 4. Service writes (TDD)

- [x] 4.1 Write failing tests for `createUserProfile` / `updateUserProfile`: authz via `canEditUserProfile`, not-found, conflict, happy path, cache invalidate after success
- [x] 4.2 Implement service methods: session actor ownership, policy gate, repo, map to `UserProfile`, invalidate cache, return mapped profile
- [x] 4.3 Add conflict error factory/class + `ErrorCodes` + HTTP mapping if 409/conflict is not already supported

## 5. API routes (TDD)

- [ ] 5.1 Write failing route tests for `POST /api/user` and `PATCH /api/user/:userId` (401/403, 400 validation, 409 conflict, 404, 201/200 envelopes)
- [ ] 5.2 Implement `POST` create route (session required, Zod body, service, response envelope)
- [ ] 5.3 Implement `PATCH` on `[userId]` (session required, Zod params/body, service, response envelope); keep existing `GET` behavior
- [ ] 5.4 Confirm public-route / middleware behavior: writes require auth; document any `publicRoutes` change only if needed

## 6. Verification

- [ ] 6.1 Run `bun run format`, `bun run check`, `bun run check:types`, `bun run test`, `bun run build`
- [ ] 6.2 Mark tasks complete; Conventional Commits per task group; release only when user requests PR/release per AGENTS.md
