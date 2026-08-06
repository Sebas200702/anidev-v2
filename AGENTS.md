# AniDev v2 — Agent Guide

## Stack
- **Runtime**: Bun (primary), Node.js >=22.12.0
- **Framework**: Astro 6 SSR with `@astrojs/vercel` adapter (`output: 'server'`)
- **Database**: Supabase (PostgreSQL) via Drizzle ORM (`pg` dialect)
- **Cache**: Dragonfly (Redis-compatible)
- **Auth**: Better Auth 1.5.5 (email/password, Drizzle Postgres adapter)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- **Monitoring**: Rustrak (self-hosted, Sentry-SDK compatible; no-ops when DSN unset)
- **Validation/Logging**: Zod 4, Pino (`LOG_LEVEL`)

> **Provider swap pending**: the Stack above is the **self-hosted target**. The application code still runs on the legacy providers (Turso/LibSQL, Upstash REST, Sentry DSN — see `Environment`), and switching the code is a separate tracked change (`openspec/changes/`). Rustrak operations live in `.opencode/skills/rustrak/`.

## Setup

1. Copy `.env.example` → `.env` (Windows: `Copy-Item .env.example .env`) and fill every variable required by `src/config/env.ts`.
2. `bun install`
3. `bun run dev` — Astro dev server on `http://127.0.0.1:4321`

Env vars are validated eagerly at import (`src/config/env.ts`); a missing/invalid required var fails fast.

## Commands

| Script | Purpose |
|--------|---------|
| `bun install` | Install dependencies (Bun only — never npm/yarn/npx) |
| `bun run dev` | Astro dev server |
| `bun run build` | Production build (Vercel output) |
| `bun run preview` | Run the built output locally |
| `bun run format` | Biome formatter (`biome format --write .`; excludes `.astro`) |
| `bun run check` | Biome lint + format check (exit non-zero on errors) |
| `bun run check:write` | Biome lint, applying safe fixes |
| `bun run format:astro` | Prettier on `.astro` files (Biome doesn't support Astro) |
| `bun run test` | Vitest (`vitest run`; TDD — see Testing below) |
| `bun run test:watch` | Vitest watch mode |
| `bun run check:types` | Astro typecheck (`astro check`; requires `@astrojs/check`) |
| `bun run auth:generate` | Regenerate Better Auth schema (`--config src/lib/auth/server.ts`) |
| `bun run auth:migrate` | Run Better Auth migrations |
| `bun run db:generate` | Generate Drizzle migration (requirements) |
| `bun run db:migrate` | Apply Drizzle migrations |
| `bun run astro sync` | Regenerate `.astro/types.d.ts` (needed after schema changes) |
| `bun run release:*` | `standard-version` (patch/minor/major/prerelease) |

All verification scripts exist (`check`, `check:types`, `test`); code quality is `format` + `check` + `check:types` + `test` + `astro sync` + `build` (see Verification below).

## Development Methodology — OpenSpec (Spec-Driven Development)

This project follows **Spec-Driven Development**. Every feature passes through:

```
SPECIFY → PLAN → TASKS → IMPLEMENT
```

Managed with **OpenSpec** (`openspec/`). The flow is driven by skills in `.opencode/skills/`:
- `openspec-propose` — generate `proposal.md → design.md → specs/<delta> → tasks.md`
- `openspec-apply-change` — implement each task
- `openspec-update-change` — revise artifacts mid-change
- `openspec-archive-change` — sync deltas into `openspec/specs/` and close it

**Source of truth:**
- `openspec/specs/` — current committed behavior per capability (applies)
- `openspec/changes/<change>/` — active work (proposal, design, specs delta, tasks)
- `openspec/config.yaml` — schema + optional rules

**For every feature, agents must:**
1. Read the OpenSpec source of truth before writing code — the active change first (proposal/design/specs/tasks), then any committed `openspec/specs/`.
2. Follow the active change's `tasks.md` one at a time, in dependency order.
3. Do **not** invent work not in the tasks; if a task is ambiguous, ask the user.
4. Commit after each task with a Conventional Commit message.
5. Run the Verification gate (below) before opening a Pull Request.
6. Never skip phases — no coding before the spec is approved.

**The Lifecycle (all agents):** every task passes through `READ → SPECIFY → PLAN → IMPLEMENT → DOUBT → VERIFY → RELEASE`, codified in the `development-lifecycle` skill in `.opencode/skills/`. Key gates:
- **TDD**: logic changes are written test-first with **Vitest** (`bun run test`); a failing test precedes the fix (`test-driven-development` skill).
- **Doubt**: before marking a task done or opening a PR, re-review the change with fresh context against the spec and this file (`doubt-driven-development` skill).
- **Verify**: `format → astro sync → check → test → build` (below).

**Branching:**
- Default branch is `master`. Never commit directly to `master`.
- Create a focused branch per concern using `type/<slug>` (e.g. `docs/agent-tooling-migration`, `chore/add-ui-ux-skill`). Merge via Pull Request.
- Reference documents: this `AGENTS.md`, the OpenPackage change artifacts, and `.cursor/commands/commit-all.md`.

**`skip_specs: true`:** For a pure docs/refactor/tooling change with no runtime behavior delta, set `skip_specs: true` in the change's `.openspec.yaml` instead of inventing a requirement (OpenSpec rejects a zero-delta change without it).

## Verification & Code Quality

**Gate before opening a PR (run in order):**
```
bun run format → bun run astro sync → bun run check → bun run check:types → bun run test → bun run build
```

Rationale:
- `bun run format` — enforce Biome formatting (single quotes, no semicolons, 80 col; CRLF preserved).
- `bun run astro sync` — regenerate `.astro/types.d.ts` after schema/component changes.
- `bun run check` — Biome lint (recommended rules; import sorting disabled) + format verification.
- `bun run check:types` — Astro/TS typecheck (`astro check`); catches wrong barrel exports and `.astro` module resolution.
- `bun run test` — Vitest (TDD). Logical changes must carry tests.
- `bun run build` — catches type, config resolution, and prerender/SSR failures (env is validated at module import).

**Testing (Vitest + TDD):** logic is test-first. `vitest.config.ts` maps the `@`-aliases and includes `src/**/__tests__/**/*.test.{ts,tsx}` (`passWithNoTests` so the gate is green until tests exist). Put new tests under `__tests__/` mirroring the layer under test (e.g. `src/domains/<domain>/__tests__/services/`, `src/shared/__tests__/http/`). Follow the `test-driven-development` skill; a failing test precedes the fix. Modules that import `src/config/env.ts` (eager Zod validation) must mock it in tests with `vi.mock('@config/env')` — the runner does not load `.env`.

**CI/CD:** `.github/workflows/deploy.yml` builds a Docker image and pushes it to Docker Hub on pushes to `master` (CD only — no lint/test gate in CI today). Secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`. Vercel adapter handles the serverless build.

**Skills:** Prefer the installed skills for domain tasks — `development-lifecycle` (the universal workflow), `better-auth-best-practices` (auth), `context7`/`find-docs` (library docs), `code-review` (two-axis diff review), `impeccable` (UI), `jsdoc-typescript-docs` (code documentation), `test-driven-development`, `doubt-driven-development`. Load them via the `skill` tool.

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

### Domain vertical slice
Each domain has: `cache/ components/ errors/ mappers/ repositories/ schemas/ services/ types/` (optional: `middleware/`, `policies/`, `utils/`, `config.ts`). Goals:
- `anime` — anime data APIs, mapping from MAL
- `music` — music data APIs
- `media` — image proxy/optimization (`sharp`) + Redis cache
- `auth` — Better Auth plumbing, login/register/session
- `user` — user resources, policies

Strict barrel exports at every level.

### Data flow
```
DB schema (lib/db/schemas/) → Repository → Mapper → Service → Page/API route
```

### Presentational-Container pattern
- **Containers** = Astro page routes (`src/pages/`): fetch data from services, handle errors/redirects, pass data down
- **Presentational** = Astro SFCs in `src/domains/*/components/`: receive props only, render markup, zero data-fetching
- **Rule**: *"Data is supplied by domain services in page routes, not fetched inside components"*
- Each component lives in its own directory: `Name/Name.astro` + `index.ts` barrel

### Max file size
**≤150 lines per file.** When touching a file near/over that limit, refactor by responsibility. Do not rely on an exact count of offenders — it changes.

## Path Aliases (tsconfig + Vite)
`@`, `@styles`, `@domains`, `@shared`, `@lib`, `@config`, `@middleware`, `@layouts`, `@http`, `@components`, `@hooks`, `@stores`, `@utils`, `@db` — all map to `src/` subdirectories (confirmed in `tsconfig.json` and `astro.config.mjs`). Use these instead of relative imports.

## API Route Patterns
Two composition styles:
1. `withZodValidation(schema)(handler)` — validates `{ params, query, body }` as single Zod object, returns 400 on failure
2. Error handling: `withErrorHandling(handler)` (try/catch wrapper) OR manual try/catch + `mapErrorToHttp(error)`

Response envelope: `{ data, status, error?, meta? }`. Error codes in `src/shared/errors/codes.ts`. HTTP mapping in `src/shared/errors/map-error-to-http.ts`.

## Auth & Middleware
- **Public routes** (prefix-matched): `/`, `/api/auth/login`, `/api/auth/register`, `/api/anime`, `/api/music`, `/media`
- Middleware populates `locals.user` / `locals.session` via `resolveAuthActor()` (swallows errors, returns null)
- For strict auth in API routes: `sessionService.getSession()` throws typed errors

## Environment (matches `src/config/env.ts`)
Validated eagerly at import via Zod in `src/config/env.ts` — missing required vars = immediate crash.
- **Required**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `APP_BASE_URL`, `BETTER_AUTH_SECRET` (≥32 chars), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Optional**: `SENTRY_DSN` (monitoring no-ops when absent), `LOG_LEVEL` (trace|debug|info|warn|error|fatal), `NODE_ENV` (defaults to `development`)
- **Note**: `BETTER_AUTH_URL` is NOT a separate variable — the base URL is `APP_BASE_URL`.

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
| **JSDoc** | Follow the installed `jsdoc-typescript-docs` skill and the existing style (`@module`, `@remarks`, `@see`, `@example`, `@throws`) — codebase is heavily documented; keep it single-quote/no-semicolon |
| **Frontend Design** | Avoid generic AI aesthetics (no Inter/Roboto, no purple gradients); distinctive typography, asymmetric layouts, CSS variables |
| **Accessibility** | Semantic HTML, ARIA labels, focus management, skip links, color contrast ≥4.5:1, prefers-reduced-motion |
| **SEO** | Structured JSON-LD, OG tags in `base-layout.astro`, canonical URLs, meta descriptions |
| **Core Web Vitals** | Preload LCP image; `aspect-ratio` for CLS; no tasks >50ms for INP; `font-display: optional` |
| **Astro** | `astro:middleware` for session; `src/pages/` file-based routing; adapter configures output target |

When a task references a library/framework, fetch its current docs first via `context7` or `find-docs` — do not rely on memory for API details.

## Code Style & Naming

Formatting is enforced by **Biome** (`bun run format`) and lint by **Biome** (`bun run check`). Prettier is kept only for `.astro` files (`bun run format:astro`). Ink any new code to match the existing style below — do not reformat files that already comply.

### Variables
- Full names, no abbreviations except where context makes the trick obvious:
  ```ts
  const selectedAnime
  const workspacePermissions
  for (const user of users)
  ```
- Booleans use a prefix: `isLoading`, `isAuthenticated`, `hasPermission`, `canEdit`, `shouldRedirect`

### Functions
- Verb first: `getWorkspace()`, `createSubmission()`, `updateParticipant()`, `validatePermissions()`

### Constants
- Real global constants → `UPPER_SNAKE_CASE`: `DEFAULT_PAGE_SIZE`, `MAX_RETRIES`
- Everything else → `camelCase`

### Naming by element
| Element | Style |
|---|---|
| Variables / functions | `camelCase` |
| Components / types / interfaces | `PascalCase` (no `I` prefix) |
| Global constants | `UPPER_SNAKE_CASE` |
| Files / folders | `kebab-case` |
| React hooks | `use` + `PascalCase` (`useAuth`) |
| Zustand stores | `use[Nombre]Store` |

### Nullability
Explicit, never assumed: `if (!workspace)`, `if (participant == null)`. In repositories the pattern is to return `undefined`, never `null`.

### Conditionals — early return
```ts
if (!user) return
if (!workspace) throw errorFactory.notFound()
```
Over nesting ifs.

### Destructuring & strings
- Prefer destructuring over repeated access: `const { id, email, role } = user`
- Use template strings, not concatenation: `` `${workspaceId}/${participantId}` ``

### Comments
Few. When present they explain the **why**, not the **what**. Follow the JSDoc conventions in the skills table.

### Error handling
Never `throw new Error(...)` generic, never `console.log(error)` as handling. Use `AppError` subclasses / the domain error factories and `mapErrorToHttp` (see API Route Patterns); repositories use `try/catch` + the error factory obligatorily. See `src/shared/errors/`.

## Formatting/Lint Config
- **Biome** (`biome.json`): semi:false, **single quotes**, trailing commas `es5`, 80 col, 2-space indent, CRLF preserved. Lint = recommended preset (import sorting disabled; `noSvgWithoutTitle`, `noImplicitAnyLet` relaxed). Config is authoritative — edit `biome.json`, do not reformat to tabs/double quotes.
- **Prettier** (`.prettierignore` + `prettier.config.cjs`): only for `.astro` files; keep `prettier-plugin-astro`, `prettier-plugin-tailwindcss`.

## Important Constraints
- Better Auth CLI commands are preconfigured with correct path: `--config src/lib/auth/server.ts` — do not change it
- Cache TTL values in **seconds** (`CacheTtl` enum in `src/lib/cache/config.ts`)
- No `.tsx` React components exist yet (React is configured but unused) — keep it that way unless a change requires it
- **No `drizzle.config` exists yet** — `db:generate`/`db:migrate` will need one; creating it is part of the migration change, not an ad-hoc fix
- Auth middleware uses cookie markers (`session_token=`, `session_data=`) — do not rename without updating middleware
- Sentry no-ops when `SENTRY_DSN` is absent — safe to call `init*` unconditionally
- Don't add scripts to `package.json` that don't exist

## Releases & Versioning

**Scheme:** SemVer driven by Conventional Commits via `standard-version` (`bun run release:*`).

- `fix(scope):` → **patch** (`X.Y.Z` → `X.Y.(Z+1)`)
- `feat(scope):` → **minor** (`X.Y.Z` → `X.(Y+1).0`)
- `BREAKING CHANGE:` footer / `!` on the type → **major**
- Pre-release: `bun run release:prerelease` → `X.Y.Z-<tag>`

**Release flow (the RELEASE phase of the lifecycle):**
1. The feature/change must land on `master` via PR first.
2. On `master` (pulled current), pick the release: `bun run release` (auto bumps from commits) or force `release:patch`/`release:minor`/`release:major`/`release:prerelease`. Preview first: `bun run release:dry`.
3. `standard-version` bumps `package.json`, regenerates `CHANGELOG.md`, commits, and creates the git tag `vX.Y.Z`.
4. Push branch and tag: `git push origin master && git push origin vX.Y.Z`.
5. CI `release.yml` (triggered on tag `v*`) builds the Docker image tagged `:<version>`, `:latest`, and `:<sha>` and deploys — so any published release is reproducible exactly.

## Commit Convention
Conventional Commits with scopes: `type(scope): summary` (e.g., `fix(auth): Handle expired token`). See `.changeset/commit-all.md`.