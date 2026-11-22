## Purpose

Keeps the build reproducible and the shipped artifact lean: pinned toolchain, frozen lockfile, dependency advisories gated in CI, no dev-only packages in the runtime image, and measured client-budget/dependency decisions.

## ADDED Requirements

### Requirement: Builds are reproducible from the lockfile

CI and the production image build SHALL install dependencies with the frozen lockfile, and the toolchain versions (Bun in CI, Docker runtime, and `engines`) SHALL remain aligned so a lockfile-resolved install never diverges from what CI verified.

#### Scenario: Frozen install catches drift

- **WHEN** `node_modules` or `package.json` no longer matches `bun.lock`
- **THEN** `bun install --frozen-lockfile` fails the pipeline instead of silently resolving newer versions

#### Scenario: Toolchain versions are aligned

- **WHEN** CI, the Dockerfile runtime stage, and `package.json` `engines` are compared
- **THEN** they pin compatible Bun versions with no unverified major drift

### Requirement: Dependency advisories gate the pipeline

CI SHALL run a dependency audit (`bun audit --audit-level=high`) and fail on high/critical advisories unless the finding is listed in a reviewable allowlist with its justification (e.g. unreachable build-only transitive).

#### Scenario: New high advisory fails CI

- **WHEN** a dependency upgrade introduces a new high-severity advisory not in the allowlist
- **THEN** the `gate` job fails and the PR cannot merge

#### Scenario: Allowlisted advisory is explicit

- **WHEN** an advisory is intentionally not fixed yet (e.g. framework upgrade blocked by adapter compatibility)
- **THEN** the allowlist records the package, advisory id, reachability analysis, and the tracking task

### Requirement: Runtime dependencies and images exclude development tooling

Packages used only by development, tests, or tooling (e.g. `pino-pretty`, `dotenv`, type packages) MUST live in `devDependencies`, and the production container image SHALL install runtime dependencies only.

#### Scenario: Production image has no dev dependencies

- **WHEN** the runtime image is inspected
- **THEN** it contains no test runners, formatters, or browsers from `devDependencies`

### Requirement: Dependency removals and replacements are evidence-based

Removing or replacing a dependency REQUIRES verifying every usage (imports, config, scripts, dynamic references) and recording the functional impact; replacements MUST prefer platform-native primitives (`Intl`, `fetch`, `node:*`) when they cover the need.

#### Scenario: Single-use date library is replaced

- **WHEN** a formatting dependency is used at exactly one call site
- **THEN** the replacement uses a platform primitive with equivalent output verified by a test, and the dependency is removed from `package.json` in the same task
