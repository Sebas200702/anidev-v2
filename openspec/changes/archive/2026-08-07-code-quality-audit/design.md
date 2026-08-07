## Context

The repo's Verification gate (`format → check → check:types → test → build`) must be fully green before a PR, but currently emits Biome warnings/infos, Astro/TS hints, and a flaky failing test. `AGENTS.md` also mandates the architecture/code-style rules the fixes must respect: typed domain errors, no non-null assertions, early-return conditionals, `z.email()`, pinned CI.

## Goals / Non-Goals

**Goals:**
- Verify gate passes with 0 errors/warnings/hints across `check`, `check:types`, `test`, `build`.
- Replace generic `Error` with typed errors per `AGENTS.md` error-handling rules.
- Harden CI/Docker supply chain per SonarQube findings.

**Non-Goals:**
- No feature work, schema/data changes, or behavior-level spec deltas.
- No provider-stack migration — that lives in its own active change (`2026-08-06-migrate-provider-stack`).

## Decisions

- **Typed errors over `throw new Error`:** Add `EmptyImageError` alongside the existing `ImageTooLargeError` in `optimize-util.ts`, export it via the image barrel, and add a TDD test for the empty-buffer path (mock `@domains/media/config` to avoid eager env load).
- **Non-null assertion removal:** In `music-media-repository`, replace `row[srcKey]!` with a map-to-nullable + type-guard (`MusicMediaAsset`) narrowing; in `user-mapper.ts`, `birthday!` → `birthday ?? undefined` matching the optional schema.
- **Explicit types:** annotate return types on the four JSDoc-typed methods; `let media` → `let media: MediaAsset`; `body: unknown | null` → `body: unknown`.
- **Zod 4:** replace deprecated `z.string().email()` with `z.email()`.
- **`tsconfig`:** add `coverage`, `node_modules` to `exclude` (huge minified-file noise in `check:types`).
- **CI/Docker:** `--ignore-scripts` (prebuilt sharp binaries don't need scripts); pin all workflow actions to full 40-char SHAs.
- **Sentry test:** mock `@sentry/react` (was loading the real heavy package → cold-load timeout).

### Phase 2 — AGENTS.md convention sweep (no behavior delta)

- **Arrow-only:** all top-level `function` declarations become arrow-consts. Mechanical; generics stay comma-free (`.ts`, not `.tsx`); `withErrorHandling`'s function-type return annotation is parenthesized to avoid `=>` collision. Verified by `check:types`/`test`/`build` (TS flags any use-before-declaration).
- **Import aliases:** `@/domains/*` → `@domains/*`; enable Biome `noRestrictedImports` so the linter enforces the ban on `@/shared|@/domains|@/lib` going forward.
- **Cross-domain:** `anime` services must consume `media`/`music` via their public services, not their repositories. Where no public method exposes the needed data, add one to the target domain's service rather than reaching into its repository.
- **Single-responsibility types:** inline `type`/`interface` in mappers/services/repositories/cache/http move to a sibling `-types.ts`, re-exported through the folder barrel so import sites stay stable. Prefer `interface` for object shapes; keep unions, mapped types, `z.infer<typeof localSchema>`, and `type X = typeof runtime` as `type` (the documented technical exceptions).
- **Errors stay as-is:** `ImageTooLargeError`/`EmptyImageError` intentionally extend `Error` (shared-util layer, caught/mapped by callers) — not converted to `BaseError`, per the phase-1 decision above.

### Phase 3 — per-domain import aliases

- **One alias per domain:** `@anime`, `@auth`, `@media`, `@music`, `@user` map to `src/domains/*`, registered in all three alias sources (`tsconfig.json` paths, `astro.config.mjs` Vite `resolve.alias`, `vitest.config.ts`). The generic `@domains/*` is removed everywhere so a single import shape per domain is enforced.
- **Migration is quote-scoped:** only `'@domains/<domain>/` (and double-quote) string-literal imports are rewritten to `'@<domain>/`; JSDoc `@module`/`@see` labels are left untouched.
- **Enforcement:** `@domains/*` is added to Biome `noRestrictedImports`; a stray `@domains/…` import now fails both lint and (no alias) type resolution. `AGENTS.md`'s alias list is updated to match.
- **Line/column limits:** the governing limits remain `AGENTS.md`'s **150 lines/file** and **80 columns** (Biome `lineWidth`), not the 250/100 from the informal summary.

## Risks / Trade-offs

- `--ignore-scripts` could break a future dependency needing `postinstall`; mitigated by `sharp` using prebuilt binaries. If install breaks, remove the flag for that dep.
- `MusicMusicMediaAsset` is a narrowing-only type alias; return type stays `MediaAsset[]`.
- `EmptyImageError` is a runtime type change for the empty-buffer path — only caught by SDK callers that explicitly match it.