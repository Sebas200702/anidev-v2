# Tasks — Modularize domain unit folders

## 1. anime
- [x] 1.1 `mappers/` → unit folders (`anime-card`, `anime-character`, `anime-external`, `anime-filters`, `anime-full`, `anime`, `anime-music`, `anime-staff`) + barrels; deep imports rewritten.
- [x] 1.2 `repositories/` → unit folders (incl. `anime-list` = `repository.ts` + `filters.ts` + `filters.types.ts`); barrels + imports.
- [x] 1.3 `cache/` and `services/` → unit folders; layer barrels repointed; `bun run check:types` + anime tests green.

## 2. media
- [x] 2.1 `cache/` → single cohesive `media-cache` unit (`cache`/`keys`/`serialization`/`store` + `*.types`).
- [x] 2.2 `mappers/`, `repositories/`, `services/` → unit folders; cross-domain imports (anime → media) rewritten; typecheck green.

## 3. music
- [x] 3.1 `cache/`, `mappers/`, `repositories/`, `services/` → unit folders; layer barrels repointed; typecheck green.

## 4. user & auth
- [x] 4.1 user `cache/`, `mappers/`, `policies/`, `repositories/`, `services/` → unit folders (policies keep `user-policy` aggregator via alias imports); typecheck green.
- [x] 4.2 auth `services/`, `middleware/`, `utils/` → unit folders; typecheck green.

## 5. Cleanup & docs
- [x] 5.1 Normalize `@module` JSDoc in moved files to their new paths.
- [x] 5.2 AGENTS.md — add "Module unit folders (co-location)", incl. the `components/ hooks/ stores/` UI rule.
- [x] 5.3 Skills — document the convention in `api-and-interface-design` (module structure) and `presentational-container` (UI co-location).

## 6. Verify
- [x] 6.1 Gate: `bun run check` (Biome; 7 single-line imports auto-collapsed), `bun run check:types` (369 files, 0 errors), `bun run test` (45 passing), `bun run build` (Complete).
- [x] 6.2 Committed on `refactor/modularize-domain-units` (refactor + docs), PR #94 opened against `master`.
