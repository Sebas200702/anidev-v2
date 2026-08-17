## Why

Discovery is the core of AniDev (`PRODUCT.md`: _priorizar el descubrimiento_), but
`GET /api/anime` only supports a thin filter set (`genre`, `status`, `rating`,
`year`, `type`, free-text `query`) with fixed ordering and a naive `ILIKE` text
match. v1's advanced search added **season, score range, and configurable sort**,
applied a **parental-control floor**, and persisted a **search history** per user.
Without these, the v2 catalog is not explorable to parity, and later work (AI
recommendations, Fase 4) has no rich query surface to build on.

Per the architecture decision log (`ROADMAP.md` D3), search stays **Postgres-only,
staged**: this change is **Stage 1** — stock Postgres (`pg_trgm` + `tsvector` +
`GROUP BY`), no ParadeDB/BM25 yet. The query layer is structured so BM25 (Stage 2)
and pgvector (Stage 3) can be swapped in later **without an API change**.

## What Changes

- Improve **free-text relevance**: replace `ILIKE '%q%'` with a `pg_trgm` GIN +
  `tsvector` match over title/synonyms (indexed, typo-tolerant-ish). Stage 1 only.
- Add **data-backed filters** that the current dataset supports: **`season`** and
  **score range** (`scoreMin`/`scoreMax`).
- Add **configurable sort** (`sort` field + `order` direction) over a whitelist.
- Add a **parental-control floor**: adult ratings excluded by default; included
  only for an authenticated, opted-in user. Modeled as a **coarse cache-key
  variant** (`safe` / `full`), never per user id — **catalog `GET /api/anime`
  responses stay shared-cacheable**, keyed by normalized filters + `parentalVariant`
  (`ROADMAP.md` D5).
- Add **search history**: persist an authenticated user's executed searches;
  expose read + clear. Anonymous searches are not persisted. **Only the
  authenticated history responses are `private, no-store`; catalog search
  responses remain cacheable.**
- Wire everything through the existing pipeline (request schema → filters mapper →
  repository query → cache key) using the standard wrapper composition
  (`withZodValidation(...)(withErrorHandling(handler, { responseSchema }))`).

**Explicitly deferred (blocked on Track D data backfill, `ROADMAP.md`):**

- **Studio filter** — current data only has generic `producer` rows (no
  studio/licensor split). A true studio filter waits on the Track D backfill.
- **Broadcast-day filter** — no `broadcast_*` columns are populated yet; deferred
  to the same backfill.
- **Facet counts** ("Action (1240)") — a fast-follow once the filter surface lands.
- **BM25 / semantic ranking** — Stage 2/3, separate changes.

## Capabilities

### New Capabilities

- `anime/advanced-search`: Extended, validated multi-filter search over the anime
  catalog (season, score range, configurable sort, improved free-text) with a
  parental-control cache-variant floor and per-user search history, on Stage-1
  stock Postgres.

### Modified Capabilities

- (none committed under `openspec/specs/` for the anime domain yet)

## Impact

- **Code:** `src/domains/anime/` (schemas, `mappers/anime-filters`, repositories,
  services, cache keys), `src/pages/api/anime/index.ts`; a user-scoped search
  history unit in the **anime** domain + its authed route(s).
- **API:** `GET /api/anime` gains `season`, `scoreMin`, `scoreMax`, `sort`,
  `order`; existing params unchanged and backward-compatible. New authed
  search-history read/clear route(s).
- **Auth:** parental `full` variant and search history require a session; the
  anonymous default is the safe catalog with no history.
- **DB:** existing `anime` columns (`season`, `score`, `rating`) + a new
  `search_history` table and search **indexes** (`pg_trgm` GIN on title/synonyms,
  `tsvector`). Migrations owned by anidev-v2 (D1).
- **Cache:** filter cache keys extend with the new dimensions **and the parental
  `safe`/`full` variant**.
- **Deps:** none (stock Postgres extensions `pg_trgm`; `tsvector` is built-in).
