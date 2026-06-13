# AniDev v2 — Agent Guide

## Stack
- **Runtime**: Bun (primary), Node.js >=22.12.0
- **Framework**: Astro 6 SSR with `@astrojs/vercel` adapter (`output: 'server'`)
- **Database**: Turso (LibSQL) via `@libsql/client` + Drizzle ORM
- **Cache**: Upstash Redis (REST API)
- **Auth**: Better Auth 1.5.5 (email/password, Drizzle SQLite adapter)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- **Monitoring**: Sentry (server + Astro + React; no-ops when `SENTRY_DSN` unset)

## Commands
| Script | Purpose |
|--------|---------|
| `bun run dev` | Astro dev server |
| `bun run build` | Production build (Vercel output) |
| `bun run format` | Prettier (semi:false, singleQuote, trailingComma:es5) |
| `bun run auth:generate` | Generate Better Auth schema (config: `src/lib/auth/server.ts`) |
| `bun run auth:migrate` | Run Better Auth migrations |
| `bun run db:generate` | Drizzle migration generation |
| `bun run db:migrate` | Apply Drizzle migrations |
| `bun run astro sync` | Regenerate `.astro/types.d.ts` (gitignored, needed after schema changes) |
| `bun run release:*` | `standard-version` (patch/minor/major/prerelease) |

No test, lint, or typecheck scripts exist. No CI workflows found.

## Architecture (Domain-Driven + Presentational-Container)

### Layered structure
```
src/config/     → env validation (Zod, eager at import), site config, public routes
src/lib/        → infrastructure: auth, db, cache, monitoring
src/domains/    → business slices: anime/ auth/ media/ music/ user/
src/pages/      → Astro pages + API routes (file-based routing)
src/middleware/  → session middleware (auth-middleware.ts, registered in astro.config.mjs)
src/shared/     → cross-cutting: http/ errors/ schemas/ layouts/ components/ utils/
```

### Data flow
```
DB schema (lib/db/schemas/) → Repository → Mapper → Service → Page/API route
```

### Presentational-Container pattern
- **Containers** = Astro page routes (`src/pages/`): fetch data from services, handle errors/redirects, pass data down
- **Presentational** = Astro SFCs in `src/domains/*/components/`: receive props only, render markup, zero data-fetching
- **Rule**: *"Data is supplied by domain services in page routes, not fetched inside components"*
- Each component lives in its own directory: `Name/Name.astro` + `index.ts` barrel

### Domain vertical slice
Each domain has: `cache/ components/ errors/ mappers/ repositories/ schemas/ services/ types/` (optional: `middleware/`, `policies/`, `utils/`, `config.ts`)

Strict barrel exports at every level.

### Max file size
**≤150 lines per file.** 17 files currently exceed this (primarily `media/`, `shared/errors/`, and DB schemas) — refactor when touching.

## Path Aliases (tsconfig + Vite)
`@`, `@styles`, `@domains`, `@shared`, `@lib`, `@config`, `@middleware`, `@layouts`, `@http`, `@components`, `@hooks`, `@stores`, `@utils`, `@db` — all map to `src/` subdirectories. Use these instead of relative imports.

## API Route Patterns
Two composition styles:
1. `withZodValidation(schema)(handler)` — validates `{ params, query, body }` as single Zod object, returns 400 on failure
2. Error handling: `withErrorHandling(handler)` (try/catch wrapper) OR manual try/catch + `mapErrorToHttp(error)`

Response envelope: `{ data, status, error?, meta? }`. Error codes in `src/shared/errors/codes.ts`. HTTP mapping in `src/shared/errors/map-error-to-http.ts`.

## Auth & Middleware
- **Public routes** (prefix-matched): `/`, `/api/auth/login`, `/api/auth/register`, `/api/anime`, `/api/music`, `/media`
- Middleware populates `locals.user` / `locals.session` via `resolveAuthActor()` (swallows errors, returns null)
- For strict auth in API routes: `sessionService.getSession()` throws typed errors

## Environment
- Validated eagerly at import via Zod in `src/config/env.ts` — missing required vars = immediate crash
- **Required**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET` (≥32 chars), `BETTER_AUTH_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `APP_BASE_URL` optional, falls back to `BETTER_AUTH_URL`

## Skills & Key Guidelines

| Skill | Key rules for this repo |
|-------|------------------------|
| **Clean Code** | Small functions (≤1 screen), single responsibility, meaningful names, no side effects, no boolean params in signatures |
| **Composition Patterns** | Avoid boolean prop proliferation → compound components; prefer `children` over render props |
| **React Best Practices** | No barrel imports from large modules; `Promise.all()` for parallel fetches; Suspense boundaries; hoist static I/O; minimize serialization; `React.cache()` for data |
| **Zod** | `safeParse()` for user input; `z.infer` for type inference; `z.unknown()` not `z.any()`; validate at boundary; `strict()` for incoming data |
| **Drizzle ORM** | Schema-first with `$inferSelect`/`$inferInsert`; drizzle-kit for migrations; relations for joins |
| **Better Auth** | Config: `src/lib/auth/server.ts`; client: `authClient` from `src/lib/auth/client.ts`; email/password only |
| **Tailwind CSS** | Mobile-first; compose utilities over `@apply`; extract repeating patterns as components; CSS variables for themes |
| **TypeScript** | `z.infer` over manual types; branded types for IDs; discriminated unions for states; `unknown` over `any` |
| **JSDoc** | Follow existing style (`@module`, `@remarks`, `@see`, `@example`, `@throws`) — codebase is heavily documented |
| **Frontend Design** | Avoid generic AI aesthetics (no Inter/Roboto, no purple gradients); distinctive typography, asymmetric layouts, CSS variables |
| **Accessibility** | Semantic HTML, ARIA labels, focus management, skip links, color contrast ≥4.5:1, prefers-reduced-motion |
| **SEO** | Structured JSON-LD data, OG tags in `base-layout.astro`, canonical URLs, meta descriptions |
| **Core Web Vitals** | Preload LCP image; `aspect-ratio` for CLS; no tasks >50ms for INP; `font-display: optional` |
| **Astro** | `astro:middleware` for session; `src/pages/` file-based routing; adapter configures output target |

## Prettier Config
No semicolons, single quotes, trailing commas es5, 80 print width, arrow parens always. Plugins: `prettier-plugin-astro`, `prettier-plugin-tailwindcss`.

## Important Constraints
- Better Auth CLI commands are preconfigured with `--config src/lib/auth/server.ts` — do not change path
- Cache TTL values in **seconds** (`CacheTtl` enum in `src/lib/cache/config.ts`)
- No `.tsx` React components exist yet (React is configured but unused)
- No `drizzle.config` found — may need creation for migration generation
- Auth middleware uses cookie markers (`session_token=`, `session_data=`) — do not rename without updating middleware
- Sentry no-ops when `SENTRY_DSN` is absent — safe to call `init*` unconditionally

## Commit Convention
Conventional commits with scopes: `type(scope): summary` (e.g., `fix(auth): Handle expired token`). See `.cursor/commands/commit-all.md`.
