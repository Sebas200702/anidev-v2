## 1. Tooling & config

- [ ] 1.1 Add dev dep `@playwright/test`; scripts `test:e2e` (`playwright test`),
      `test:e2e:ui` (`playwright test --ui`), `test:e2e:install`
      (`playwright install --with-deps chromium`)
- [ ] 1.2 `playwright.config.ts`: `testDir: 'e2e'`, `fullyParallel: true`,
      `retries: process.env.CI ? 2 : 0`, `trace: 'on-first-retry'`, HTML reporter,
      `webServer` (`bun run preview`, readiness url `/api/health/readiness`,
      `reuseExistingServer: !CI`, env aligned to `src/config/env.ts`),
      `use.baseURL`
- [ ] 1.3 Exclude `e2e/` from Vitest (`vitest.config.ts` include already scopes to
      `src/**/__tests__`; confirm no overlap) and ensure Biome/tsconfig cover `e2e/`
      without treating specs as app code
- [ ] 1.4 `.gitignore` Playwright artifacts (`playwright-report/`, `test-results/`,
      `.playwright/`)

## 2. Harness & fixtures

- [ ] 2.1 `e2e/fixtures/auth.ts`: register + login through the real Better Auth
      endpoints, expose an authenticated `APIRequestContext` (cookies applied);
      unique throwaway user per test/worker
- [ ] 2.2 `e2e/fixtures/seed.ts`: idempotent deterministic baseline + cleanup
      helpers (per-worker namespacing for write tests)
- [ ] 2.3 `bun run db:seed:e2e` script: minimal, idempotent seed sufficient for the
      first suites (a few anime + music rows with known titles/ids)
- [ ] 2.4 `e2e/README.md`: how to run locally (`docker compose up -d` →
      `db:migrate` → `db:seed:e2e` → `test:e2e`), and the layer's scope guard

## 3. API/HTTP E2E suites (endpoints on master today)

- [ ] 3.1 `e2e/api/health.spec.ts`: `/api/health` 200; `/api/health/readiness`
      reports DB + cache up against the real stack
- [ ] 3.2 `e2e/api/anime-list.spec.ts`: `GET /api/anime` real 200 envelope +
      pagination `meta`; free-text `query`; `400` on invalid params; seeded rows
- [ ] 3.3 `e2e/api/auth-session.spec.ts`: register → login issues a session cookie;
      an authenticated-only route accepts it; anonymous → 401
- [ ] 3.4 `e2e/api/search-history.spec.ts` (flagship): authed `GET /api/anime?query=…`
      records history → `GET /api/search-history` lists it → `DELETE` clears it;
      **anon → 401** on both verbs; verifies real Postgres persistence
- [ ] 3.5 `e2e/api/music.spec.ts`: `GET /api/music` real envelope (second-domain
      sanity)

## 4. Browser E2E scaffold

- [ ] 4.1 `e2e/ui/smoke.spec.ts`: home page renders, has `<title>`/nav, **no
      console errors**; keep as the growth point for UI E2E

## 5. CI integration (blocking)

- [ ] 5.1 Add an `e2e` job to `.github/workflows/ci.yml` with Postgres + Dragonfly
      **service containers**, correct env (`DATABASE_URL`/`REDIS_URL`/…), steps:
      install → `playwright install --with-deps chromium` → `db:migrate` →
      `db:seed:e2e` → `build` → `test:e2e`
- [ ] 5.2 Cache Playwright browser binaries; upload `playwright-report/` as an
      artifact on failure
- [ ] 5.3 Make `e2e` a **required** check (document that branch protection must add
      it; the workflow change is in-repo)

## 6. Methodology docs

- [ ] 6.1 `AGENTS.md` Testing: document the **unit → integration → E2E** pyramid,
      Playwright layout (`e2e/`), the auth/seed fixtures, and the scope guard
      (E2E for wiring/critical paths, not unit-coverage mirroring)
- [ ] 6.2 `AGENTS.md` Verification gate + Commands table: add `test:e2e` and note
      E2E is blocking in CI; `development-lifecycle` VERIFY references the E2E step
- [ ] 6.3 Flag the stale `TURSO_*`/`UPSTASH_*` env drift (`AGENTS.md` Environment +
      `ci.yml` `gate` job) as a follow-up — **not** fixed here

## 7. Verification

- [ ] 7.1 Local: `docker compose up -d` → migrate → seed → `bun run test:e2e` green
      (API + smoke); confirm `reuseExistingServer` path works
- [ ] 7.2 Existing gate stays green: `format` · `check` · `check:types` · `test` ·
      `build` (E2E adds no runtime code)
- [ ] 7.3 CI: the new `e2e` job passes on the PR (service containers boot, browser
      installs, specs pass); Conventional Commits per task group; PR when requested
