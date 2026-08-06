# 🌸 AniDev

AniDev is a modern **anime streaming and exploration platform** rebuilt from
scratch as **AniDev-v2**. It is not just an API — it's the product: a full
anime-discovery experience (search, collections, watch progress, schedules,
profiles, optimized streaming) served by a fast edge backend.

```text
Astro 6 (SSR) · Drizzle ORM · Better Auth · Tailwind v4 · Zod 4 · Biome · Vitest
```

> **Intro**: AniDev v2 re-does the original AniDev from zero on a new stack
> (Astro SSZ + Supabase + Redis). The feature set below is the **target** —
> v2 ships it incrementally through OpenSpec-driven changes. See
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

- ✅ API routes — `auth`, `anime`, `music`, `user` (Zod-validated, enveloped responses)
- ✅ Auth (session middleware) — Better Auth email/password
- ✅ Cache layer (Redis-compatible), image proxy foundation (`media` domain)
- ✅ Tests (Vitest/TDD), quality gate, CI, SemVer releases
- ✅ Pages: `/` (home), `/anime/[id]`, `/anime/[id]/[slug]`
- 🚧 Streaming, search/filtering, collections, progress, schedule, profile UI — **to build** (OpenSpec changes drive them)

## Stack

- **Runtime**: Bun (primary), Node.js ≥ 22.12.0
- **Framework**: Astro 6 SSR with the `@astrojs/vercel` adapter (`output: 'server'`)
- **Database**: Supabase (PostgreSQL) via Drizzle ORM (`pg` dialect)
- **Cache**: Dragonfly (Redis-compatible)
- **Auth**: Better Auth 1.5.5 (email/password, Drizzle Postgres adapter)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- **Validation / Logging**: Zod 4, Pino (`LOG_LEVEL`)
- **Quality**: Biome format+lint, Prettier (`*.astro`), Vitest (`@vitest/coverage-v8`)

> **Provider swap pending**: the target is the self-hosted stack above. The
> running code still talks to the legacy providers (Turso/LibSQL, Upstash REST,
> Sentry DSN — see Environment); switching is a tracked OpenSpec change.

## Quick start

```bash
git clone https://github.com/Sebas200702/anidev-v2.git
bun install
Copy .env.example .env   # Windows: Copy-Item .env.example .env
bun run dev              # http://127.0.0.1:4321
```

Env vars are validated eagerly at import (`src/config/env.ts`); a missing/invalid
required value fails fast.

## Environment

| Variable | Req | Notes |
| --- | --- | --- |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | yes | DB (legacy provider) |
| `APP_BASE_URL` | yes | Base URL (also Better Auth API_BASE) |
| `BETTER_AUTH_SECRET` | yes | ≥ 32 chars |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | yes | Cache (legacy provider) |
| `SENTRY_DSN` | no | Monitoring no-ops when absent |
| `LOG_LEVEL` | no | `trace`\|`debug`\|`info`\|`warn`\|`error`\|`fatal` |
| `NODE_ENV` | no | Defaults to `development` |

There is **no** `BETTER_AUTH_URL` — the base URL is `APP_BASE_URL`.

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
| `bun run auth:generate` / `auth:migrate` | Better Auth schema/migrations |
| `bun run db:generate` / `db:migrate` | Drizzle migrations (needs `drizzle.config.ts` — pending) |
| `bun run release:*` | `standard-version` release — see Versioning |

## Development methodology — OpenSpec (SDD)

Spec-Driven Development. Every feature passes `SPECIFY → PLAN → TASKS →
IMPLEMENT`, managed via OpenSpec (`openspec/`); the source of truth is
`openspec/specs/` and active work lives in `openspec/changes/<change>/`
(`proposal.md`, `design.md`, `specs/delta`, `.tasks.md`).

A universal lifecycle (`.opencode/skills/development-lifecycle`) applies to **all
agents**: `READ → SPECIFY → PLAN → IMPLEMENT → DOUBT → VERIFY → RELEASE`, with
TDD (tests first) and a mandatory doubt review. See `AGENTS.md` for the full
contract — including the branching rule (never commit directly to `master`).

## Verification gate

Run these in order before a PR (also enforced by CI on PR/push):

```plain
bun run format → bun run astro sync → bun run check → bun run check:types → bun run test → bun run test:coverage → bun run build
```

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
| `GET /api/anime` | Anime search/list (public) |
| `GET /api/anime/:malId` | Anime detail |
| `GET /api/anime/:malId/full` · `characters` · `staff` | Extra detail |
| `GET /api/music` / `GET /api/music/:id` | Music (public) |
| `GET /api/user/:userId` | User (session) |

Routes validate via `withZodValidation(schema)(handler)` and respond enveloped as
`{ data, status, error?, meta? }`. Public routes: `/`, `/api/auth/login`,
`/api/auth/register`, `/api/anime`, `/api/music`, `/media`.

## Versioning

**SemVer** by Conventional Commits via `standard-version`.

- `fix(scope):` → **patch** · `feat(scope):` → **minor** ·
  `BREAKING CHANGE:`/`!` → **major** · pre-release → `X.Y.Z-<tag>`.

**Release flow (RELEASE phase):**
1. Land the change on `master` via PR.
2. `bun run release` (preview with `release:dry`), or force
   `release:patch|minor|major|prerelease`.
3. It bumps `package.json`, rewrites `CHANGELOG.md`, commits, tags `vX.Y.Z`.
4. `git push origin master && git push origin vX.Y.Z`.
5. CI `release.yml` (tag `v*`) builds and pushes the Docker image `:<version>` +
   `:latest` + `:<sha>`.

## Branching & commits

- Default branch `master`; never commit directly — branch `type/<slug>` and PR.
- Conventional Commits with scopes: `fix(auth): Handle expired token`.

---

## Roadmap (v2 rebuild)

1. API + shell ✅ — auth, anime, user, music, cache, image foundation
2. Streaming & watch player
3. Search & advanced filtering
4. Collections, progress & schedule
5. Profiles & preferences UI
6. Studio/trailer/episode surfaces & SEO

Each item is an OpenSpec change: write the proposal/design/spec/tasks first, then
implement, verify, and release per the gate above.