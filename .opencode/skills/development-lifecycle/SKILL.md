---
name: development-lifecycle
description: The mandatory lifecycle every agent follows for any task in this repo. Use when starting any work — feature, bugfix, refactor, or tooling. Routes every phase: context read, OpenSpec SPECIFY/PLAN, task-by-task implementation with TDD (Vitest), adversarial review, verify gate, archive/release. When unsure which skill or phase applies on a task, use this one as the compass.
---

# Development Lifecycle

**This skill is a router, not the source of truth.** The binding rules (gate order, code style, commit convention, verification) live in `AGENTS.md` — read it first and obey it. This file points you to the right tool per phase. It must stay thin; if details start duplicating `AGENTS.md`, trim them.

```text
READ → SPECIFY → PLAN → IMPLEMENT → DOUBT → VERIFY → RELEASE
```

- **1 · READ — Context.** Load `AGENTS.md`. If a change is active, resolve it via `openspec status --change "<change>" --json` and read every `artifactPaths.*.existingOutputPaths` it returns (proposal, design, tasks, and any active delta specs) — honoring custom schemas and store-aware planning roots instead of assuming fixed paths. Also read committed `openspec/specs/` before implementation. Load the domain/library skill the task names (e.g. `context7`, `better-auth-best-practices`).
- **2 · SPECIFY — Define.** Via `openspec-propose` (proposal → design → specs delta → tasks). If requirements are vague, use `openspec-explore` first. Pure tools/docs/refactor → set `skip_specs: true` in the change's `.openspec.yaml`.
- **3 · PLAN — Order.** Work `tasks.md` one task at a time in dependency order. Never invent work outside the tasks; ask the user if ambiguous.
- **4 · IMPLEMENT — One task at a time, TDD.** Via `openspec-apply-change`. Write the failing test first (Vitest, red → green → refactor), then commit the task with a Conventional Commit on a `type/<slug>` branch (never `master`). **Document what you touch**: JSDoc on new/changed public APIs (`@module` on files, `@param`/`@returns`/`@throws`/`@example` on functions, `@see` on barrels), in the repo's style — load `jsdoc-typescript-docs` and follow the JSDoc row in `AGENTS.md`.
- **5 · DOUBT — Adversarial review.** Re-review your change with fresh context via `doubt-driven-development` before marking a task done or opening a PR.
- **6 · VERIFY — Gate.** Run `bun run format → bun run astro sync → bun run check → bun run check:types → bun run test → bun run build` (exact rationale in AGENTS.md "Verification & Code Quality").
- **7 · ARCHIVE / RELEASE.** Merge via PR; then `openspec-archive-change` to sync deltas into `openspec/specs/`. Releases follow SemVer by Conventional Commits via `bun run release:*`. **Run the release on the feature branch *before* merging** — `master` is protected (PR-only, no direct push), so a `chore(release):` commit made after the merge would need a second throwaway branch/PR. `standard-version` bumps `package.json`, rewrites `CHANGELOG.md`, and tags `vX.Y.Z`; once the PR carries that commit and merges, push the tag (`git push origin vX.Y.Z`, not restricted) to trigger CI to build+deploy the Docker image tagged `:<version>` (see AGENTS.md "Releases & Versioning").

## When in doubt
- Which phase? This router. Which rule? `AGENTS.md`. Which doc? `context7` / `find-docs`. Which test? `test-driven-development`. Is it done? `doubt-driven-development` says no until reviewed — then the gate above says the projector.