## Context

See `proposal.md` — Why. Today:

- `withErrorHandling` (in `src/shared/http/with-error-handling.ts`) wraps a handler, calls `createSuccessResponse(result.data, result.status, result.meta)` → `jsonResponse`. It has no response-schema validation.
- `withZodValidation` validates only the **request** (`params/query/body`) and attaches `validated`.
- Routes in `anime/*`, `music/*` use manual `try/catch + mapErrorToHttp + new Response(JSON.stringify(...))` and parse their `*ResponseSchema` inline (e.g. `anime/index.ts`, `anime/[malId]/index.ts`, `music/index.ts`, `music/[id].ts`).
- `auth/*` and `health/*` already compose `withZodValidation(...)(withErrorHandling(...))`.
- The error mapper (`src/shared/errors/map-error-to-http.ts`) dispatches by class; adding a code to `ErrorCodes` requires wiring it in `error-http-maps.ts` or the top-level mapper.
- `jsonResponse` already surfaces `meta.stale === true` as `x-stale: true`; preserving `meta.stale` through `withErrorHandling` keeps that behavior.

## Goals / Non-Goals

**Goals:**

- Single place for response validation (the wrapper), eliminating per-route `*ResponseSchema.parse` and manual error envelopes.
- Uniform composition across all routes: `withZodValidation(...)(withErrorHandling(handler, { responseSchema }))`.
- Malformed success output becomes 500 `RESPONSE_VALIDATION_ERROR`, not a 200 with broken data.

**Non-Goals:**

- Changing the request-validation behavior of `withZodValidation`.
- Changing the error envelope shape or status mapping for existing codes.
- Auto-inferring response schemas from service types (explicit opt-in per route).
- Overriding route-specific success behavior already supported (`status`, `meta`, `headers` in `HandlerResult`).

## Decisions

### 1. `withErrorHandling` accepts `{ responseSchema?: ZodType }`

Signature:

```ts
export const withErrorHandling = <TContext extends APIContext>(
  handler: RouteHandler<TContext>,
  options?: { responseSchema?: ZodType }
): ((context: TContext) => Promise<Response>) => { ... }
```

On success, after `createSuccessResponse`, if `options.responseSchema` is set:

```ts
const result = responseSchema.safeParse(handlerResult.data)
if (!result.success) {
  throw new ServerValidationError(result.error) // 500 RESPONSE_VALIDATION_ERROR
}
```

The envelope is still built by `createSuccessResponse`; validation only checks the inner `data`, not the whole envelope (which `createSuccessResponse` always shapes correctly). Throwing inside `withErrorHandling`'s own `try` is safe: the same `catch` maps it to the error envelope.

### 2. New error class + code

- `ErrorCodes.RESPONSE_VALIDATION_ERROR = 'RESPONSE_VALIDATION_ERROR'`.
- A `ServerValidationError extends InfraError` (or a small shared class) so it maps to 500 with `error` severity, generic client message `"Service unavailable"` is not appropriate — client message for a server-side contract violation should be clearer. Implement as a shared `ResponseValidationError extends DomainError`? No: it is not a client fault, so `InfraError`-like semantics (500, error severity) fit; message can be `"Response validation failed"` and details carry the Zod issues. Wire in `mapErrorToHttp` explicitly (InfraError already → 503 + Retry-After; we need 500, so a dedicated mapping for `RESPONSE_VALIDATION_ERROR` is required rather than extending InfraError blindly). Decide during implementation: likely a `DomainError` with the code placed in a 500 set, or a small custom branch before the InfraError check.

### 3. Refactor existing GET routes

Replace the manual block:

```ts
try {
  const payload = { data, status: 200, meta: { stale, page, total, hasNext } }
  const responseBody = animeListResponseSchema.parse(payload)
  return jsonResponse(responseBody)
} catch (error) {
  const { status, body } = mapErrorToHttp(error)
  return new Response(JSON.stringify({ data: null, status, error, meta }), { status, headers: {...} })
}
```

with:

```ts
withZodValidation(animeListRequestSchema)(
  withErrorHandling(
    async ({ validated }) => {
      const { value, isStale } = await animeListService.getAnimeList(validated.query)
      return {
        data: value.list,
        status: 200,
        meta: { stale: isStale, page: validated.query.page, total: value.total, hasNext: ... },
      }
    },
    { responseSchema: animeListResponseSchema }
  )
)
```

`meta.stale` flows through `createSuccessResponse` → `jsonResponse` so the `x-stale` header is preserved. `responseSchema` validates `data` (the list), not the whole envelope, so `stale`/`page`/`total` metadata is not required by the schema.

### 4. Order of composition

`withZodValidation` runs first (invalid request → 400 before handler), then `withErrorHandling` runs the handler and validates/serializes. This matches `auth/*` today.

### 5. Route handler types

`withErrorHandling`'s `RouteHandler<TContext>` returns `HandlerResult` where `data: unknown`. With `responseSchema`, the wrapper type-check could refine `data` to the schema's output. Optional; minimal change is to accept `ZodType` and parse at runtime. Type refinement is a non-goal for this change unless cheap.

## Risks / Trade-offs

- **[Risk] Existing routes rely on response schema parsing side effects (e.g. normalization)** → Mitigation: `parse` (not `safeParse`) on success currently throws to the catch; wrapper's `safeParse` + throw preserves failure mapping to 500.
- **[Risk] Refactor touches many files** → Mitigation: keep changes mechanical (same data/meta), run full gate; behavior only differs on previously-malformed payloads (none expected).
- **[Trade-off] `meta` not validated** → The envelope's `meta` is a free-form `Record<string, unknown>`; validating it adds little. Response schema checks the business `data` only.

## Migration Plan

- Add the option and error code behind the current behavior (no routes pass `responseSchema` yet).
- Migrate routes one at a time (anime list/details/characters/full/staff, music list/details, user get/patch).
- Run the full verification gate; release flow per AGENTS.md on the feature branch.

## Open Questions

- None blocking. Exact placement of the 500 mapping (custom branch vs. a server-error set) is an implementation detail; keep `mapErrorToHttp`'s existing class-dispatch intact.
