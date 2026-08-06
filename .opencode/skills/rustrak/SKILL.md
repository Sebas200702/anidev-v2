---
name: rustrak
description: Self-hosted error tracking compatible with Sentry SDKs. Works with or replaces Sentry by changing the DSN. Use for self-hosting a lightweight error/log/trace tracker, migrating away from Sentry, or configuring a Rustrak server (SQLite or PostgreSQL) and pointing the existing @sentry/* SDKs at it.
---

# Rustrak — Self-Hosted Error Tracking (Sentry-Compatible)

Ultra-lightweight self-hosted error tracker that also takes logs, transactions, release health, and AI traces through the **standard Sentry envelope protocol**. Run it on infrastructure you own. Repo: `github.com/AbianS/rustrak` · Docs: `https://rustrak.github.io/rustrak/` · License: GPL-3.0.

## Key facts
- **Sentry-compatible**: migrating an app is a config change, not a code change. Any Sentry SDK (JS, Python, Go, Rust, …) works.
- Single Rust binary (server ~50MB), SQLite by default or PostgreSQL for scale. Dashboard is a **separate image**; can run on your laptop or Vercel (server-only mode recommended for production).
- Two-phase ingestion: parse → write to disk → return `200`; DB work happens asynchronously so a traffic spike never times out the app.
- Verified against current docs (v0.14; project is young/active — pin image tags).

## Migrating from Sentry (this repo)
Keep the existing `@sentry/node`/`@sentry/astro`/`@sentry/react` and their no-ops-when-unset behavior. Set `SENTRY_DSN` to the Rustrak DSN — one string, nothing else changes.

```
SENTRY_DSN=http://<key>@<host>:8080/<project_id>
```

DSN shape is exactly Sentry's; the project id comes from the Rustrak dashboard project, `<key>` is that project's key.
Docs: https://rustrak.build/rustrak/getting-started/quickstart

## Self-hosting
Compose stack (server + Postgres + UI) or server-only:

```yaml
services:
  server:
    image: rustrak/rustrak-server:v0.14.1   # SQLite; use :postgres for Postgres
    ports: ["8080:8080"]
    volumes: [rustrak_data:/data]
    environment:
      - SESSION_SECRET_KEY=${SESSION_SECRET_KEY}
      - CREATE_SUPERUSER=${CREATE_SUPERUSER}
  ui:
    image: rustrak/rustrak-ui:v0.14.1
    ports: ["3000:3000"]
    environment:
      - RUSTRAK_API_URL=http://server:8080
volumes:
  rustrak_data:
```

- `SESSION_SECRET_KEY` → `openssl rand -hex 32`
- `CREATE_SUPERUSER` → `email:password` (admin, created only on empty DB)
- SQLite default: `DATABASE_URL=sqlite:///data/rustrak.db`. Postgres image tag `:postgres` + `DATABASE_URL=postgres://user:pass@host:5432/db`.
- Docs: https://rustrak.build/rustrak/getting-started/installation · https://rustrak.build/rustrak/getting-started/overview (database backends + deployment options)

## Server env surface (subset)
`DATABASE_URL`, `SESSION_SECRET_KEY`, `CREATE_SUPERUSER`, `PUBLIC_URL` (must be reachable URL or SDK gets `0.0.0.0`), `SSL_PROXY` (secure cookies + requires SESSION secret), `PORT` (8080), `HOST` (0.0.0.0 default), `RUST_LOG`, `MAX_EVENTS_PER_*` (rate limits), `SOURCEMAP_STORAGE_PATH`, `SMTP_HOST/USERNAME/PASSWORD/FROM`, `DASHBOARD_URL`. UI: `RUSTRAK_API_URL`, `RUSTRAK_VERSION_CHECK_ENABLED`.
Docs: https://rustrak.build/rustrak/configuration/environment

## Capabilities (all via the same DSN)
- **Errors** → grouped into issues by deterministic fingerprint (SDK fingerprint, else type+first line+transaction). Source maps applied server-side per release.
- **Logs** — structured logs as first-class events; opt in with `enableLogs: true` then `Sentry.logger.info('msg', { id })`.
- **AI traces** — agent runs as spans on a waterfall via `integrations: [Sentry.vercelAIIntegration()]` (bunched Spans Protocol v2).
- **Performance / release health** — transactions + spans; session-based crash-free users/sessions.
- **Alerts** — triggers `new_issue` / `regression` / `unmute` → Slack (webhook or bot), SMTP email, or JSON webhook.
- **Teams & retention** — Admin/Member/Viewer roles, storage usage, configurable retention + manual cleanup.
- Docs: https://rustrak.build/rustrak/usage/issues · https://rustrak.build/rustrak/usage/logs · https://rustrak.build/rustrak/usage/agents · https://rustrak.build/rustrak/usage/alerts · https://rustrak.build/rustrak/usage/team

## Tooling
- `@rustrak/client` — typed REST client; every method returns `Result<T, RustrakError>` and never throws.
- `@rustrak/mcp` — MCP server over that client so an agent can triage the instance.
- Server exposes OpenAPI at `/docs`.
- Docs: https://rustrak.build/rustrak/sdks/client · https://rustrak.build/rustrak/sdks/mcp

## Conventions
- Prefer `@rustrak/client` over raw HTTP for server-side reads; keep `@sentry/*` untouched in the app.
- Match repo style: Bun (`bunx`, `bun add`), never npm/npx.