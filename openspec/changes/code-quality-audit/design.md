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

## Risks / Trade-offs

- `--ignore-scripts` could break a future dependency needing `postinstall`; mitigated by `sharp` using prebuilt binaries. If install breaks, remove the flag for that dep.
- `MusicMusicMediaAsset` is a narrowing-only type alias; return type stays `MediaAsset[]`.
- `EmptyImageError` is a runtime type change for the empty-buffer path — only caught by SDK callers that explicitly match it.