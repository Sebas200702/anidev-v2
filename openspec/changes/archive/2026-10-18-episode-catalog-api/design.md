# Design: episode catalog API

## 1. Findings

| # | Finding | Evidence |
|---|---|---|
| E-01 | `episode` has `id`, `anime_id`, `number`, `title`, `synopsis`, `duration`, `aired` (text), unique `(anime_id, number)` | `src/lib/db/schemas/episode.ts` |
| E-02 | Long series reach 3 057 episodes per anime; a single unpaginated payload with synopses is too heavy | `SELECT anime_id, count(*) FROM episode GROUP BY 1 ORDER BY 2 DESC` |
| E-03 | `episode_media` has 0 rows (local and prod) | row counts 2026-10-18 |
| E-04 | No repository/service/route reads `episode` today | `grep -r episode src/domains src/pages` |
| E-05 | Sibling sub-resources (`staff`, `characters`) use repository → mapper → service with `withStaleCache` and `CacheTtl.Long` | `src/domains/anime/services/anime-staff/service.ts` |

## 2. Decisions

### D-E1 — Episodes live in the `anime` domain
An episode is anime catalog metadata and is read the same way as staff and
characters. The future `watch` domain (playback) depends on it, not the
reverse.

### D-E2 — List is paginated in SQL; detail carries the synopsis
`page` (1–10 000, default 1) and `limit` (1–100, default 24), `ORDER BY number`,
with the total fetched concurrently (`Promise.all`, same as `anime-list`).
List items omit `synopsis` to keep pages small (E-02); the detail route returns
it. Items expose the surrogate `id` because `watch_progress` is keyed by
`episode.id`.

Response meta for the list: `{ stale, page, limit, total, hasNext }`.

### D-E3 — Not-found semantics
- List: an empty page for an anime that exists is `200 []`. When the total is
  zero, the service checks the anime row: missing → `ANIME_NOT_FOUND` (404).
  The check runs only on that path, so normal lists pay no extra query.
- Detail: missing episode → anime row check → `ANIME_NOT_FOUND` or the new
  `EPISODE_NOT_FOUND` (both 404).
Domain errors are never cached and never stale-served (`withStaleCache` only
falls back on `InfraError`).

### D-E4 — Cache keys and TTL
`anime:episodes:{malId}:{page}:{limit}` for list pages and
`anime:episode:{malId}:{number}` for detail, `CacheTtl.Long` (86 400 s) plus the
standard `:stale` copy. Episodes change only through the ingestion pipeline;
a day of staleness is acceptable, as for staff.

### D-E5 — Fields as stored
`duration` and `aired` stay as the source text (`"24 min"`, `"1998-10-23"`);
no parsing at request time.

## 3. Risks

- **Cache fan-out by `limit`**: arbitrary `limit` values multiply keys. Bounded
  by the 1–100 range and the TTL; acceptable at current traffic.
- **Count cost on long series**: `count(*)` per page over at most ~3k rows,
  served by `episode_anime_number_unique`; cached afterwards.
