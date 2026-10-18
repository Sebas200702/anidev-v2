# Proposal: catalog coverage fields (studios, licensors, broadcast, trailer, stats)

## Why

The v2 catalog is a frozen dump missing exactly the fields that several shipped
or planned features need: studios/licensors, the broadcast schedule, trailers
and per-anime community stats. The archived `advanced-anime-search` change
documents the consequence: the **studio filter and the broadcast-day filter are
deferred, blocked on the Track D backfill**, because `producer` has no
studio/licensor split and there are no `broadcast_*` columns. Track D resumes
ingestion from `anime-scraper-v2`, whose `/anime/{id}/full` payload already
carries all of this data — but it is dropped by the mapper because the target
columns do not exist. Since anidev-v2 owns all DDL, the schema must land first;
this change adds it and fixes the ingestion contract. The scraper's mapping and
promotion work is scoped in its own repo (`ROADMAP.md`, Fase 3).

## What Changes

- `anime_producer` gains a `role` discriminator (`studio` | `licensor` |
  `producer`), with the composite primary key extended to
  `(anime_id, producer_id, role)`; existing rows are backfilled as `producer`.
  An index on `(role, producer_id)` makes role-filtered catalog queries cheap.
- `anime` gains nullable columns for the broadcast schedule (`broadcast_day`,
  `broadcast_time`, `broadcast_timezone`) with an index on day; the aired window
  (`aired_from`/`aired_to` as `timestamptz`); the trailer reference
  (`trailer_youtube_id`, `trailer_embed_url`); and descriptive/stat fields
  (`duration`, `source`, `rank`, `members`, `favorites`).
- `anime_external_ids` gains a nullable `anilist_id` slot for the Fase-3
  external-import work (population is a separate scraper task, not scoped here).
- The ingestion contract is explicit: these fields are written only by the
  pipeline (Modo A promotion or Modo B incremental), never at request time, and
  their coverage is measurable per column.

## Capabilities

### New Capabilities

- `anime/catalog-coverage`: the studios/licensors/broadcast/trailer/stats field
  model and the ingestion contract that populates it.

### Modified Capabilities

<!-- None at spec level. This change *unblocks* the deferred studio and
broadcast-day filters documented in the archived `advanced-anime-search`
change; those filters remain future app changes that consume these columns. -->

## Impact

- **anidev-v2**: `src/lib/db/schemas/anime.ts`,
  `src/lib/db/schemas/anime-entity-relations.ts`,
  `src/lib/db/schemas/anime-external.ts` + one migration; types/repos that
  expose the new columns.
- **anime-scraper-v2** (separate repo/branch): `/full` mapper emits
  studios/licensors/broadcast/trailer/stats; promotion diff-upsert respects the
  role-extended primary key and the FK-safe order.
- **Future app changes**: studio filter/page, schedule page (Fase 6),
  popularity/member sorting — all consume these columns with no further DDL.

## Non-goals

- Episode `video_url` / `episode_source` population — Fase 5 go/no-go decision,
  deliberately excluded.
- Streaming-link and external-link tables from the Jikan payload (can be added
  later without touching this model).
- Data backfill itself: all new columns are nullable and stay empty until the
  scraper's Fase-3 run promotes them.
- AniList id population (column only).

## Breaking changes

`anime_producer`'s primary key changes from `(anime_id, producer_id)` to
`(anime_id, producer_id, role)`. The migration is forward-only and
non-destructive: existing rows get `role = 'producer'`, so every current query
result is preserved; only writers must now supply a role.
