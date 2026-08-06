## 1. Rustrak skill

- [x] 1.1 Create `.opencode/skills/rustrak/SKILL.md` with front-matter `name: rustrak` and `description` matching the repo's skill layout
- [x] 1.2 Document the Sentry-compatible migration path: DSN swap only (`http://<key>@<host>:8080/<project_id>`), existing `@sentry/*` SDKs and no-op behavior unchanged
- [x] 1.3 Document self-hosting options: server-only vs. full stack, SQLite (`:latest` tag) vs. PostgreSQL (`:postgres` tag), image tags `rustrak/rustrak-server` + `rustrak/rustrak-ui`
- [x] 1.4 Document the server env surface: `DATABASE_URL`, `SESSION_SECRET_KEY`, `CREATE_SUPERUSER`, `PUBLIC_URL`, `SSL_PROXY`, `PORT`, rate-limit and storage vars
- [x] 1.5 Document capabilities: alerts (new_issue/regression/unmute → Slack/SMTP/webhook), structured logs (`enableLogs`), AI traces (`vercelAIIntegration`), release health
- [x] 1.6 Document tooling: `@rustrak/client` (typed REST, `Result<T,E>`) and `@rustrak/mcp` (AI triage)
- [x] 1.7 Cite official docs URLs per section and keep the file ≤150 lines

## 2. AGENTS.md restructure & accuracy

- [x] 2.1 Add `Development Methodology — OpenSpec`: SPECIFY→PLAN→TASKS→IMPLEMENT, the `openspec-propose/apply/update/archive` flow, branching strategy, `skip_specs` guidance
- [x] 2.2 Add `Verification & Code Quality`: gate order (`format → astro sync → build`), test placement guidance, honest note that no lint/test/typecheck scripts exist, CI/CD description
- [x] 2.3 Fix inaccuracies: replace "No CI workflows found" with real `.github/workflows/deploy.yml`, replace unverifiable "17 files exceed 150 lines" with a refactor-when-touching rule
- [x] 2.4 Fix `Environment` section to match `src/config/env.ts`: `APP_BASE_URL` required (no `BETTER_AUTH_URL`), add optional `SENTRY_DSN`/`LOG_LEVEL`/`NODE_ENV`
- [x] 2.5 Add domain-purpose lines (anime/music/media/auth/user) and `Setup` section; keep current Stack while marking the self-hosted migration as in-flight via the change pointer
- [x] 2.5b Add `Code Style & Naming` section: variables/functions/constants naming, element-style table, nullability, early returns, destructuring/template strings, comments, error handling — grounded in Prettier (single quotes, no semicolons, es5) and `AppError`/error factories, not Biome
- [x] 2.6 Update `Stack` section to the self-hosted providers (Turso → Supabase/Postgres, Upstash → Dragonfly Redis, Sentry → Rustrak) via the migration apply
- [x] 2.7 Mark the code-level provider swap as a separate tracked change so AGENTS.md never implies it is done
- [x] 2.8 Run `bun run format` on touched files and confirm no code files changed; the `src/` formatting diff on this branch comes from the separate `migrate-to-biome` change, not this one

## 3. Verification

- [x] 3.1 Confirm the rustrak skill exists and contains a valid name + description
- [x] 3.2 Confirm AGENTS.md has no remaining references to the old stack as current truth
- [x] 3.3 `openspec validate --change migrate-agent-tooling` passes
