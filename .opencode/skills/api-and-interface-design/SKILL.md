---
name: api-and-interface-design
description: Design stable APIs and module boundaries the way this repo does. Use when creating or changing REST/API routes, defining type contracts between layers, or establishing boundaries (backend/frontend, domains). Use when designing Zod schemas, error contracts, or HTTP endpoints.
lifecycle-phase: PLAN / IMPLEMENT
---

# Design the contract, then build it

APIs here are thin and schema-first. The contract is a Zod schema at the boundary; everything downstream is typed from it.

## 1. Route composition (API Route Patterns)
- Use `withZodValidation(schema)(handler)` — a single Zod object validated as `{ params, query, body }`; returns 400 on failure. Prefer it over manual parsing.
- Error handling: `withErrorHandling(handler)` OR manual `try/catch` + `mapErrorToHttp(error)`.
- Response envelope is always `{ data, status, error?, meta? }`. Error codes live in `src/shared/errors/codes.ts`.

## 2. Public vs protected
- A route is public only if prefix-matching `src/config/public-routes.ts` (/, /api/auth/login|register, /api/anime, /api/music, /media).
- Otherwise require auth: `sessionService.getSession()` throws typed errors; let middleware's `resolveAuthActor()` populate `locals.user`/`locals.session`.

## 3. Schema & types
- `z.infer` for inferred types, `z.unknown()` (not `z.any()`), `.strict()` on incoming objects, `safeParse()` for input. Inferred types are the contract — no hand-written duplicates.
- Ids are validated, not trusted (see `ANIME_INVALID_ID` pattern in `codes.ts`).

## 4. Stable boundary habits
- The data flow is one-way: DB schema → repository → mapper → service → page/route. Components receive props only; services fetch.
- Repos return `undefined` (never `null`); services map `undefined` to `DomainError`/`*_NOT_FOUND` for 404.
- Keep API route files small (≤150 lines); move logic into the domain service, not into the route handler.

## 5. Design review (doubt pass)
- Does the envelope hold for success AND every failure path?
- Is the status derivable by class (`mapErrorToHttp`) instead of hard-coded per route?
- Would a client break if I renamed the code string? Add a new code in `codes.ts` instead of repurposing one.

## Sources
- `AGENTS.md` — API Route Patterns, Data flow, Presentational-Container, Error handling.
- Reference code: `src/shared/http/`, `src/shared/errors/`.