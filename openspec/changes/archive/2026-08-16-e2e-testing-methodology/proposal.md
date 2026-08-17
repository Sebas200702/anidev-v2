## Why

The testing methodology (`AGENTS.md` → Testing, `development-lifecycle` VERIFY)
has two layers — **unit** (Vitest, mocked; the blocking gate) and **opt-in
integration** (Vitest + real Postgres via `RUN_DB_TESTS`, not gated). It has **no
end-to-end layer**: nothing exercises the _running_ system over HTTP, so the
wiring that unit/integration tests skip — middleware, auth/session cookies, the
`withZodValidation`→`withErrorHandling` wrapper, the real HTTP envelope, and the
Postgres + Dragonfly it all talks to — is never proven to actually work together.

Concrete blind spots today: no test proves a real `GET /api/anime?query=…` returns
a valid envelope from the built server, that `GET`/`DELETE /api/search-history` is
gated (401 anon vs 200 owner) and truly persists/clears rows in Postgres, that a
session cookie issued by Better Auth is accepted downstream, or that authenticated
search recording actually writes history. These are exactly the failures that
"green unit tests, broken app" hide.

## What Changes

- Adopt **Playwright Test** as the single E2E runner for **both** layers:
  - **API/HTTP E2E** (`request` fixture) — hit real endpoints on the built server,
    assert real envelopes, status codes, headers, cookies, and DB side effects.
  - **Browser E2E** (`page`) — drive the real UI; scaffold + smoke now, grows with
    the frontend.
- Boot the app under test via Playwright `webServer` running `bun run preview`
  (built `astro preview`) against the local **`docker-compose` stack** (Postgres +
  Dragonfly), with env aligned to `src/config/env.ts` (the source of truth:
  `DATABASE_URL`, `REDIS_URL`, `APP_BASE_URL`, `BETTER_AUTH_SECRET`).
- Add a top-level **`e2e/`** suite (`e2e/api/`, `e2e/ui/`, `e2e/fixtures/`) with an
  **auth fixture** (register + login through the real endpoints to obtain a
  session) and **seed/cleanup helpers** for deterministic data.
- Make E2E a **blocking CI gate**: add Postgres + Dragonfly **service containers**
  to `.github/workflows/ci.yml`, run migrations, build, boot `preview`, and run
  `playwright test` on every PR.
- Codify the layer in **`AGENTS.md`** (Testing + Verification gate) and the
  `development-lifecycle` VERIFY step: the pyramid is now **unit → integration →
  E2E**, with E2E required before merge.

Master already includes the advanced-search + search-history feature (merged in
PR #101), so the first suites cover **the real critical paths that exist today**:
`/api/health`, `/api/anime` (list + free-text search), Better Auth register/login,
`/api/search-history` (record via search → list → clear, with the 401 gate), and
`/api/music`.

## Non-goals

- **Not** replacing unit/integration tests — E2E sits on top, kept lean (smoke +
  critical paths), not a mirror of unit coverage.
- **No** visual-regression/snapshot pixel testing yet (possible fast-follow).
- **No** production/staging E2E — the harness runs against the local/CI stack only.
- **Not** fixing the stale `TURSO_*`/`UPSTASH_*` names in `AGENTS.md` Environment
  and the CI `gate` job env (unrelated provider-swap drift) — flagged as a
  separate follow-up.

## Capabilities

### New Capabilities

- `testing/e2e`: An end-to-end testing layer (Playwright, API + browser) that runs
  the built application against a real Postgres + Dragonfly stack and gates merges
  in CI.

## Impact

- **Tooling:** new dev deps `@playwright/test` (+ browser binaries in CI);
  `playwright.config.ts`; scripts `test:e2e`, `test:e2e:ui`, `test:e2e:install`.
- **Repo:** new top-level `e2e/` dir (outside Vitest's `src/**/__tests__` include);
  Biome/tsconfig awareness of `e2e/`.
- **CI:** `.github/workflows/ci.yml` gains a Postgres + Dragonfly service-container
  job that builds, migrates, boots `preview`, and runs `playwright test` (blocking).
- **Docs:** `AGENTS.md` Testing + Verification gate updated; lifecycle VERIFY notes
  the E2E step.
- **Runtime code:** none — this change adds tests and tooling only (`skip_specs`).
