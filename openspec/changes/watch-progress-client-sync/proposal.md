## Why

`relational-lists-and-watch-progress` shipped the server side of lists and
watch progress (`/api/user/lists`, `/api/user/watch-progress`, the
`isNewerOrBetter` reconciliation and the collapsed *Continue Watching* query),
but deferred two pieces that need a running player and a real browser:

- the client persistence layer that keeps progress when a tab closes abruptly;
- the end-to-end proof of the list and progress flows over the real stack.

Without the client layer, progress written between server flushes is lost, and
without E2E the cross-layer wiring (auth cookie, CSRF origin check, response
wrapper) of those endpoints is only covered by unit tests.

## What Changes

- **Client progress sync helper** — synchronous `localStorage` mirror on every
  progress tick, flush through `navigator.sendBeacon` on `visibilitychange` /
  `pagehide`, and a one-shot guest-to-account merge on login that replays the
  local entries through `PUT /api/user/watch-progress` (the server keeps the
  `isNewerOrBetter` decision).
- **E2E specs (`e2e/api/`)** — list CRUD with the undo snapshot, `>= 90%`
  completion, and *Continue Watching* collapsing to one entry per anime.

## Dependencies

- The helper is consumed by the player from `resilient-playback-and-aniskip`;
  implement it once that change exposes its progress events, to avoid two
  sources of truth for the playback position.

## Impact

- New client module under `src/domains/user/` (or `src/shared/stores/` if more
  than one island consumes it), plus Vitest unit tests with a fake
  `localStorage` / `sendBeacon`.
- New `e2e/api/user-lists.spec.ts` and `e2e/api/watch-progress.spec.ts` using
  the authenticated fixture in `e2e/fixtures/auth.ts`.
- No schema or API contract changes.
