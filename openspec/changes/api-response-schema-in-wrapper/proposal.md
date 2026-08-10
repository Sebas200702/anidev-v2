## Why

API routes duplicate the same error-handling and response-serialization logic in every handler. `anime/*`, `music/*`, and `user/*` each repeat a `try/catch` + `mapErrorToHttp` block and manually build `Response` objects, while only `auth/*` and `health/*` use `withErrorHandling`. The response-envelope Zod schemas (`*ResponseSchema`) are also parsed inside every handler instead of being a wrapper responsibility, so the "validate request → run → serialize response" pipeline is not centralized.

## What Changes

- Extend `withErrorHandling` to accept an **optional response schema** and validate `data` before serializing; invalid output becomes a server error (500) instead of leaking malformed JSON.
- Add a `RESPONSE_VALIDATION_ERROR` code to `ErrorCodes` and map it to HTTP **500** in `mapErrorToHttp`.
- Refactor all domain GET routes (`anime/*`, `music/*`, and `user/*`) from the manual `try/catch + jsonResponse` style to the `withZodValidation(...)(withErrorHandling(handler, { responseSchema }))` composition.
- Keep `user` write routes (`POST /api/user`, `PATCH /api/user/:userId`) consistent with the same composition and response-schema validation.
- Remove duplicated inline error envelope construction; preserve the `stale`/`x-stale` header behavior via `jsonResponse` on `meta.stale === true`.

## Capabilities

### New Capabilities

- `infrastructure/api-response-validation`: Standard response-envelope validation as part of the route wrapper, with server-error mapping for malformed output.

### Modified Capabilities

- `infrastructure/error-handling`: `mapErrorToHttp` now recognizes `RESPONSE_VALIDATION_ERROR` (500). The `withErrorHandling` wrapper optionally validates the successful `data` payload.

## Impact

- **Code:** `src/shared/http/with-error-handling.ts` (new `responseSchema` option), `src/shared/errors/codes.ts`, `src/shared/errors/map-error-to-http.ts` (or `error-http-maps.ts`), and the existing GET routes (`anime/index.ts`, `anime/[malId]/index.ts`, `anime/[malId]/characters.ts`, `anime/[malId]/full.ts`, `anime/[malId]/staff.ts`, `music/index.ts`, `music/[id].ts`, `user/[userId].ts`).
- **API behavior:** Successful responses are validated at the wrapper; a malformed payload now returns 500 `RESPONSE_VALIDATION_ERROR` instead of `200` with possibly-invalid data. Error envelope shape (`data/status/error/code/meta`) is unchanged.
- **Tests:** Existing route tests still pass; add wrapper tests for response-schema validation success/failure.
- **Deps:** none.
