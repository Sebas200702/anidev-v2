## 1. Tooling & config

- [x] 1.1 Add dev dep `@playwright/test`; scripts `test:e2e` (`playwright test`),
      `test:e2e:ui` (`playwright test --ui`), `test:e2e:install`
      (`playwright install --with-deps chromium`)
- [x] 1.2 `playwright.config.ts`: `testDir: 'e2e'`, `fullyParallel: true`,
      `retries: process.env.CI ? 2 : 0`, `trace: 'on-first-retry'`, HTML reporter,
      `webServer`, `use.baseURL`. **Deviations from plan:** (a) `webServer` serves
      the **Bun standalone artifact** (`bun run build && bun run dist/server/entry.mjs`;
      CI serves only), not `bun run preview` — the Vercel adapter has no `preview`;
      (b) dedicated port **4331** (not 4321) so it never reuses a stale dev/preview
      server; (c) `REDIS_URL` pinned to `localhost:6379` (the `.env` `dragonfly`
      hostname is Docker-network only); (d) added `globalSetup` (`e2e/global-setup.ts`)
      to serially warm the server and kill cold-start 500 races; (e) `Origin` header
      sent on all requests (Astro `checkOrigin` CSRF guard)
- [x] 1.3 Vitest already scopes to `src/**/__tests__` (no `e2e/` overlap); Biome +
      tsconfig cover `e2e/` and `playwright.config.ts` as non-app code (both clean)
- [x] 1.4 `.gitignore` Playwright artifacts (`/test-results/`, `/playwright-report/`,
      `/blob-report/`, `/playwright/.cache/`)

## 2. Harness & fixtures

- [x] 2.1 `e2e/fixtures/auth.ts`: register through the real Better Auth endpoint,
      expose an authenticated `APIRequestContext` (session cookie applied); unique
      throwaway user per test/worker (login is separately exercised in the spec)
- [x] 2.2 `e2e/fixtures/seed-data.ts`: deterministic baseline constants + rows the
      specs assert against (per-test throwaway users make write tests self-isolating,
      so no per-worker namespacing needed yet)
- [x] 2.3 `bun run db:seed:e2e` (`e2e/fixtures/seed-db.ts`): idempotent upsert seed
      (2 anime + 1 music with known ids/titles) via raw `INSERT … ON CONFLICT`
- [x] 2.4 `e2e/README.md`: local run flow + the layer's scope guard

## 3. API/HTTP E2E suites (endpoints on master today)

- [x] 3.1 `e2e/api/health.spec.ts`: `/api/health/readiness` reports DB + cache up
- [x] 3.2 `e2e/api/anime-list.spec.ts`: `GET /api/anime` 200 envelope + pagination
      `meta`; free-text `query` returns the seeded row; `400` on invalid params
      (asserts the real Zod-wrapper envelope: `error` + `meta.details.issues`, no `code`)
- [x] 3.3 `e2e/api/auth-session.spec.ts`: register → session; login on a fresh
      context → session; anonymous authed-route → 401
- [x] 3.4 `e2e/api/search-history.spec.ts` (flagship): authed `GET /api/anime?query=…`
      records → `GET /api/search-history` lists → `DELETE` clears; anon → 401 on
      both verbs; real Postgres persistence
- [x] 3.5 `e2e/api/music.spec.ts`: `GET /api/music` real envelope

## 4. Browser E2E scaffold

- [x] 4.1 `e2e/ui/smoke.spec.ts`: home renders, has `<title>`, **no console errors**

## 5. CI integration (blocking)

- [x] 5.1 Added an `e2e` job to `.github/workflows/ci.yml` with Postgres + Dragonfly
      **service containers**, correct env (`DATABASE_URL`/`REDIS_URL`/`APP_BASE_URL`/
      `BETTER_AUTH_SECRET`/`ASTRO_ADAPTER=bun`), steps: install → chromium install →
      `db:migrate` → `build` → `db:seed:e2e` → `test:e2e`
- [x] 5.2 Upload `playwright-report/` as an artifact (`if: !cancelled()`).
      **Deferred:** browser-binary caching (no `actions/cache` pin added yet) — a
      follow-up optimization, not correctness
- [ ] 5.3 Make `e2e` a **required** check — branch-protection change is out of repo
      (manual in GitHub settings); the workflow is in-repo and ready

## 6. Methodology docs

- [x] 6.1 `AGENTS.md` Testing: documented the unit → E2E split, Playwright layout
      (`e2e/`), auth/seed fixtures, and the scope guard
- [x] 6.2 `AGENTS.md` Verification gate + Commands table: added `test:e2e`/
      `test:e2e:ui`/`test:e2e:install`/`db:seed:e2e` and the E2E blocking-in-CI note
- [x] 6.3 Stale `TURSO_*`/`UPSTASH_*` env drift flagged as a follow-up (the `gate`
      job + AGENTS.md Environment still use the placeholder names) — **not** fixed here

## 7. Verification

- [x] 7.1 Local: `docker compose up -d` → migrate → seed → `bun run test:e2e` green
      (11 API + 1 smoke = 12 passed; validated 6× consecutively after the warmup fix)
- [x] 7.2 Existing gate stays green: `format` · `check` · `check:types` clean (E2E
      adds no runtime `src/` code; Vitest scope unchanged)
- [ ] 7.3 CI: the new `e2e` job passes on the PR (verified once pushed); Conventional
      Commits per task group; PR when requested
