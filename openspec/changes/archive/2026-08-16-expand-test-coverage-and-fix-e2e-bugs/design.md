## Context

See proposal.md — Why. The change is a test-coverage campaign over the existing
three-layer pyramid (unit → integration → E2E) plus two small robustness fixes
the campaign surfaced. No new dependencies, no data-model changes, no new
architecture.

## Goals / Non-Goals

**Goals:**
- Close the coverage gaps the E2E harness revealed (anime, music, user, search,
  media, shared utils, API routes).
- Fix the two 500s so valid behaviors keep their contracts and invalid input
  fails fast as a 4xx.
- Make the new user specs safe on any local DB state (drift-aware) while still
  validating on a fresh CI DB.

**Non-Goals:**
- No new endpoints, schemas, or DB columns.
- No full spec-sync of the anime/music domains into `openspec/specs/` (out of
  scope — a separate documentation effort).
- No branch-protection or CI workflow changes.

## Decisions

- **`mapExternalIds` guards `undefined` at the top and returns `[]`.** The
  repository contract is "no row → `undefined`", so the mapper treats absence as
  "no external identifiers" rather than throwing. Alternative (throwing a typed
  `notFound`) was rejected: the full-detail endpoint legitimately serves anime
  without external-ids rows, so an empty list is the correct payload, not an
  error.
- **`getMusicSchema` validates the id with a numeric regex on the raw string.**
  Rejected `z.coerce.number()`: it would change the downstream type and broke a
  large valid id (`2147480000`) with an integer-range 500. Keeping the string +
  regex rejects non-numeric input as a `400` (Zod envelope) without touching the
  `Number(id)` call site, preserving the 404-not-found path.
- **Drift-aware user specs via column-type detection.** The user integration +
  E2E specs inspect `information_schema` for `profile.user_id`'s real type and
  skip with a clear message when it differs from the migration (`text`). This
  keeps local runs green on a desynced dev DB while asserting for real on a
  fresh CI DB. The drift itself is environmental (resolved with an `ALTER TABLE`),
  not code.
- **Vitest coverage excludes declaration/glue modules** (`*-types.ts`,
  `types/**`, Drizzle DDL schemas, env/DB/auth SDK binding) rather than chasing
  coverage on files with no testable runtime logic. Verified the suite still
  passes and coverage output reflects real logic.

## Risks / Trade-offs

- [The music id regex is `^\d+$`, rejecting e.g. negative or zero-padded ids that
  previously reached the DB] → those inputs are invalid for a music lookup; a 400
  is the correct envelope, and valid catalog ids are positive integers.
- [Drift-aware skips could mask a real regression locally] → the skip only fires
  when `profile.user_id` isn't `text`, which is precisely the drift case; on CI
  (fresh migrate) the specs always run.
- [Large untracked test batch increases gate runtime] → all specs stay in the
  existing Vitest/Playwright scopes; the gate order is unchanged.

## Migration Plan

None required — no schema, env, or deployable change. The two fixes ship with
the next normal release; they are backward-compatible for valid inputs.

## Open Questions

None.