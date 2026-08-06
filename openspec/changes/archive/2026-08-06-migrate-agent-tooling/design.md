## Context

The project is moving to a self-hosted stack (see `proposal.md` — Why): Upstash Redis → Dragonfly, Turso → Supabase (PostgreSQL), Sentry → Rustrak. This change only ships agent-facing artifacts: a project-local `rustrak` skill and an updated `AGENTS.md`. The app code still runs on the old providers; the provider swap is a separate change.

Relevant facts gathered from official Rustrak docs (`rustrak.github.io/rustrak/`, repo `github.com/AbianS/rustrak`):
- Rustrak is **Sentry-SDK compatible**: migrating the app means changing the DSN string only. DSN format: `http://<key>@<host>:8080/<project_id>`.
- Single binary; SQLite by default (`rustrak/rustrak-server:latest`) or PostgreSQL (`:postgres` tag). Dashboard is a separate image (`rustrak/rustrak-ui:latest`) that can run anywhere (server-only mode recommended).
- Server envs: `DATABASE_URL`, `SESSION_SECRET_KEY` (64-char hex, `openssl rand -hex 32`), `CREATE_SUPERUSER` (`email:password`), `PUBLIC_URL`, `SSL_PROXY`, `PORT`, `RUST_LOG`, rate-limit vars, `SOURCEMAP_STORAGE_PATH`, `SMTP_*`, `DASHBOARD_URL`. UI env: `RUSTRAK_API_URL`.
- Has `@rustrak/client` (typed REST client) and `@rustrak/mcp` (MCP server for AI triage).

The repo conventions that constrain this change: AGENTS.md is the authoritative agent guide; project skills live in `.opencode/skills/<name>/SKILL.md` (existing openspec skills follow that layout); max file size ≤150 lines.

## Goals / Non-Goals

**Goals:**
- Give the agent accurate, current knowledge of Rustrak so it never invents configuration.
- Make `AGENTS.md` describe the self-hosted target stack (Dragonfly, Supabase/Postgres, Rustrak) and the migration path from the old providers.
- Keep both artifacts within repo conventions (≤150 lines, strict structure, no code edits).

**Non-Goals:**
- Changing application code, dependencies, or env wiring — the actual provider swap lives in a separate change.
- Creating skills for Dragonfly or Supabase (analysis in the session showed existing Redis + Drizzle skills cover the behavior; only provider-specific deployment notes go into AGENTS.md).
- Migrating data between databases.

## Decisions

### D1 — One new skill: `rustrak` only
Dragonfly is Redis-wire-compatible (≈185 commands) and the client swap is covered by existing `redis` skills; Supabase here is just Postgres hosting covered by the `drizzle-orm` skill. Rustrak is the only provider with zero ecosystem coverage and new/small enough that an agent would hallucinate it. → Create `.opencode/skills/rustrak/SKILL.md`.
- *Alternative considered*: full Dragonfly + Supabase skills. Rejected as duplication with low marginal value.

### D2 — Skill location and format follow repo convention
Place at `.opencode/skills/rustrak/SKILL.md`, matching the existing `.opencode/skills/openspec-*/SKILL.md` layout (front-matter name + description, then a workflow). Keep ≤150 lines.

### D3 — Skill content is grounded in official docs, with cited URLs
The skill captures: what Rustrak is, the Sentry-compatible migration path (DSN swap), self-hosting (server-only vs. full stack, SQLite vs. Postgres tags), the env surface, DSN shape, alerting/logs/AI-traces capabilities, and the `@rustrak/client` / `@rustrak/mcp` tooling. Every section cites `rustrak.github.io` pages so the agent can verify drift.

### D4 — AGENTS.md splits the target stack from the current Environment
`AGENTS.md` distinguishes the target from what runs today: `Stack` and `Important Constraints` define the self-hosted target (Dragonfly Redis, Supabase/PostgreSQL, Rustrak); `Environment` keeps documenting the current legacy variables (`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`, `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, `SENTRY_DSN`) alongside migration notes. The target guidance names what the providers become without claiming the legacy vars were replaced or a `RUSTRAK_DSN` was added:
- **Monitoring**: target is Rustrak replacing Sentry at the provider level; the `@sentry/*` SDKs and the existing "no-ops when DSN unset" behavior stay, only the DSN value now points at Rustrak. `SENTRY_DSN` remains the variable until the follow-up swap.
- **Cache**: target client is a standard Redis client wired to Dragonfly (from `@upstash/redis` REST); `CacheTtl` semantics unchanged.
- **Database**: target Drizzle dialect is `pg` (from LibSQL); Supabase supplies the Postgres connection string; Better Auth adapter moves from SQLite to Postgres.
- The code-swap itself is flagged as a separate change so AGENTS.md never misrepresents the target as done.
- *Alternative considered*: keeping AGENTS.md frozen until the code migrates. Rejected: the user's intent is to steer development toward the self-hosted stack now.

### D5 — Keep the DSN env name as `SENTRY_DSN`
Minimizes code churn and preserves the documented no-op behavior. The value becomes the Rustrak DSN. Documented in AGENTS.md; rename to `RUSTRAK_DSN` is an easy follow-up.

## Risks / Trade-offs

- **AGENTS.md could describe providers the code doesn't use yet** → Mitigation: AGENTS.md explicitly states the code swap is a separate tracked change; both artifacts are reviewed together in this branch.
- **Rustrak is young (v0.14, ~87 stars, GPL-3.0)** → Mitigation: pin a specific image tag; since it's Sentry-compatible, rollback is a one-line DSN revert to Sentry.
- **Dragonfly ≈ Redis 5.0 API** → some Redis 6/7 commands may differ → Mitigation: migration note in AGENTS.md to verify command usage against the compatibility table before adopting.
- **SQLite → Postgres type differences for Drizzle/Better Auth** → Mitigation: note in AGENTS.md that migrations must be regenerated (`bun run db:generate` + `db:migrate`) under the `pg` dialect.
- **Skill content may drift as Rustrak evolves** → Mitigation: every section cites the official docs page; version-pinned image guidance prevents silent breakage.

## Migration Plan

1. **This change (branch `docs/agent-tooling-migration`)**:
   - Create `.opencode/skills/rustrak/SKILL.md`.
   - Update `AGENTS.md` (Stack, Environment, Important Constraints).
2. **Follow-up change (not this branch)**: swap providers in code — Postgres connection via Supabase, Redis client → Dragonfly, DSN → Rustrak.
3. **Rollback**: revert the DSN to `sentry.io` (SDK unchanged); revert AGENTS.md via git.

## Open Questions

- Whether Supabase should be accessed through its transaction pooler (port 6543) or direct connection (5432) for Drizzle — depends on host deployment; defer to the code-migration change.
- Whether to rename `SENTRY_DSN` → `RUSTRAK_DSN` eventually — deferred, non-breaking follow-up.
