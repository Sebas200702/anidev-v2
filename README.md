# 🌸 AniDev

AniDev is a modern **anime streaming and exploration platform** rebuilt from
scratch as **AniDev-v2**. It is not just an API — it's the product: a full
anime-discovery experience (search, collections, watch progress, schedules,
profiles, optimized streaming) served by a fast edge backend.

```text
Astro 6 (SSR) · Drizzle ORM · Better Auth · Tailwind v4 · Zod 4 · Biome · Vitest
```

> **Intro**: AniDev v2 re-does the original AniDev from zero on a new stack
> (Astro SSR + Postgres + Dragonfly + Rustrak). The feature set below is the
> **target** — v2 ships it incrementally through OpenSpec-driven changes. See
> [Current Status](#current-status) for what exists today.

## Product vision

- 🎨 **Modern design** — responsive, smooth `astro:transitions`.
- 🔍 **Dynamic search** — debounced queries, advanced filters (genre, studio,
  rating, year, season, status).
- 📺 **Video playback** — high-quality anime streaming.
- 📚 **Collections & multiple lists** — Collection, Completed, To-Watch, Watching.
- 🔄 **Progress tracking** — watch history + progress indicators.
- 📅 **Schedule system** — calendar view of upcoming releases.
- 👤 **User profiles & preferences** — avatar, accent color, parental control.
- 🖼️ **Image optimization** — resize / WebP · AVIF / quality via Sharp.
- ⚡ **Redis caching** — fast API responses with configurable TTL.
- 🛡️ **Robust error handling** — AppError, HTTP mapping, security headers.
- 🎯 **Code quality** — Biome + Prettier + Vitest (TDD).

## Current status (v2, rebuilding from scratch)

Today v2 ships the **backend foundation + API + minimal shell**; product features
arrive incrementally, each tracked as an OpenSpec change (`openspec/changes/`):

- ✅ API routes — `auth`, `anime`, `music`, `user`, `search-history` (Zod-validated, enveloped responses, response-schema validation in the wrapper)
- ✅ Auth (session middleware) — Better Auth email/password
- ✅ Cache layer (Dragonfly/Redis-compatible), image proxy (`media` domain)
- ✅ Advanced catalog search — `season`/score filters, whitelist sort, indexed free-text (`pg_trgm`), fail-closed parental floor, per-user search history
- ✅ Self-hosted infra — PostgreSQL, Dragonfly, Rustrak (docker compose local stack)
- ✅ Testing — Vitest unit + real-Postgres integration + Playwright E2E, CI gate, SemVer releases
- ✅ Pages: `/` (home), `/anime/[id]`, `/anime/[id]/[slug]`
- 🚧 Streaming, homepage/hero + carousels, taxonomies, collections, progress, schedule, profile UI — **to build** (OpenSpec changes drive them)

## Stack

- **Runtime**: Bun (primary), Node.js ≥ 22.12.0
- **Framework**: Astro 6 SSR with the `@astrojs/vercel` adapter (`output: 'server'`)
- **Database**: PostgreSQL via Drizzle ORM (`pg` dialect)
- **Cache**: Dragonfly (Redis-compatible)
- **Auth**: Better Auth 1.5.5 (email/password, Drizzle Postgres adapter)
- **Monitoring**: Rustrak (self-hosted, Sentry-SDK compatible; no-ops when DSN unset)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- **Validation / Logging**: Zod 4, Pino (`LOG_LEVEL`)
- **Quality**: Biome format+lint, Prettier (`*.astro`), Vitest (`@vitest/coverage-v8`)

## Quick start

```bash
git clone https://github.com/Sebas200702/anidev-v2.git
bun install
cp .env.example .env   # Windows: Copy-Item .env.example .env
bun run dev              # http://127.0.0.1:4321
```

Env vars are validated eagerly at import (`src/config/env.ts`); a missing/invalid
required value fails fast.

## Environment

| Variable | Req | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection URL (`postgres://` / `postgresql://`) |
| `REDIS_URL` | yes | Dragonfly/Redis connection URL (`redis://` / `rediss://`) |
| `APP_BASE_URL` | yes | Base URL (also Better Auth API_BASE) |
| `BETTER_AUTH_SECRET` | yes | ≥ 32 chars |
| `SENTRY_DSN` | no | Monitoring no-ops when absent |
| `PUBLIC_SENTRY_DSN` | no | Client-exposed mirror of `SENTRY_DSN` for browser capture |
| `LOG_LEVEL` | no | `trace`\|`debug`\|`info`\|`warn`\|`error`\|`fatal` |
| `NODE_ENV` | no | Defaults to `development` |

There is **no** `BETTER_AUTH_URL` — the base URL is `APP_BASE_URL`.

For local development against the full self-hosted stack (PostgreSQL +
Dragonfly + Rustrak) run `docker compose up -d` and copy `.env.local.example`
→ `.env.local` (local credentials, separate from production).

## Commands

| Script | Purpose |
| --- | --- |
| `bun run dev` | Astro dev server |
| `bun run build` | Production build (Vercel output) |
| `bun run preview` | Run the built output locally |
| `bun run format` | Biome format (excludes `.astro`) |
| `bun run format:astro` | Prettier on `.astro` |
| `bun run check` | Biome lint + format check |
| `bun run check:write` | Biome lint + safe fixes |
| `bun run check:types` | Astro/TS typecheck (`astro check`) |
| `bun run astro sync` | Regenerate `.astro/types.d.ts` |
| `bun run test` / `test:watch` / `test:coverage` | Vitest |
| `bun run test:integration` | Integration specs against a real Postgres (`RUN_DB_TESTS=1`; needs the docker stack + migrate + seed) |
| `bun run test:e2e` / `test:e2e:ui` / `test:e2e:install` | Playwright E2E (API + browser) |
| `bun run db:seed:e2e` | Seed the deterministic rows E2E asserts against |
| `bun run auth:generate` / `auth:migrate` | Better Auth schema/migrations |
| `bun run db:generate` / `db:migrate` | Drizzle migrations (PostgreSQL) |
| `bun run release:*` | `standard-version` release — see Versioning |

## Development methodology — OpenSpec (SDD)

Spec-Driven Development. Every feature passes `SPECIFY → PLAN → TASKS →
IMPLEMENT`, managed via OpenSpec (`openspec/`); the source of truth is
`openspec/specs/` and active work lives in `openspec/changes/<change>/`
(`proposal.md`, `design.md`, `specs/delta`, `tasks.md`). Completed changes are
archived to `openspec/changes/archive/` with their deltas synced into
`openspec/specs/`.

A universal lifecycle (`.opencode/skills/development-lifecycle`) applies to **all
agents**: `READ → SPECIFY → PLAN → IMPLEMENT → DOUBT → VERIFY → RELEASE`, with
TDD (tests first) and a mandatory doubt review. See `AGENTS.md` for the full
contract — including the branching rule (never commit directly to `master`).

## Verification gate

Run these in order before a PR:

```plain
bun run format → bun run check → bun run check:types → bun run test → bun run test:coverage → bun run build
```

- **format**: Biome auto-formats on commit; the gate verifies consistency. `ci.yml` does not run `format` itself, so run `bun run format` locally before pushing to keep CI green.
- **Testing**: TDD-first with Vitest. Tests live under `src/**/__tests__/`,
  mirroring the layer under test. Modules importing `src/config/env.ts` must mock
  it via `vi.mock('@config/env')` (the runner doesn't load `.env`).
- Coverage runs through Vitest (`@vitest/coverage-v8`, scoped via `include`).

## Architecture

```
src/
├── config/       env validation (Zod, eager), site config, public routes
├── lib/          auth (Better Auth), db (Drizzle), cache, monitoring
├── domains/      business slices: anime/ auth/ media/ music/ user/
├── pages/        Astro pages + API routes (file-based routing)
│   ├── anime/[malId]/           anime detail pages
│   └── api/                     auth, anime, music, user endpoints
├── middleware/   session middleware (auth-middleware.ts)
└── shared/       http/, errors/, schemas/, layouts/, components/, utils/
```

Domain vertical slice: `cache/ components/ errors/ mappers/ repositories/
schemas/ services/ types/`. Data flows
`DB schema → Repository → Service → Page/API route`. Strict barrel exports; max
file size ≤ 150 lines. Path aliases (`@`, `@shared`, `@config`, …) map to `src/`
in `tsconfig.json`.

## API routes

| Route | Description |
| --- | --- |
| `POST /api/auth/login` | Login (public) |
| `POST /api/auth/register` | Register (public) |
| `POST /api/auth/logout` | Logout (session) |
| `GET /api/auth/session` | Current session |
| `GET /api/anime` | Anime search/list (public; filters, sort, parental-safe floor) |
| `GET /api/anime/:malId` | Anime detail |
| `GET /api/anime/:malId/full` · `characters` · `staff` | Extra detail |
| `GET /api/music` / `GET /api/music/:id` | Music (public) |
| `GET /api/user/:userId` | User profile read (session) |
| `POST /api/user` | Create own profile (session) |
| `PATCH /api/user/:userId` | Update own profile identity fields (session) |
| `GET /api/search-history` / `DELETE /api/search-history` | Read / clear own search history (session) |
| `GET /api/health/readiness` | Dependency probes (db/cache) (public) |
| `GET /api/health` | Liveness (public, no dependencies) |

Routes validate via `withZodValidation(schema)(withErrorHandling(handler, { responseSchema }))`
and respond enveloped as `{ data, status, error?, code?, meta? }`; the wrapper
optionally validates successful response data against a domain Zod schema
(`RESPONSE_VALIDATION_ERROR` → 500). `InfraError` responses map to `503`
with a `Retry-After` header and the error's `code` preserved; stale-serve
responses carry `meta.stale` surfaced as an `x-stale: true` header. Public
routes: `/`, `/api/auth/login`, `/api/auth/register`, `/api/anime`,
`/api/health`, `/api/music`, `/media`.

## Error monitoring

All handled errors are reported to a self-hosted Sentry-compatible backend
(Rustrak): server routes capture every error class — 4xx (`ValidationError`,
`AuthError`, `DomainError`) at `warning` level, 5xx (`InfraError`, unknown) at
`error` level — via `mapErrorToHttp`, and the browser SDK reports global errors
and unhandled rejections when `PUBLIC_SENTRY_DSN` is set (no-op otherwise).
Malformed media paths return `400 INVALID_IMAGE_PATH` rather than a 503.
Both DSNs are optional; monitoring is a no-op without them.

## Versioning

**SemVer** by Conventional Commits via `standard-version`.

- `fix(scope):` → **patch** · `feat(scope):` → **minor** ·
  `BREAKING CHANGE:`/`!` → **major** · pre-release → `X.Y.Z-<tag>`.

**Release flow (RELEASE phase):**
1. On the **feature branch** (base `master`), after the Verification gate passes, pick the release: `bun run release` (auto bumps from commits) or force `release:patch|minor|major|prerelease`. Preview first with `release:dry`.
2. It bumps `package.json`, rewrites `CHANGELOG.md`, commits `chore(release): X.Y.Z`, tags `vX.Y.Z` — riding in the same feature PR (master is protected).
3. Merge the PR, then `git push origin vX.Y.Z`.
4. CI `release.yml` (tag `v*`) builds and pushes the Docker image `:<version>` + `:latest` + `:<sha>`.

## Branching & commits

- Default branch `master`; never commit directly — branch `type/<slug>` and PR.
- Conventional Commits with scopes: `fix(auth): Handle expired token`.

---

## Roadmap

The product roadmap lives in [`ROADMAP.md`](./ROADMAP.md) — phases 0–7 plus the
data-platform track (Track D). Each item is delivered as an OpenSpec change:
write the proposal/design/spec/tasks first, then implement, verify, and release
per the gate above.

Each item is an OpenSpec change: write the proposal/design/spec/tasks first, then
implement, verify, and release per the gate above.