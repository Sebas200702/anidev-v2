---
name: debug-and-error-recovery
description: Diagnose and fix failures the systematic way in this stack. Use when a test fails, a build breaks, an API route throws, a page errors, behavior diverges from the spec, or you see any unexpected error. Pairs with the repo's error types and pino/Rustrak observability.
lifecycle-phase: IMPLEMENT (bugfix)
---

# Fail, don't flail

## 1. Reproduce & isolate
- Get a failing signal first: `bun run test`, `bun run build`, or the HTTP status + body of the route.
- Find the narrowest cause: which layer (schema → repository → mapper → service → page/route)? Unit-test the suspected layer with Vitest (TDD for the fix: write the failing test first).

## 2. Read the error, not the stack panic
- Route / page errors come through `mapErrorToHttp`: map the status back to a code in `src/shared/errors/codes.ts` to know the failure class (`VALIDATION_ERROR` → 400, `*_NOT_FOUND` → 404, `AUTH_REQUIRED`/`AUTH_INVALID_TOKEN` → 401, `DB_ERROR`/`CACHE_ERROR`/`EXTERNAL_API_ERROR` → 500).
- Logs: the repo uses pino at `LOG_LEVEL` (trace|debug|info|warn|error|fatal). Trace server errors before reasoning. Rustrak (when DSN set) captures them; when absent the SDK no-ops.

## 3. Hypothesis then verify
- State one likely cause. Fix it, re-run the failing test/build. Repeat if red.
- For repos: they must `try/catch` and map to the domain error factory (see AGENTS.md error handling) — a raw `throw new Error` creeping out is itself a defect. Swap it to the factory.

## 4. Nullability & parsing traps (common here)
- Repos return `undefined`, never `null` — a `=== null` check misses missing rows.
- `Number.parseInt` without radix, `.split(',').map(Number)` on empty → NaN. Validate at the boundary (`safeParse`).
- Non-null assertion `value!` where the case can be unhandled → make the branch explicit instead.

## 5. When stuck
- Re-read the spec delta / `design.md`, and the mapper shape. The intended shape is often in `src/domains/<domain>/types/`.
- Name the "right answer" out loud (a small concrete input/output) and force the code to match it.

## 6. Seal with a test
- End with a Vitest case that reproduces the bug (red→green). Run `bun run test` to confirm all green, then proceed to the life-cycle VERIFY gate.

## Sources
- `AGENTS.md` — Error handling, API Route Patterns, verification gate.
- Environment/log levels: `src/config/env.ts`, `src/lib/monitoring`.