# Design — E2E testing methodology

## Context

- **App**: Astro 6 SSR (`output: 'server'`, `@astrojs/vercel`). Runtime env is
  validated eagerly by `src/config/env.ts`: **`DATABASE_URL`** (postgres),
  **`REDIS_URL`** (redis/dragonfly), **`APP_BASE_URL`**, **`BETTER_AUTH_SECRET`**
  (≥32), optional `SENTRY_DSN`/`LOG_LEVEL`. This is the source of truth (the
  `TURSO_*`/`UPSTASH_*` names in `AGENTS.md` + `ci.yml` are stale drift).
- **Stack for tests**: `docker-compose.yml` already provides Postgres :5432 +
  Dragonfly :6379 (+ Rustrak, not needed for E2E — `SENTRY_DSN` unset → no-op).
- **Existing layers**: unit (Vitest, mocked, gated) and integration (Vitest +
  Postgres, `RUN_DB_TESTS`, opt-in). E2E is the missing top of the pyramid.
- **Master state**: PR #101 merged, so advanced search + `search_history` (routes
  `GET /api/anime` with recording, `GET`/`DELETE /api/search-history`) exist on
  master and are in scope for the first suites.

## Goals

1. Prove the **running** system works end to end over HTTP (middleware → wrapper →
   service → repo → Postgres/Dragonfly → envelope), including **auth/session**.
2. One runner for **API and browser** E2E; unified config, reporting, traces.
3. **Deterministic** and **blocking in CI** without flakiness.

## Decision 1 — Playwright Test as the single E2E runner (API + browser)

Playwright Test covers both layers, avoiding a second tool (e.g. supertest):

- **API E2E** uses the `request` fixture (`APIRequestContext`) — real HTTP to the
  booted server, real status/headers/body, real `Set-Cookie`. No browser needed.
- **Browser E2E** uses `page` for UI flows.
- `webServer` boots the app once; `trace`/`video`/`retries` are shared.

Rejected: **supertest/vitest-over-http** (can't drive the browser, and mounting the
Astro handler in-process re-imports app modules rather than testing the built
artifact) and **a bespoke fetch harness** (reinvents fixtures, retries, tracing).

## Decision 2 — Boot the built server via `webServer`

```ts
// playwright.config.ts (shape)
webServer: {
  command: 'bun run preview',            // astro preview = built server
  url: 'http://127.0.0.1:4321/api/health/readiness',
  reuseExistingServer: !process.env.CI,  // local: reuse a running dev/preview
  timeout: 120_000,
  env: {                                 // aligned with src/config/env.ts
    DATABASE_URL: process.env.E2E_DATABASE_URL!,
    REDIS_URL: process.env.E2E_REDIS_URL!,
    APP_BASE_URL: 'http://127.0.0.1:4321',
    BETTER_AUTH_SECRET: process.env.E2E_BETTER_AUTH_SECRET
      ?? 'e2e-secret-e2e-secret-e2e-secret-e2e!!',
    LOG_LEVEL: 'warn',
  },
},
use: { baseURL: 'http://127.0.0.1:4321' },
```

- Readiness URL is `GET /api/health/readiness` (probes DB + cache) so Playwright
  waits until dependencies are actually reachable, not just the port.
- **Build precedes preview** in CI (`bun run build` in the job, before the
  webServer starts). Locally, `reuseExistingServer` lets a dev server be reused.

## Decision 3 — Layout and fixtures

```
e2e/
├── api/            # HTTP-level specs: health, anime search, auth, search-history, music
├── ui/             # browser specs: smoke now, grows with the frontend
├── fixtures/
│   ├── auth.ts     # register+login via real endpoints → authed request context
│   └── seed.ts     # deterministic seed + cleanup helpers (per-worker namespacing)
└── README.md
```

- **Auth fixture**: creates a throwaway user through the real Better Auth
  register/login routes and exposes an authenticated `request` context (cookies
  applied). This exercises the true session path — no fake JWTs.
- **Data determinism**: E2E asserts against a **seeded baseline** applied by
  migrations + a seed step. Tests that write (e.g. history) use a **unique user
  per test/worker** and clean up, so parallel workers don't collide. Read-only
  catalog assertions target known seeded rows.
- **Isolation**: `fullyParallel: true`; each worker gets its own user. No test
  depends on another's state.

## Decision 4 — CI: blocking job with service containers

Add a second job to `ci.yml` (the existing `gate` job stays as-is). Sketch:

```yaml
e2e:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env: { POSTGRES_USER: e2e, POSTGRES_PASSWORD: e2e, POSTGRES_DB: anidev_e2e }
      ports: ['5432:5432']
      options: >-
        --health-cmd "pg_isready -U e2e" --health-interval 5s
        --health-timeout 5s --health-retries 10
    dragonfly:
      image: docker.dragonflydb.io/dragonflydb/dragonfly
      ports: ['6379:6379']
  env:
    DATABASE_URL: postgres://e2e:e2e@localhost:5432/anidev_e2e
    REDIS_URL: redis://localhost:6379
    APP_BASE_URL: http://127.0.0.1:4321
    BETTER_AUTH_SECRET: e2e-secret-e2e-secret-e2e-secret-e2e!!
  steps:
    - checkout / setup bun
    - bun install --frozen-lockfile
    - bunx playwright install --with-deps chromium
    - bun run db:migrate         # apply schema to the fresh service DB
    - bun run db:seed:e2e         # deterministic baseline (new script)
    - bun run build
    - bun run test:e2e            # playwright boots preview + runs specs
    - upload playwright-report on failure
```

- **Blocking**: `e2e` is a required check alongside `gate`.
- **Cost control**: install **chromium only** (`--with-deps chromium`); API specs
  need no browser. Cache Playwright browsers between runs.
- **Fresh DB each run** (service container) → no baseline/`__drizzle_migrations`
  drift like the VPS; migrations apply from empty cleanly.

## Decision 5 — Keep E2E lean (pyramid, not ice-cream-cone)

E2E covers **critical paths and wiring**, not exhaustive combinations (those stay
in unit/integration). Scope guard in `AGENTS.md`: prefer a unit test unless the
value is specifically in the _integration of running parts_ (HTTP, auth, real DB).

## First suites (this change, endpoints on master today)

| Spec | Layer | Proves |
|------|-------|--------|
| `api/health.spec.ts` | API | `/api/health` 200; `/api/health/readiness` reports DB+cache up |
| `api/anime-list.spec.ts` | API | `GET /api/anime` real 200 envelope; pagination `meta`; free-text `query`; `400` on bad params |
| `api/auth-session.spec.ts` | API | register→login issues a session cookie; an authed-only route accepts it; anon → 401 |
| `api/search-history.spec.ts` | API | authed search on `/api/anime` records history → `GET /api/search-history` lists it → `DELETE` clears it; **anon → 401** on both verbs |
| `api/music.spec.ts` | API | `GET /api/music` real envelope (second-domain sanity) |
| `ui/smoke.spec.ts` | Browser | home renders, no console errors, `<title>`/nav present |

The `search-history` spec is the flagship end-to-end proof: it spans auth cookie →
`GET /api/anime?query=…` recording → Postgres row → authed read → clear, i.e. the
exact wiring unit/integration tests cannot cover.

## Risks & mitigations

- **Flakiness** → readiness-gated `webServer`, per-worker users, auto-retries in CI
  (`retries: process.env.CI ? 2 : 0`), traces on first retry.
- **CI time** → chromium-only, cached browsers, API specs (fast) dominate.
- **Auth coupling to Better Auth internals** → go through public register/login
  endpoints only; never mint cookies by hand.
- **`db:seed:e2e` doesn't exist yet** → add a minimal, idempotent seed script as a
  task (small fixture set sufficient for the assertions above).
