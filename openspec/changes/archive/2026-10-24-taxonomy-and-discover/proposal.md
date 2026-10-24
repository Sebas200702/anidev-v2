# Proposal: taxonomy browsing (`/search`)

## Problem

Genre pills (`#Genre`) on the hero carousel and anime cards link to
`/search?genre=<name>` — a route that does not exist, so every click dies
in a 404. Fase 1 ("núcleo de descubrimiento") is otherwise complete
(search, home, parental control, search history); this closes it.

## Scope

- New SSR container route `/search` reading `genre`, `query`, `page`,
  `sort`/`order` from the URL and rendering through the existing
  `animeListService` + `AnimeCard` grid (presentational-container, zero JS).
- Empty state when no anime matches; `400` on invalid params via the
  existing list schema (bounded `page` included).
- SEO: real `<h1>`, title/meta per active filter, canonical URL.
- E2E over the real stack: genre-exclusive seed row found via `/search`,
  invalid `page` rejected, headers present.

## Non-goals

- Studio/producer pages: the list API has no producer filter and the catalog
  backfill is Track D work — deferred to a dedicated change (like the
  deferred broadcast-day filter in `advanced-anime-search`).
- New presentational components: the grid composes the existing `AnimeCard`
  (already showcased); no new `/showcase` entry needed.
- No new cache layer: responses reuse `animeListCache` keyed by normalized
  filters (canonical keys from D.8).

## Breaking changes

None. Purely additive route; existing genre-pill links start working.
