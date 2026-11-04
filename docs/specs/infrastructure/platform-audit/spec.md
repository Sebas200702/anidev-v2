## Purpose

Keeps OpenSpec, the code, and the verification layers telling the same story: every high finding has evidence and a target task, merged changes close their books, shipped capabilities have committed specs, and the verification gates actually enforce their thresholds.

## ADDED Requirements

### Requirement: High-severity findings are traceable until mitigated

Every P0/P1 finding of a platform audit MUST be recorded with evidence (file, command, or live reproduction), a priority, and a target task in an OpenSpec change; a finding is closed only when its fix is merged and its verification test exists.

#### Scenario: Privacy leak finding lifecycle

- **WHEN** a P1 finding (e.g. anonymous profile reads exposing private sections) is fixed
- **THEN** the change contains the regression test that fails without the fix, and the archived record links finding → task → test

### Requirement: OpenSpec state tracks reality

Task checkboxes in `openspec/changes/` MUST reflect the merged reality of the repository (\`master\`), stale boxes are corrected during audits, and a change whose work is merged is archived (deltas synced into \`openspec/specs/\`) instead of left open.

#### Scenario: Merged work is not left checked-out

- **WHEN** a change's implementation is merged and released
- **THEN** its remaining boxes are either completed, moved to a new change with an explicit pointer, or the change is archived

#### Scenario: Stale boxes are corrected with evidence

- **WHEN** an audit finds tasks marked incomplete whose work is verifiably in \`master\`
- **THEN** the boxes are checked and the evidence recorded in the audit artifacts

### Requirement: Shipped capabilities have committed specs

Every capability reachable in production (music catalog, media proxy, search history, and future additions) MUST have a committed spec under `openspec/specs/` describing its verified behavior; a capability without a spec is treated as an audit gap until specified.

#### Scenario: Music catalog is specified

- **WHEN** an operator lists `openspec/specs/`
- **THEN** the music list/detail read behavior and the media proxy behavior have committed spec files matching the shipped code

### Requirement: Verification gates enforce their thresholds

CI SHALL fail when coverage drops below the configured thresholds, when critical cross-layer journeys are untested, and when the regression tests attached to previously fixed P1 findings are removed or bypassed.

#### Scenario: Coverage floor is enforced

- **WHEN** the unit suite's statements coverage falls below the configured threshold
- **THEN** `test:coverage` exits non-zero and the pipeline fails

#### Scenario: Authorization regressions are caught end-to-end

- **WHEN** the privacy projection regresses (anonymous caller receives private sections)
- **THEN** the end-to-end suite fails on the owner/non-owner visibility assertions
