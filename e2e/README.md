# E2E tests (Playwright)

End-to-end layer that runs the **built application** (Bun standalone server,
`ASTRO_ADAPTER=bun`) against a **real Postgres + Dragonfly** stack and asserts
over real HTTP — the wiring that unit/integration tests skip (middleware, auth
cookies, the response wrapper, real DB effects).

## Layout

```
e2e/
├── api/        HTTP-level specs (no browser) — project "api"
├── ui/         browser specs — project "ui" (needs chromium)
└── fixtures/   auth (register+login → authed request) + deterministic seed
```

## Run locally

```bash
docker compose up -d          # Postgres :5432 + Dragonfly :6379
bun run db:migrate            # schema + pg_trgm indexes + search_history
bun run db:seed:e2e           # known rows the specs assert against
bun run test:integration      # repository specs vs real Postgres (RUN_DB_TESTS)
bun run test:e2e:install      # one-time: chromium for the ui project
bun run test:e2e              # builds the bun artifact, boots it, runs specs
```

`test:integration` runs the Vitest `*.integration.test.ts` files (repository
layer against the real Postgres) — the same seed data feeds them and the E2E
specs. In CI the `e2e` job runs both, back to back, against service containers.

Playwright's `webServer` builds + serves automatically on the dedicated port
`127.0.0.1:4331` (never Astro's `4321`, so it can't collide with — or reuse — a
dev/preview server). It waits on `GET /api/health/readiness` (DB + cache probe),
then `global-setup.ts` serially warms the routes before the parallel suite runs,
so cold-start lazy-init never flakes into a transient 500.

`REDIS_URL` is pinned to `redis://localhost:6379` (the ambient `.env` value
`redis://dragonfly:6379` is a Docker-network hostname that only resolves
container-to-container). Override host connections with `E2E_DATABASE_URL` /
`E2E_REDIS_URL`.

In CI, the `e2e` job (`.github/workflows/ci.yml`) runs this suite against Postgres
+ Dragonfly service containers and blocks merge.

Useful:

```bash
bun run test:e2e --project=api      # API specs only (no browser)
bun run test:e2e:ui                 # interactive UI mode
```

## Scope guard

E2E covers **critical paths and cross-layer wiring**, not exhaustive input
combinations — those belong in Vitest unit/integration. Prefer a unit test unless
the value is specifically in the _integration of running parts_ (HTTP, auth,
real DB/cache). Keep this layer lean.
