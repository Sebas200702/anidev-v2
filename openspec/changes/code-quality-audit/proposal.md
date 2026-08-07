## Why

The codebase accumulated lint/type warnings, a failing test, and code-quality anti-patterns (generic `Error` throws, non-null assertions, implicit `any`, deprecated APIs, unpinned CI actions). These pass the build today but violate `AGENTS.md`'s quality bar, degrade CI signal, and risk escaping supply-chain hygiene. The verification gate is not fully green.

## What Changes

- Fix the flaky `sentry.test.ts` (missing `@sentry/react` mock caused a cold-load timeout).
- Clear all Biome warnings/infos: add radix to `Number.parseInt`, replace non-null assertions with real narrowing, type `let media`.
- Clear all Astro/TS hints: annotate explicit return types (ts80003), migrate deprecated `z.string().email()` to `z.email()` (Zod 4), exclude `coverage/`/`node_modules` from `tsconfig`.
- Replace generic `throw new Error('Empty buffer')` with a typed `EmptyImageError` (+ barrel export, + TDD test).
- Harden CI/Docker supply chain: `--ignore-scripts` on Bun install, pin GitHub Actions to full commit SHAs.
- Replace `body: unknown | null` with `body: unknown`.

## Capabilities

### New Capabilities

None. This is a refactor/tooling change with no spec-level behavior delta (`skip_specs: true`).

### Modified Capabilities

None.

## Impact

- `src/shared/http/with-validation.ts`, `src/shared/utils/image/*`, `src/domains/{anime,auth,media,user}/...`
- `src/lib/monitoring/__tests__/sentry.test.ts`
- CI/CD: `.github/workflows/ci.yml`, `deploy.yml`, `Dockerfile`
- `tsconfig.json`