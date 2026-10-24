# Tasks — Watch progress client sync and E2E

> Follow-up of `relational-lists-and-watch-progress` (tasks 4.1 / 4.2).
> Specs (`specs/`) are written in the PLAN phase, before implementation.

## 1. Specify

- [ ] 1.1 Write the spec delta for the client sync (tick mirror, beacon flush,
      guest-to-account merge) and get it approved.

## 2. Client sync helper (TDD)

- [ ] 2.1 Failing unit tests with fake `localStorage` / `sendBeacon`: tick
      mirror, flush on `visibilitychange`, merge on login replays entries once.
- [ ] 2.2 Implement the helper and wire it to the player progress events from
      `resilient-playback-and-aniskip`.

## 3. E2E

- [ ] 3.1 `e2e/api/user-lists.spec.ts`: upsert, filter by status, delete with
      undo snapshot, unauthenticated mutation rejected.
- [ ] 3.2 `e2e/api/watch-progress.spec.ts`: stale write ignored, newer seek
      wins, `>= 90%` marks completed, *Continue Watching* collapses per anime.

## 4. Verify, release & archive

- [ ] 4.1 Full gate + `test:integration` + `test:e2e`, release on the branch,
      PR, merge, push tag, archive.
