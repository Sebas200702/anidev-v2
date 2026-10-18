# Design: catalog coverage fields

## 1. Findings (evidence-first)

| # | Finding | Evidence |
|---|---|---|
| C-01 | Jikan `/anime/{id}/full` already returns `studios`, `licensors`, `broadcast`, `trailer`, `rank`, `members`, `favorites`, `duration`, `source` and `aired.from/to` — typed in the scraper but dropped by the mapper, which only maps genres/demographics/themes/producers/relations | scraper `src/types/jikanDetailsApi.ts` (typed payload) vs `src/processors/jikanRelations.ts:20-46` |
| C-02 | The app has no place to store them: `anime` lacks broadcast/trailer/aired/duration/source/rank/members/favorites; `producer` has no studio/licensor distinction; `anime_external_ids` has kitsu/tvdb/animethemes only | `src/lib/db/schemas/anime.ts`, `producer.ts`, `anime-external.ts` |
| C-03 | The consequence is already documented as a deferral: studio filter and broadcast-day filter are "blocked on Track D backfill" | archived change `advanced-anime-search` (proposal §Non-goals, design §Findings) |
| C-04 | Today even the entity list is ambiguous: the MAL HTML mapper merges studios + licensors + producers into a single producer list | scraper `src/processors/mal/animeDetails.ts:74-90` |
| C-05 | `anime_producer` is keyed `(anime_id, producer_id)`, so one company cannot be both producer and licensor of the same title without a schema change | `src/lib/db/schemas/anime-entity-relations.ts:108-119` |
| C-06 | The scraper's fill/refresh strategy re-arms completed work by policy; the promotion order must be FK-safe (companies → anime → junctions) and non-destructive | scraper `docs/fill-and-refresh-strategy.md` (Track D) |

## 2. Decisions

### D-C1 — One company entity, a role on the junction
Studios, licensors and producers share MAL's producer id namespace, so they stay
one `producer` row (with its `producer_title` variants and media) and the
*junction* carries the role. Options weighed:

| Option | Verdict |
|---|---|
| `role` column on `anime_producer` (PK extended), indexed `(role, producer_id)` | **Chosen**: no entity duplication, one index serves the studio page/filter, promotion upsert stays a single table |
| Separate `anime_studio` / `anime_licensor` tables | Rejected: triples junction DDL and every company-related query joins three tables |
| `type` on `producer` | Rejected: the same company is routinely both producer and licensor across titles, and sometimes on the same title |

### D-C2 — Broadcast is day + time + timezone, as the source gives it
`broadcast_day` stores MAL's English weekday as delivered (`"Sundays"`), plus
`broadcast_time` (`time`) and `broadcast_timezone` (`text`, e.g.
`"Asia/Tokyo"`). The day filter compares exact values; locale mapping is a
presentation concern. Titles without an ongoing schedule (finished, movies)
stay `NULL` — filters and the schedule page must treat `NULL` as "no schedule",
never as an error.

### D-C3 — Aired window as `timestamptz`
`aired_from` / `aired_to` are `timestamp with time zone`, parsed from Jikan's
ISO-8601 values. The existing `year` column remains (it drives current
discovery) and stays the cheap filter; the window enables "airing now" logic
and future schedule queries.

### D-C4 — Trailer as columns on `anime`
A trailer is singular per anime and display-oriented: `trailer_youtube_id` +
`trailer_embed_url`. If thumbnail variants are ever needed they become
`anime_media` rows (the table already models entity media), not columns.

### D-C5 — Additive, nullable, non-destructive
Every new field is nullable with no default rewrite, the `anime_producer` PK
swap backfills existing rows as `producer`, and no column is dropped or
renamed. Promotion is a diff-upsert by natural key (per Track D), so the
migration and the backfill can land independently.

### D-C6 — Populated only by the pipeline
These columns are written by ingestion (Modo A promotion or Modo B
incremental) and read-only for the app, consistent with the Track D principle
that request-time code never calls catalog sources. Coverage per column is
queryable (count of non-null rows), which feeds the D.3 coverage metrics.

## 3. Risks

- **PK change on `anime_producer`**: small table today (~1 producer link per
  title), so the migration is cheap; writers (scraper promotion) must be
  updated in the same coordination window or inserts without `role` fail —
  mitigated by the `'producer'` default.
- **Duplicate roles per title**: MAL occasionally lists the same company twice
  (e.g. in both `producers` and `licensors`); the extended PK makes those two
  distinct, correct rows, and the scraper dedupes within a role.
- **Weekday strings are English and not enumerated**: filtering relies on MAL's
  vocabulary (`Mondays`…`Sundays`); storing a `text` avoids a migration if MAL
  ever changes it, and a future app-level enum can map it.
- **Promotion order**: companies and their titles must be promoted before
  junctions; the scraper's diff-upsert enforces parents → children and
  validates referential integrity before commit (Track D, D.0).
- **Stale nulls**: after this change, `NULL` means either "not yet backfilled"
  or "source has no value"; coverage metrics (D.3) are the way to tell them
  apart, and the backfill task must be completed before features depend on the
  fields.

## 4. Alternatives considered

- **Store the Jikan payload verbatim in a jsonb column** — rejected: filters
  (studio, day) need indexed columns; a jsonb blob defers the modeling without
  removing it.
- **Model studios as a separate entity type** — rejected: same MAL namespace,
  same titles, same media; the role discriminator is strictly less work.
- **Backfill in the same change** — rejected: schema first (anidev owns DDL),
  data second (scraper owns ingestion); keeps the change reviewable and
  lets Fase 2 land in parallel.
