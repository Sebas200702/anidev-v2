---
name: api-and-interface-design
description: Design stable APIs and module boundaries the way this repo does. Use when creating or changing REST/API routes, defining type contracts between layers, establishing boundaries (backend/frontend, domains), or organizing a domain layer into module unit folders. Use when designing Zod schemas, error contracts, or HTTP endpoints.
lifecycle-phase: PLAN / IMPLEMENT
---

# Design the contract, then build it

APIs here are thin and schema-first. The contract is a Zod schema at the boundary; everything downstream is typed from it.

## 1. Route composition (API Route Patterns)
- Use `withZodValidation(schema)(handler)` — a single Zod object validated as `{ params, query, body }`; returns 400 on failure. Prefer it over manual parsing.
- Error handling: `withErrorHandling(handler)` OR manual `try/catch` + `mapErrorToHttp(error)`.
- Response envelope is always `{ data, status, error?, meta? }`. Error codes live in `src/shared/errors/codes.ts`.

## 2. Public vs protected
- A route is public only if `isPublicRoute(pathname)` from `src/config/public-routes.ts` says so (for `/`, `/api/auth/login|register`, `/api/anime`, `/api/music`, `/media`). Reuse that matcher; do not reinvent a raw prefix check.
- Matching is boundary-aware, not a raw prefix: `/` matches only the root exactly, and `/api/anime/search` is public only because it extends `/api/anime/` — do not treat every `/`-prefixed path as public. So other paths still require auth.
- Otherwise require auth: `sessionService.getSession()` throws typed errors; let middleware's `resolveAuthActor()` populate `locals.user`/`locals.session`.

## 3. Schema & types
- `z.infer` for inferred types, `z.unknown()` (not `z.any()`), `.strict()` on incoming objects, `safeParse()` for input. Inferred types are the contract — no hand-written duplicates.
- Ids are validated, not trusted (see `ANIME_INVALID_ID` pattern in `codes.ts`).

## 4. Stable boundary habits
- The data flow is one-way: DB schema → repository → mapper → service → page/route. Components receive props only; services fetch.
- Repos return `undefined` (never `null`); services map `undefined` to `DomainError`/`*_NOT_FOUND` for 404.
- Keep API route files small (≤150 lines); move logic into the domain service, not into the route handler.

## 5. Module structure (unit folders)
Every element in a domain **logic layer** (`cache/ mappers/ repositories/ services/ policies/ middleware/ utils/`) is a **unit folder**, not loose files: the logic (`mapper.ts`, `repository.ts`, `service.ts`, …) plus its own `types.ts`/`helpers.ts`, behind an `index.ts` barrel. Folder name = the element (`anime-card`); the file is the generic kind.
- A companion type file exists because *these types belong to this module* — never a layer-wide `*-types.ts` sibling. Only cross-cutting `*DB` row types stay in the shared domain `types/` barrel.
- A cohesive multi-file subsystem is **one** unit (e.g. `media/cache/media-cache/` = `cache.ts` + `keys.ts` + `serialization.ts` + `store.ts` + `*.types.ts`), not one folder per file.
- Layer barrels re-export from units, so deep imports are `@x/<layer>/<unit>` (not `@x/<layer>/<unit>-mapper`). Create a folder / `types.ts` / `helpers.ts` only when the element needs it — no empty scaffolding.
- Pure-type layers (`types/`), single-file `schemas/`, and `errors/` stay flat. UI (`components/`) is a unit folder with the **named** file (`AnimeDetails.astro`); component-scoped hooks/types live inside it (see `presentational-container`).
- Full convention: AGENTS.md → "Module unit folders (co-location)".

## 6. Design review (doubt pass)
- Does the envelope hold for success AND every failure path?
- Is the status derivable by class (`mapErrorToHttp`) instead of hard-coded per route?
- Would a client break if I renamed the code string? Add a new code in `codes.ts` instead of repurposing one.

## Sources
- `AGENTS.md` — API Route Patterns, Data flow, Presentational-Container, Error handling.
- Reference code: `src/shared/http/`, `src/shared/errors/`.