# Tasks — catalog coverage fields

> TDD-first: failing test (unit and/or integration) before implementation.
> In dependency order. Integration specs follow the repo convention
> (`*.integration.test.ts`, `RUN_DB_TESTS=1`, real Postgres).

## A. Schema + migration

- [x] A.1 `anime.ts`: add nullable `broadcast_day` (text), `broadcast_time`
  (time), `broadcast_timezone` (text), `aired_from`/`aired_to` (timestamptz),
  `trailer_youtube_id`/`trailer_embed_url` (text), `duration` (text),
  `source` (text), `rank`, `members`, `favorites` (integer); add
  `anime_broadcast_day_idx` on `broadcast_day`.
- [x] A.2 `anime-entity-relations.ts`: add `role` (text, `not null`,
  default `'producer'`) to `animeProducer`; extend the primary key to
  `(animeId, producerId, role)`; add index on `(role, producerId)`.
- [x] A.3 `anime-external.ts`: add nullable `anilistId`.
- [x] A.4 Generate the migration (`bun run db:generate`), review the SQL
  (column adds, PK swap with backfill, indexes) and apply it locally
  (`bun run db:migrate`). Verify forward-only: no drops, no renames, existing
  `anime_producer` rows survive with `role = 'producer'`.
- [x] A.5 Failing integration test first: after migrating, an `anime_producer`
  row can hold the same company twice under different roles, and a
  role-filtered lookup uses the new index.

## B. Ingestion contract + consumers

- [x] B.1 Document the write contract (fields ← source endpoint ← task type)
  for the scraper: `/anime/{id}/full` → `anime` broadcast/aired/trailer/stats,
  `studios`/`licensors`/`producers` → role-tagged junction rows. Keep it in the
  change's delta or the scraper repo's `ROADMAP.md` (single source).
- [ ] B.2 Update exposed types/repositories that surface anime rows so the new
  columns are selectable (no behavior change; no route reads them yet).
- [ ] B.3 Cross-repo (separate PR in `anime-scraper-v2`): extend the `/full`
  mapper to emit studios/licensors with roles, broadcast, trailer and stats;
  promotion diff-upsert must upsert the junction with `role` in its conflict
  target.
- [x] B.4 Coverage query documented: non-null percentage per new column over
  `anime` (feeds the D.3 metrics and the Modo A promotion gate).

## C. Verification, release & archive

- [ ] C.1 Full gate on the feature branch (`format` → `check` → `check:types` →
  `test` → `test:integration` → `build`).
- [ ] C.2 Doubt pass: confirm the archived `advanced-anime-search` deferrals
  (studio filter, broadcast-day filter) are now unblocked at the schema level
  and no deferred behavior was silently implemented here.
- [ ] C.3 Release on the branch (`bun run release:minor`), open PR, green CI,
  merge, push tag, then archive (sync delta into `openspec/specs/`).
- [ ] C.4 Note in `ROADMAP.md` Track D that the schema half of the backfill is
  done and the data half is the scraper's Fase-3 run.
