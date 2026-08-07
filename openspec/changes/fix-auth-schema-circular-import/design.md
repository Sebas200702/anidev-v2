## Context

See proposal.md - Why. Confirmed in the production chunk `dist/server/chunks/auth-schema_BJlawpky.mjs`: the bundler emitted `relations(user, ...)` calls (lines 4-19) before the `const user` declaration (line 21), producing a TDZ ReferenceError. The chunk loads lazily, so the server starts but crashes when a route touches auth schema.

## Goals / Non-Goals

**Goals:**

- Eliminate the circular dependency so the bundler can order tables before relations.
- Keep the public export surface (`user`, `session`, `account`, `verification`, `userRelations`, `sessionRelations`, `accountRelations`) identical.

**Non-Goals:**

- No schema/table/column changes.
- No consumer-code changes outside the two schema modules (verified none import relations from `auth-schema`).
- No changes to the unrelated Redis/Dragonfly `ENOTFOUND` DNS issue reported in the same logs (separate infra concern).

## Decisions

**Break the cycle by removing the re-export from `auth-schema.ts`.**
The relations file imports tables from `auth-schema`; making `auth-schema` also export from the relations file creates a two-way edge. Removing that re-export leaves a single directed edge `auth-relations → auth-schema`, so chunking has a canonical order.

Alternative considered: inverting the direction (relations file imports tables, tables file imports relations) — rejected, tables are the primitive layer and relations reference them; `auth-schema` must not depend on `auth-relations`.

**Update the barrel `index.ts` to import relations from `./auth-relations`.**
The barrel is the only consumer of the relations through `auth-schema`. Splitting the export keeps the barrel's public API unchanged while sourcing each symbol from its defining module — matching how the barrel already imports anime relations (`./anime-entity-relations`, `./anime-taxonomy-relations`).

## Risks / Trade-offs

- A future contributor re-introduces the re-export → the codebase's "isolate imports from individual schema files to avoid circular imports" convention (`index.ts` module doc) plus the chunk-level build check below serve as guardrails.
- The TDZ error is platform/ordering-dependent (may not reproduce on every local build) → the verification step builds with `ASTRO_ADAPTER=bun` (same as the Docker runtime) and greps the produced chunk to confirm the relations calls now appear after the table declarations.
