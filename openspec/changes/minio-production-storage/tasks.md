## 1. Standalone storage compose

- [x] 1.1 Add `docker-compose.storage.yml` with `minio`, `minio-init` and the `minio_data` volume, keeping `profiles: ['storage']` on both services and the single-invocation `mc` entrypoint (alias + `mb` + `anonymous set` in one `sh -ec`)
- [x] 1.2 Replace the inline `minio`/`minio-init` block and the `minio_data` volume in `docker-compose.yml` with `include: [./docker-compose.storage.yml]`
- [x] 1.3 Validate resolution locally: `docker compose config --services` (must not list MinIO) and `docker compose --profile storage config --services` (must list `minio` + `minio-init`), plus `-f docker-compose.storage.yml --profile storage config --volumes` resolving `minio_data`

## 2. Documentation

- [x] 2.1 `AGENTS.md`: state that MinIO self-hosted is the chosen production storage backend, keeping Cloudflare R2 documented as the migration path (env-only, no code change) and noting the EOL caveat / build-from-source requirement
- [x] 2.2 `AGENTS.md`: document the production deploy path (Dokploy compose from GitHub, `COMPOSE_PROFILES=storage`, `S3_ENDPOINT=http://minio:9000`, `S3_PUBLIC_URL=https://media.anidev.app/<bucket>`, loopback-only console) and the DNS record it requires
- [x] 2.3 `AGENTS.md`: refresh the Local stack section so it points at the new compose file and still documents `docker compose --profile storage up -d --build`
- [x] 2.4 `.env.example`: mark the MinIO route as the one used in production and leave R2 explicitly documented as the alternative/migration route

## 3. Verification

- [x] 3.1 `bun run format` → `bun run check` → `bun run check:types` → `bun run test` → `bun run build` all pass
- [ ] 3.2 `openspec validate --change minio-production-storage` passes — **not run: the openspec CLI is not installed in this environment** (`command -v openspec`, the repo, `mise` and the npm global list all miss it; the skills declare "Requires openspec CLI"). Run it where the CLI is available. Meanwhile the change was checked manually against the archived `skip_specs: true` examples: `.openspec.yaml` carries `schema`/`created`/`skip_specs`, and `proposal.md` has Why / What Changes / Capabilities / Impact with the `skip_specs` justification.
- [x] 3.3 Confirm the diff touches only compose/docs (no `src/`, no CI) and that `docker-compose.yml` still resolves `postgres`/`dragonfly`/`rustrak` without the storage profile
