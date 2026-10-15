# Tasks

## 1. Provider contract and registry loader

- [ ] 1.1 Add `StreamSourceProviderModule` contract plus Zod schemas in `src/domains/watch/providers/` and verify `bun run check:types` passes
- [ ] 1.2 Implement static registry loader honoring `PROVIDER_PATHS` (empty by default) with contract validation and `priority` ordering, and verify unit tests cover accept/reject/ordering
- [ ] 1.3 Add `example-*` fixture provider and `providers/README.md` documenting the operator-owned model, and verify the documented load command runs as written

## 2. Isolated provider service skeleton

- [ ] 2.1 Scaffold the isolated service with `POST /scrape` (HMAC-SHA256 + `exp` verification) and verify unsigned/expired requests return `401` without execution
- [ ] 2.2 Implement provider file loading from operator-declared local paths only (no URL imports) and verify remote-path inputs are rejected
- [ ] 2.3 Wire `assertSafeExternalUrl`, 8s timeout, GET-only, and response byte cap into the service fetch path, and verify unit tests cover blocked host, timeout, and oversize cases

## 3. Executors and ingestion boundary

- [ ] 3.1 Implement `localExecutor`, `remoteExecutor`, and `cliExecutor` sharing one input/output shape, and verify executor unit tests pass with mocked transport
- [ ] 3.2 Enforce request-time reads from `episode_source` only (no provider imports in routes) and verify a static scan finds no `eval`, `new Function`, or remote dynamic imports in provider paths
- [ ] 3.3 Add scoped Postgres role and service resource limits (`readOnlyRootFilesystem`, memory/CPU caps, no app secrets), and verify credential audit and limit checks pass

## 4. Observability, circuit breaking, and E2E verification

- [ ] 4.1 Add per-provider logging, failure counters, and open-circuit behavior with Dragonfly-backed cooldown, and verify unit tests cover trip/reset transitions
- [ ] 4.2 Add end-to-end verification from signed ingest call to `episode_source` rows to API read, and verify Playwright/integration tests cover success, empty-source degradation, and invalid-row drop
