# Design — Modularize domain unit folders

## Context

See `proposal.md` — Why. Each domain (`anime, auth, media, music, user`) was
split by technical layer, and inside each layer the files were flat: logic plus
`*-types.ts` / `*-helpers.ts` siblings. 38 files imported the shared
`@anime/types` barrel; ~150 deep imports referenced specific layer files
(`@x/mappers/foo-mapper`). Components already followed the
directory-per-component + barrel convention; `hooks/`/`stores/` are reserved
aliases (`@hooks`/`@stores`) with no files yet.

## Goals / Non-Goals

**Goals**
- Co-locate each element with its own types/helpers in a unit folder behind a
  barrel, across all logic layers and all domains.
- Keep the public import surface stable (layer barrels re-export units) so no
  consumer breaks and the change stays green at every step.
- Make the convention binding in `AGENTS.md` and the relevant skills.

**Non-Goals**
- No runtime behavior change; no `.astro` / API / DB / cache / logic edits.
- Not collapsing the technical layers into functional units yet (phase 2).
- Not restructuring pure-type / `schemas/` / `errors/` layers, nor moving the
  cross-cutting `*DB` types out of the shared `types/` barrel.
- Not creating empty `hooks/` / `stores/` scaffolding.

## Decisions

- **Unit = cohesive responsibility, not one-folder-per-file.** Peer elements
  (each distinct mapper / repository / service) each get a folder; a subsystem
  split into parts (`media-cache` = keys / serialization / store / main) is a
  single unit. Rationale: follow real dependencies and responsibility, not a
  rigid template.
- **Generic kind filename inside the folder** (`mapper.ts`, `repository.ts`, …);
  the folder name carries identity. UI is the exception: components keep the
  **named** file (`AnimeDetails.astro`) per Astro/React convention.
- **Types belong to their module.** Element-specific `*-types.ts` moves into the
  unit as `types.ts`; only cross-cutting `*DB` row types (projections of
  `@db/schemas`, consumed everywhere) stay in the shared domain `types/` barrel.
- **Barrels preserve the public API.** Layer barrels re-export from units; unit
  barrels `export *` from their leaves. Deep imports become `@x/<layer>/<unit>`.
  Alternative — rewrite every consumer to `@x/<unit>` and collapse the layers —
  is deferred to phase 2 to keep this change non-breaking.
- **No artificial scaffolding.** A folder / `types.ts` / `helpers.ts` /
  `index.ts` exists only when the element needs it. Single-file peer elements
  still get a folder + barrel for a uniform, phase-2-ready module surface;
  pure-type and single-file `schemas/` / `errors/` layers stay flat.
- **UI co-location.** A hook / store / type used by one component lives inside
  that component's folder; only cross-component state goes to
  `domains/<d>/hooks|stores/` (or `@hooks`/`@stores` app-wide). Applied lazily
  when the first hook/store is created.

## Risks / Trade-offs

- [Import breakage across 5 domains] → mechanical `git mv` + quoted-specifier
  global rewrites, gated by `bun run check:types` after every domain; ended at
  0 errors, 45 tests, build green.
- [Single-file unit folders look redundant] → accepted for a uniform, phase-2
  ready module surface; the anti-scaffolding rule still forbids empty companions.
- [Doc / `@module` drift] → `@module` tags normalized to the new file paths in a
  final pass; Biome auto-collapsed 7 imports that became single-line.

## Migration Plan

Refactor + docs only. Ship on a `refactor/modularize-domain-units` branch, pass
the gate (`format → check → check:types → test → build`), merge via PR. No
runtime delta, so `skip_specs: true` and no `release:*` bump beyond the commit
set. Phase 2 (functional-unit collapse) is a separate future change.

## Open Questions

None.
