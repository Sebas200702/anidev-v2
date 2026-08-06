## Why

The project is migrating to a fully self-hosted stack (Upstash Redis → Dragonfly, Turso → Supabase/PostgreSQL, Sentry → Rustrak), but `AGENTS.md` still documents the old providers and dependencies. Left stale, it actively misleads agents into adding the wrong env vars, wrong clients, and wrong migration steps. Separately, Rustrak is a brand-new, Sentry-compatible self-hosted error tracker with no skill coverage in the agent ecosystem — without a skill, the agent would invent its configuration.

## What Changes

- Update `AGENTS.md` Stack section: database (Turso/LibSQL → Supabase/PostgreSQL), cache (Upstash Redis REST → Dragonfly Redis), monitoring (Sentry → Rustrak, Sentry-SDK compatible).
- Update `AGENTS.md` with target-provider guidance (Dragonfly Redis, Supabase/PostgreSQL, Rustrak) without claiming the legacy `TURSO_*`/`UPSTASH_REDIS_*` are replaced or that `RUSTRAK_DSN` was added; `SENTRY_DSN` is retained until the follow-up swap.
- Add migration notes to `AGENTS.md` covering: Redis client swap (`@upstash/redis` REST → standard Redis client wired to Dragonfly), Drizzle dialect change (LibSQL → `pg`), and the Rustrak DSN (drop-in for the existing Sentry SDK since Rustrak is Sentry-SDK compatible).
- Create a project-local `rustrak` skill capturing the self-hosted error-tracking behavior, the Sentry-compatible ingestion path, and the deployment options (server-only vs. full stack, SQLite vs. PostgreSQL backend).

## Capabilities

### New Capabilities
None — no application runtime behavior changes. This change affects documentation and agent tooling only (an `AGENTS.md` update and a `rustrak` skill); the provider swap is a separate tracked change.

### Modified Capabilities
None — `openspec/specs/` is empty and no capability-level requirement changes.

> This is a documentation + agent-tooling change, so the change declares `skip_specs: true` (see `.openspec.yaml`). No spec delta is required or invented.

## Impact

- **Docs**: `AGENTS.md` (Stack, Commands, Environment, Important Constraints sections).
- **Agent tooling**: new skill under `.opencode/skills/rustrak/`.
- **No application code, dependencies, or API signatures change** in this change; the actual provider swaps are tracked separately.
- **No breaking changes** to the running system.