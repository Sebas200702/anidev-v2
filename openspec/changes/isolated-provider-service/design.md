# Design

## Context

See `proposal.md` for motivation. Constraints shaping this design: single 4 vCPU / 8 GB RAM VPS for the main app (ROADMAP D8), first-party-only providers created by the maintainer, no custom in-process sandbox, zero provider code in users' browsers, and Track D rule that the app only reads PostgreSQL while ingestion writes it.

## Goals / Non-Goals

**Goals:**

- Make provider execution a deployment boundary, not a code sandbox.
- Keep one contract across `local`, `remote`, and `cli` executors.
- Keep the public app repo neutral (no third-party domains or resolvers committed).

**Non-Goals:**

- A third-party extension marketplace, dynamic `.kai`/URL loading, or browser-side scraping.
- WASM/`isolated-vm`/`quickjs` runtimes or per-execution Docker orchestration inside the main VPS.

## Decisions

### 1. Static contract + three executors, one result shape

`src/domains/watch/providers/contract.ts` defines `StreamSourceProviderModule` (`providerId`, `displayName`, `priority`, `resolveEpisodeSources`). Executors share the signature and return type: `localExecutor` (maintainer machine / dev), `remoteExecutor` (HMAC-signed POST to the isolated service), `cliExecutor` (batch ingest script). Switching executor is configuration, not code change.

*Alternative considered:* dynamic `import()` of remote URLs in the main app — rejected, it reintroduces RCE and bypasses PR review.

### 2. Isolated provider service as a separate deployment

The service exposes one endpoint (`POST /scrape`) receiving `{ providerId, malId, episodeNumber, titles }` with HMAC-SHA256 signature (`PROVIDER_SERVICE_SECRET`) and short expiry (`exp`). It loads providers only from operator-declared local paths (`registry.json`), never from URLs. It validates output with Zod and writes to `episode_source` via a Postgres role scoped to that table.

*Alternatives:* container in the same compose with `readOnlyRootFilesystem`, `mem_limit=256m`, `cpus=0.5`, `user: nobody`, no secrets; or isolates platform (Cloudflare Workers / Deno Deploy) for zero-maintenance isolation. Both satisfy the boundary; compose container is the default for a single-operator setup.

### 3. Network and output guards live in shared code, enforced at both ends

All outbound provider fetches use `assertSafeExternalUrl` (HTTPS-only, no credentials, no loopback/RFC1918/link-local/IPv6-private), `AbortSignal.timeout(8000)`, `GET`-only, and a response byte cap. Output is validated with `normalizedSourceSchema` before any DB write; invalid rows are dropped, logged, and counted.

### 4. Neutral public repo, operator-owned registry

`PROVIDER_PATHS` empty by default means a clean clone has zero streaming sources. Concrete `.provider.js` files and `registry.json` live outside git (`.gitignore`, `.dockerignore`, host volume `/etc/anidev/providers/`). The repo ships only the contract, executors, one `example-*` fixture provider, and `providers/README.md`.

## Risks / Trade-offs

- **Compromised isolated service stays contained** → blast radius limited to that deployment; main app secrets and user tables unreachable by construction.
- **Extra network hop for ingestion** → acceptable: scraping is offline/batch, never request-time.
- **External providers skip PR review** → mitigated by Zod contract validation, SSRF/timeout/byte guards, and scoped DB role.
- **Legal risk unchanged by isolation** → isolation protects the server, not the operator; source legality remains the Fase 5 spike decision.

## Migration Plan

Additive only: contract + executors + isolated service land without touching existing catalog routes. Rollback is disabling `PROVIDER_SERVICE_URL` (ingestion falls back to empty sources). No schema change beyond the already-planned `episode_source` enrichment in `resilient-playback-and-aniskip`.
