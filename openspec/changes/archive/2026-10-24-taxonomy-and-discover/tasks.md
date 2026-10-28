# Tasks — taxonomy browsing (`/search`)

> TDD-first: failing test/route assertion before implementation. In dependency
> order; do not start a later phase before its predecessor passes its gate.

## A. Route (TDD)

- [x] A.1 Failing test first: `GET /search?genre=<seeded-genre>` returns the
  seeded anime (add a genre-linked seed row if the fixture lacks one);
  unknown genre returns `200` with empty state; `?page=10001` returns `400`.
  Then implement `src/pages/search.astro` (validate → service → props,
  `InfraError` → `<ServiceUnavailable />` 503).
- [x] A.2 Single-`h1` + SEO: real `h1` with filter context, title/meta,
  canonical; verify exactly one `h1` live.

## B. Verification, release & archive

- [x] B.1 Full gate on the feature branch (`format` → `check` → `check:types`
  → `test` → `test:integration` → `test:e2e` → `build`).
- [x] B.2 E2E additions (real stack): genre-exclusive row found, empty state
  for unknown genre, invalid page rejected, `h1` count on `/search`.
- [x] B.3 Release on the branch (`bun run release:minor`), open PR, green CI,
  merge, push tag, then archive (sync delta into `openspec/specs/`).

> Cerrado 2026-10-24: implementado y mergeado en #112 (release `0.10.0`);
> `e2e/api/search.spec.ts` cubre género exclusivo, vacío, página 400 y un `h1`.
