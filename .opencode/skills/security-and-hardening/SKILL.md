---
name: security-and-hardening
description: Harden code against vulnerabilities in this stack. Use when handling user input, authentication, sessions, database access (Supabase/Postgres), external integrations, or anything exposed via an HTTP route. Use when building or reviewing a feature that accepts input, stores data, or authenticates users.
lifecycle-phase: IMPLEMENT / DOUBT
---

# Security in this stack

Apply at every boundary and especially in the DOUBT review phase. When auth or Supabase specifics matter, load `better-auth-best-practices` and `supabase`.

## 1. Validate at the boundary (Zod)
- Parse/infer incoming data with `safeParse()` and envelope schemas via `withZodValidation(schema)(handler)` (API Route Patterns). Return 400 on failure.
- Use `z.infer` for inferred types, `z.unknown()` (not `z.any()`), and `.strict()` for incoming objects.
- Never trust values from the wire into queries without validation.

## 2. Server-side trust model
- Repos must treat DB rows as storage types, mapped through a mapper—never pass raw rows into the UI.
- Never return sensitive fields (password hashes, tokens, PII) through mappers. Return only what the view needs.

## 3. Auth
- Use Better Auth session (`sessionService.getSession()`) for strict auth in API routes; typed errors on failure.
- Public routes live only in `src/config/public-routes.ts`.
- Session cookie markers `session_token=` / `session_data=`; don't rename without middleware changes.

## 4. Secrets & env
- All config is validated eagerly in `src/config/env.ts` (Zod); never introduce a new secret for a non-config, and never hard-code one or log it.
- No `console.log(error)`; route through the error factories + pino.

## 5. Data access
- Supabase/Postgres: use Drizzle typed queries and enforce RLS + query scoped to the acting user (id filters), per the `supabase` skill. Never `select *` into a trusted payload.
- Use Drizzle's typed queries; no raw string interpolation of user input in SQL.

## 6. Hardening review checklist (DOUBT)
- [x] Input validated at boundary with `safeParse`.
- [x] No secrets / tokens / hashes in responses or logs.
- [x] Authorization checked for each protected route; it belongs in the public list.
- [x] Errors mapped through `mapErrorToHttp` (no stack-in-clarty leaks).
- [x] No `any`, no non-null assertion crossing a trusted boundary.

## Sources
- `AGENTS.md` — API Route Patterns, Auth & Middleware, env, error handling.
- Better Auth / Drizzle / Supabase: fetch current docs via `context7` before coding, not memory.