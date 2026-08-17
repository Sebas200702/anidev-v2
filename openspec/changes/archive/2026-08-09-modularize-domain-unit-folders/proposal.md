# Proposal — Modularize domain unit folders

## Why

The domain layer classified files by **technical type** (`mappers/`,
`repositories/`, `services/`, `cache/`, …) and, inside each layer, kept every
element's specific types as loose `*-types.ts` siblings sitting next to the
logic — the same defect repeated across every layer and every domain. The
structure answered *"what is this file?"* (a type, a mapper) instead of *"what
module does it belong to?"*. Reading, changing, or moving one element meant
touching several flat files that only naming convention tied together.

## What Changes

- Convert every element in the domain **logic layers** (`cache/ mappers/
  repositories/ services/ policies/ middleware/ utils/`) into a **unit folder**
  that co-locates its logic + type/helper companions behind a barrel:
  `mappers/anime-card/{ index.ts, mapper.ts, types.ts }`. Applied across all five
  domains (`anime, auth, media, music, user`).
- The file inside a unit is the generic **kind** (`mapper.ts`, `repository.ts`,
  `service.ts`, `cache.ts`, `policy.ts`, `middleware.ts`, `util.ts`); the folder
  name carries the element identity (`anime-card`, `anime-list`).
- A cohesive multi-file subsystem is **one** unit folder, not N (e.g.
  `media/cache/media-cache/` = `cache.ts` + `keys.ts` + `serialization.ts` +
  `store.ts` + their `*.types.ts`).
- Layer barrels re-export from the unit folders, so deep imports become
  `@anime/mappers/<unit>` — **no consumer import breaks**.
- Pure-type layers (`types/`), single-file `schemas/`, and `errors/` stay flat;
  cross-cutting `*DB` row types remain shared in the domain `types/` barrel — no
  artificial scaffolding.
- Document the convention in `AGENTS.md` ("Module unit folders (co-location)"),
  including the UI-layer rule for `components/ hooks/ stores/`, and in the
  `api-and-interface-design` and `presentational-container` skills.

## Capabilities

### New Capabilities
None — pure structural refactor (`skip_specs: true`).

### Modified Capabilities
None — no runtime behavior changes; no spec deltas. The public import surface
(barrels) is preserved.

## Impact

- **Code**: `src/domains/**` — 102 file renames into unit folders, ~70 new unit
  barrels, layer barrels repointed, deep imports rewritten, `@module` JSDoc
  normalized to the new paths. No `.astro` / API / DB / cache logic changed.
- **Docs**: `AGENTS.md` (Architecture · Module unit folders).
- **Skills**: `.opencode/skills/api-and-interface-design`,
  `.opencode/skills/presentational-container`.
- **Verification**: `bun run check` (Biome) + `bun run check:types` (369 files,
  0 errors) + `bun run test` (45 passing) + `bun run build` (Complete) — all
  green. No dependencies added.
- **Follow-up (NOT in this change)**: phase 2 — collapse the technical layers
  into functional units (`anime/card/`, `anime/full/`); the unit folders set it
  up.
