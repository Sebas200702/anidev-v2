# Tasks — taxonomy browsing (`/search`)

> TDD-first: failing test/route assertion before implementation. In dependency
> order; do not start a later phase before its predecessor passes its gate.

## A. Route (TDD)

- [ ] A.1 Failing test first: `GET /search?genre=<seeded-genre>` returns the
  seeded anime (add a genre-linked seed row if the fixture lacks one);
  unknown genre returns `200` with empty state; `?page=10001` returns `400`.
  Then implement `src/pages/search.astro` (validate → service → props,
  `InfraError` → `<ServiceUnavailable />` 503).
- [ ] A.2 Single-`h1` + SEO: real `h1` with filter context, title/meta,
  canonical; verify exactly one `h1` live.

## B. Verification, release & archive

- [ ] B.1 Full gate on the feature branch (`format` → `check` → `check:types`
  → `test` → `test:integration` → `test:e2e` → `build`).
- [ ] B.2 E2E additions (real stack): genre-exclusive row found, empty state
  for unknown genre, invalid page rejected, `h1` count on `/search`.
- [ ] B.3 Release on the branch (`bun run release:minor`), open PR, green CI,
  merge, push tag, then archive (sync delta into `openspec/specs/`).
