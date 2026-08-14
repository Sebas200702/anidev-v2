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

### Local stack (PostgreSQL + Dragonfly + Rustrak)

For development you can stand up the self-hosted target stack entirely on your
machine (no external Turso/Upstash/Sentry accounts needed):

```bash
docker compose up -d            # PostgreSQL :5432, Dragonfly :6379, Rustrak :8080
```

- Local credentials live in `.env.local.example` (copy to `.env.local`) and
  point at those local ports; they are separate from production (`.env.example`).
- Compose reads its required variables (POSTGRES_USER/PASSWORD/DB,
  RUSTRAK_SESSION_SECRET_KEY, RUSTRAK_SUPERUSER, …) from the project `.env`;
  copy `.env.local.example` → `.env` (or export the vars) before
  `docker compose up -d`.
- Apply migrations against the local DB with `bun run db:migrate`.
- Dashboard UIs: Rustrak UI is on `http://localhost:3000` (create a project there
  to get a full `SENTRY_DSN`, swap the `1` project id / key in `.env.local`);
  the Rustrak server API itself listens on `http://localhost:8080`.
- Named `postgres_data` / `dragonfly_data` / `rustrak_data` volumes persist across
  `docker compose down`; add `-v` to wipe them too.

## Commands

| Script | Purpose |
|--------|---------|
| `bun install` | Install dependencies (Bun only — never npm/yarn/npx) |
| `bun run dev` | Astro dev server |
| `bun run build` | Production build (Vercel output) |
| `bun run preview` | Run the built output locally |
| `bun run format` | Biome formatter (`biome format --write .`; excludes `.astro`; LF line endings) |
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

All verification scripts exist (`check`, `check:types`, `test`); code quality is `format` + `check` + `check:types` + `test` + `build` (see Verification below). `astro sync` is only needed after schema changes and is not part of the standard gate.

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
bun run format → bun run check → bun run check:types → bun run test → bun run build
```

Rationale:
- `bun run format` — enforce Biome formatting (single quotes, no semicolons, 80 col; LF enforced via `.gitattributes`).
- `bun run check` — Biome lint (recommended rules; import sorting disabled) + format verification.
- `bun run check:types` — Astro/TS typecheck (`astro check`); catches wrong barrel exports and `.astro` module resolution.
- `bun run test` — Vitest (TDD). Logical changes must carry tests.
- `bun run build` — catches type, config resolution, and prerender/SSR failures (env is validated at module import).

**Testing (Vitest + TDD):** logic is test-first. `vitest.config.ts` maps the `@`-aliases and includes `src/**/__tests__/**/*.test.{ts,tsx}` (no `passWithNoTests`, so Vitest fails when no tests are discovered). Put new tests under `__tests__/` mirroring the layer under test (e.g. `src/domains/<domain>/__tests__/services/`, `src/shared/__tests__/http/`). Follow the `test-driven-development` skill; a failing test precedes the fix. Modules that import `src/config/env.ts` (eager Zod validation) must mock it in tests with `vi.mock('@config/env')` — the runner does not load `.env`.

**CI/CD:** Two workflows. `.github/workflows/ci.yml` runs the quality gate on PRs and pushes to `master` — `check`, `check:types`, `test`, `test:coverage`, `build` (see AGENTS.md Verification gate for the local sequence). It does not run `format` or `astro sync` directly, so `bun run format` must be run locally before pushing to keep CI green. `.github/workflows/deploy.yml` is CD-only — builds the Docker image and pushes it to Docker Hub on pushes to `master`. Secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`. Vercel adapter handles the serverless build.

**Skills:** Prefer the installed skills for domain tasks — `development-lifecycle` (the universal workflow), `better-auth-best-practices` (auth), `context7`/`find-docs` (library docs), `code-review` (two-axis diff review), `astro` (Astro framework), `impeccable` (UI craft), `frontend` / `presentational-container` (UI architecture), `tailwind-css-patterns` (Tailwind styling), `web-quality-audit` / `webapp-testing` (UI verification), `jsdoc-typescript-docs` (code documentation), `test-driven-development`, `doubt-driven-development`. Load them via the `skill` tool.

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

### Module unit folders (co-location)
Inside each **logic** layer (`cache/ mappers/ repositories/ services/ policies/ middleware/`)
every element lives in its **own folder** with its logic + type/helper companions
co-located behind a barrel — never as loose `*-types.ts` siblings next to the logic:

```
mappers/anime-card/
├── index.ts     → unit barrel (export * from leaves)
├── mapper.ts    → logic, kind-named (mapper|repository|service|cache|policy|middleware|util)
├── types.ts     → element-specific types (was anime-card-mapper-types.ts)
└── helpers.ts   → optional
```

- Folder name = the element (`anime-card`, `anime-list`); the file inside is the
  generic kind (`mapper.ts`, `repository.ts`, …). A cohesive multi-file subsystem is
  **one** unit folder (e.g. `cache/media-cache/` = `cache.ts` + `keys.ts` +
  `serialization.ts` + `store.ts` + their `*.types.ts`).
- Layer barrels (`@anime/mappers`) re-export from the unit folders, so deep import
  paths are `@anime/mappers/<unit>` (the unit barrel), not `@anime/mappers/<unit>-mapper`.
- Create a folder / `types.ts` / `helpers.ts` only when the element actually needs it —
  no artificial scaffolding, no empty barrels-for-symmetry.
- Pure-type layers (`types/`), single-file `schemas/`, and `errors/` stay flat; the
  cross-cutting `*DB` row types remain shared in the domain `types/` barrel.
- A type file exists because *these types belong to this module*, not because *it is a type*.

**UI layers (`components/ hooks/ stores/`)** follow the same rule, with two nuances:
- A component is **already** a unit folder — `Name/Name.astro` + `index.ts` barrel.
  UI keeps the **named** file (`AnimeDetails.astro`), not a generic `component.astro`.
  Its `Props`/`interface`, subcomponents, local fixture, and any component-only
  hook/store live **inside that folder**.
- A hook / store / type used by **one** component belongs **inside that component's
  folder** (maximum co-location) — not in a shared `hooks/`/`stores/`. Only
  cross-component state goes in `domains/<d>/hooks|stores/` (or `@hooks`/`@stores`
  app-wide), and there it is a unit folder when it has companions. Hooks are
  `use`+PascalCase, stores `use[Name]Store`.
- `hooks/`/`stores/` do not exist yet: create them (as unit folders) with the first
  real hook/store — never pre-create empty directories.

### Data flow
```
DB schema (lib/db/schemas/) → Repository → Mapper → Service → Page/API route
```

### Presentational-Container pattern
- **Containers** = Astro page routes (`src/pages/`): fetch data from services, handle errors/redirects, pass data down
- **Presentational** = Astro SFCs in `src/domains/*/components/`: receive props only, render markup, zero data-fetching
- **Rule**: *"Data is supplied by domain services in page routes, not fetched inside components"*
- Each component lives in its own directory: `Name/Name.astro` + `index.ts` barrel

### Frontend & UI — estilos, render, composición

Reglas que gobiernan todo trabajo en el frontend, además de las anteriores. El
flujo completo está en la skill `frontend`; aquí están las reglas vinculantes:

- **Renderizado — "zero-JS + Islands on demand".** Todo componente es un SFC
  `.astro` renderizado en SSR. Zero JS de cliente por defecto; React
  islands (`@astrojs/react` + React 19, `client:load`/`client:visible`) solo
  cuando la interacción lo exige (un player, un toggle, una votación). Si un
  formulario puede resolverlo, usa `<form>` + API route antes que una island.
- **View Transitions** ya está habilitado en `base-layout.astro`
  (`<ClientRouter />`) — úsalo para transiciones de página, no reescribas el
  swap a mano.
- **Hooks**: los hooks React solo existen dentro de islands (client). Ruta
  reservada: `src/shared/hooks/` (alias `@hooks`) y por dominio bajo
  `src/domains/*/hooks/`. Nombre `use`+PascalCase (`useAuth`). Estado global
  vía Zustand con `use[Nombre]Store` (alias `@stores` → `src/shared/stores/`;
  directorios de reserva aún, crearlos con la primera feature que los use).
- **Estilos**: Tailwind v4, sin `<style>` inline en componentes; `@apply` solo
  está permitido para utility classes globales compartidas en
  `src/styles/global.css`, mientras que los estilos de componentes componen
  utilities directamente y evitan `@apply`. Color solo desde tokens `@theme`
  (`brand`/`neutral`), nunca hex en crudo. La propuesta es diseño solo-dark
  (`color-scheme: dark`).
- **Imágenes**: componente compartido `Picture` (LQIP blur-up) con
  `aspect-*` y tamaños explícitos en banners. Preload del LCP.
- **Accesibilidad**: HTML semántico, ARIA cuando el elemento no es semántico,
  focus-visible, contraste ≥ 4.5:1, `prefers-reduced-motion`.
- **UI/UX craft**: carga la skill `frontend` y `impeccable` para decisiones de
  diseño, layout, tipografía y motion. Design tokens en `global.css` son la
  única fuente de color/tipografía.

### Living documentation — componente showcase

Cuando `src/pages/showcase.astro` esté disponible, cada componente será
**visible**, no solo documentado con JSDoc. El repo mantendrá un *component
showcase* (route `src/pages/showcase.astro` + `fixtures/` por dominio) que
renderizará cada componente **con datos vivos**:

- El showcase es **dinámico**: consume la API/dominio real del registro (su
  service + API route), igual que las páginas de producción. Según el parámetro,
  (p. ej. `?id=` / ruta con id), muestra el registro actual de la API — refleja
  cambios de datos, no fixtures hardcodeadas.
- Los `fixtures/` por dominio sirven como **fallback de arranque** (cuando la
  API aún no tiene datos o el índice va sin selección). El fetch lo hace el
  contenedor (la page route), nunca el componente.
- Cada componente presentacional recibe su demo en el mismo task que lo crea.
- JSDoc: `@module` por archivo, `@remarks`/`@see`/`@example` en miembros
  públicos, e `interface Props` tipada que auto-documenta la API.
  Nuevos componentes listan su showcase en sus `index.ts` barrels.

### Max file size
**≤150 lines per file.** When touching a file near/over that limit, refactor by responsibility. Do not rely on an exact count of offenders — it changes.

## Path Aliases (tsconfig + Vite)
`@`, `@styles`, `@anime`, `@auth`, `@media`, `@music`, `@user`, `@shared`, `@lib`, `@config`, `@middleware`, `@layouts`, `@http`, `@components`, `@hooks`, `@stores`, `@utils`, `@db` — all map to `src/` subdirectories (confirmed in `tsconfig.json`, `astro.config.mjs`, and `vitest.config.ts`). Use these instead of relative imports. Each domain has its own alias (`@anime`, `@auth`, `@media`, `@music`, `@user` → `src/domains/*`); the old generic `@domains/*` is removed and blocked by Biome's `noRestrictedImports` (along with `@/shared/*`, `@/domains/*`, `@/lib/*`). `@hooks` (`src/shared/hooks/`) and `@stores` (`src/shared/stores/`) are reserved for client-side React hooks and Zustand stores — the directories do not exist yet; create them with the first feature that needs them.

## API Route Patterns
Two composition styles:
1. `withZodValidation(schema)(handler)` — validates `{ params, query, body }` as single Zod object, returns 400 on failure
2. Error handling: `withErrorHandling(handler)` (try/catch wrapper) OR manual try/catch + `mapErrorToHttp(error)`

Response envelope: `{ data, status, error?, code?, meta? }`. Error codes in `src/shared/errors/codes.ts`. HTTP mapping in `src/shared/errors/map-error-to-http.ts`. `InfraError` maps to 503 with a `Retry-After` header and the original `code` preserved (e.g. `DB_ERROR`); stale-serve responses surface `meta.stale === true` as an `x-stale: true` header via `jsonResponse`. Dependencies are probed per-component by `GET /api/health/readiness` (200 when all up, 503 under the `/api/health` public prefix).

## Monitoring & Error Capture (Rustrak / Sentry SDK)

- **Server capture is total**: `mapErrorToHttp` reports **every** handled application error to the backend before building the response — `ValidationError`, `AuthError`, `DomainError`, `InfraError`, and unknown throwables. Severity follows the HTTP class via `captureError` (`@shared/errors/capture-error`): client-caused 4xx are captured at `warning` (groupable and excludable from alerts), server 5xx at `error`. `captureException` never throws and Rustrak no-ops when `SENTRY_DSN` is unset.
- **Browser capture**: `sentryAstro` runs with `enabled: { server: true, client: true }`. The client SDK (`sentry.client.config.ts`, auto-injected on every page by `@sentry/astro`) reports `window.onerror` / `unhandledrejection` when `PUBLIC_SENTRY_DSN` is set, and no-ops otherwise (zero client capture without it). `tracesSampleRate: 0` — errors only, no browser tracing/replay. React islands can additionally use `wrapReactComponentWithSentry` per-component.
- **Route error logs reach the app logger**: `withErrorHandling` logs caught errors via `@utils/logger-util` (pino → Sentry log bridge), never Better Auth's logger.
- **Malformed media paths are client errors**: `GET /media` returns `400 INVALID_IMAGE_PATH` (not a 503 infra error) for unparseable or oversized paths — guarded in `src/pages/media/[...path].ts` before the optimize/fetch pipeline so `optimizeMedia` never receives `null`.
- **Validation hand-off avoids proxy warnings**: `withZodValidation` attaches `validated` via `Object.defineProperty` instead of spreading `context`, so Astro's `session`/`csp` accessors are never evaluated per request (no config warnings, no leaks).
- **Noise policy**: 4xx capture at `warning` — Rustrak `new_issue`/`regression` alerts should target `error` only (`INFRA_*`, `UNKNOWN_ERROR`) to avoid bot/scraper 400s. For full browser coverage set `PUBLIC_SENTRY_DSN` mirroring `SENTRY_DSN`, and make sure the page CSP `connect-src` allows the Rustrak host.

## Auth & Middleware
- **Public routes** (prefix-matched): `/`, `/api/auth/login`, `/api/auth/register`, `/api/anime`, `/api/health`, `/api/music`, `/media`
- Middleware populates `locals.user` / `locals.session` via `resolveAuthActor()` (swallows errors, returns null)
- For strict auth in API routes: `sessionService.getSession()` throws typed errors

## Environment (matches `src/config/env.ts`)
Validated eagerly at import via Zod in `src/config/env.ts` — missing required vars = immediate crash.
- **Required**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `APP_BASE_URL`, `BETTER_AUTH_SECRET` (≥32 chars), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Optional**: `SENTRY_DSN` (monitoring no-ops when absent), `PUBLIC_SENTRY_DSN` (client-exposed mirror of `SENTRY_DSN` for browser error capture; no-op when unset, not validated by `env.ts` — read via `import.meta.env` in `sentry.client.config.ts`), `LOG_LEVEL` (trace|debug|info|warn|error|fatal), `NODE_ENV` (defaults to `development`)
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
| **tailwind-css-patterns** | Mobile-first; component styles compose utilities directly; `@apply` is reserved for shared global utility classes in `global.css`; extract repeating patterns as components; CSS variables for themes |
| **TypeScript** | `z.infer` over manual types; branded types for IDs; discriminated unions for states; `unknown` over `any` |
| **JSDoc** | Follow the installed `jsdoc-typescript-docs` skill and the existing style (`@module`, `@remarks`, `@see`, `@example`, `@throws`) — codebase is heavily documented; keep it single-quote/no-semicolon |
| **Frontend Design** | Avoid generic AI aesthetics (no Inter/Roboto, no purple gradients); distinctive typography, asymmetric layouts, CSS variables |
| **Accessibility** | Semantic HTML, ARIA labels, focus management, skip links, color contrast ≥4.5:1, prefers-reduced-motion |
| **SEO** | Structured JSON-LD, OG tags in `base-layout.astro`, canonical URLs, meta descriptions |
| **Core Web Vitals** | Preload LCP image; `aspect-ratio` for CLS; no tasks >50ms for INP; `font-display: optional` |
| **astro** | `astro:middleware` for session; `src/pages/` file-based routing; adapter configures output target |
| **Frontend flow** | Load the repo skill `frontend` (rendering, composition, styling, living docs) and `presentational-container` (separation of concerns) before any UI task; see "Frontend & UI" above |
| **UI/UX craft (impeccable)** | Load `impeccable` for design/layout/motion decisions; global tokens in `global.css` are the only source of color/typography |
| **Web quality (audit/testing)** | `web-quality-audit` for perf/a11y/SEO on new pages; `webapp-testing` (Playwright) to verify UI against a browser |
| **Component showcase** | When `src/pages/showcase.astro` is available, every presentational component needs a **dynamic** live demo on `/showcase` fed by the domain API/service (`fixtures/` only as fallback) + JSDoc — see "Living documentation" above |

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
- **Define constants in a dedicated module, then import them** — a domain/unit
  `constants.ts` (or `config.ts` for config objects). Never inline constant
  definitions in logic files (repositories, services, mappers, routes). Examples:
  `@anime/constants` (`ADULT_RATINGS`, `RELEVANCE_RANK_ALIAS`, `animeSortFields`),
  `@search/constants` (`SEARCH_HISTORY_PER_USER_CAP`), `@lib/cache/config`,
  `@shared/errors/codes`.

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
- **Biome** (`biome.json`): semi:false, **single quotes**, trailing commas `es5`, 80 col, 2-space indent, LF enforced via `.gitattributes`. Lint = recommended preset (import sorting disabled; `noSvgWithoutTitle`, `noImplicitAnyLet` relaxed). Config is authoritative — edit `biome.json`, do not reformat to tabs/double quotes.
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

> **`master` is protected (PR required — no direct push).** This means a release/version-bump commit can never go straight to `master`; it must ride in a Pull Request like any other change. Do **not** run the release *after* the feature PR is already merged — you would then need a second throwaway branch/PR solely to carry the `chore(release):` bump. Instead, run the release **on the same feature branch before merging**, so the feature PR carries the version bump and tag together:

1. On the **feature branch** (base `master`) and after the Verification gate passes, pick the release: `bun run release` (auto bumps from commits) or force `release:patch`/`release:minor`/`release:major`/`release:prerelease`. Preview first: `bun run release:dry`, and confirm the bump type matches the commit set (a mix incl. `feat` → minor).
2. `standard-version` bumps `package.json`, regenerates `CHANGELOG.md`, commits `chore(release): X.Y.Z`, and creates the local tag `vX.Y.Z`.
3. Open/amend the feature PR including that release commit, get it green (`gate` + SonarQube + Vercel), and merge it.
4. After merging, `git push origin vX.Y.Z` (tags are not restricted by the branch protection).
5. CI `release.yml` (triggered on tag `v*`) builds the Docker image tagged `:<version>`, `:latest`, and `:<sha>` and deploys — so any published release is reproducible exactly.

## Commit Convention
Conventional Commits with scopes: `type(scope): summary` (e.g., `fix(auth): Handle expired token`). See `.changeset/commit-all.md`.
