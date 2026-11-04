---
name: development-lifecycle
description: The mandatory lifecycle every agent follows for any task in this repo. Use when starting any work — feature, bugfix, refactor, or tooling. Routes every phase of Organic Driven Development (ODD): authorize, explore, classify, track-before-first-write, task-by-task implementation with TDD (Vitest), adversarial doubt review, verify gate, and the RDD review switch. When unsure which skill or phase applies on a task, use this one as the compass.
---

# Development Lifecycle — ODD + RDD

**This skill is a router, not the source of truth.** The binding rules (ODD steps, gate order, code style, commit convention, verification) live in `AGENTS.md` — read it first and obey it. This file points you to the right tool per phase. It must stay thin; if details start duplicating `AGENTS.md`, trim them.

This repo runs **Organic Driven Development (ODD)** — the el Gentleman orchestrator workflow — plus **RDD** (the user-owned review switch). Every request enters ODD automatically; there is no SPECIFY/PLAN ceremony to invoke.

```text
AUTHORIZE → EXPLORE → RESOLVE UNCERTAINTY → CLASSIFY → TRACK → IMPLEMENT → CLOSE
```

- **1 · AUTHORIZE — Scope.** Load `AGENTS.md`. Investigation/explanation/review requests stay read-only. Ambiguous change intent gets one clarification, then stop and wait.
- **2 · EXPLORE — Context.** Read the existing code and requirements proportionately before proposing or writing anything. If a feature is active, read its `odd/tasks/<feature>.md` through `## Log`, then the relevant `docs/specs/`. Load the domain/library skill the task names (e.g. `context7`, `better-auth-best-practices`). Heavy reading → delegate to `gentle-ai-explore`.
- **3 · RESOLVE UNCERTAINTY.** One focused user question per real product decision; at most one scoped read-only assumption challenge. Then stop and wait.
- **4 · CLASSIFY — Small vs large.** Resume test: could someone finish from the original request + `git diff` alone? Yes → **small** (inline, no tracking). No → **large** (tracked). File/test/fix count never decides size.
- **5 · TRACK — Large only, before the first write.** Create `odd/tasks/<feature>.md` (header; `## Specs` with `S#` quoting the user verbatim; `## Tasks`; `## Log` with `L1` = request verbatim), its Engram mirror, and the visible `todo` list — all before the first source write.
- **6 · IMPLEMENT — One task at a time, TDD.** Write the failing test first (Vitest, red → green → refactor), then commit the work-unit slice (~400 changed lines) with a Conventional Commit on a `type/<slug>` branch (never `master`); record the commit in the feature document. **Document what you touch**: JSDoc on new/changed public APIs (`@module` on files, `@param`/`@returns`/`@throws`/`@example` on functions, `@see` on barrels) — load `jsdoc-typescript-docs` and follow the JSDoc row in `AGENTS.md`.
- **7 · DOUBT — Adversarial review.** Re-review your change with fresh context via `doubt-driven-development` before marking a task done or opening a PR.
- **8 · VERIFY — Gate.** Run `bun run format → bun run check → bun run check:types → bun run test → bun run build` (exact rationale in AGENTS.md "Verification & Code Quality"). `astro sync` only after schema changes.
- **9 · RDD / RELEASE.** When the review switch is enabled (`gentle-ai review mode status`), high-risk candidates get an extra native review after implementation — **review evidence is review-only and never authorizes delivery** (`gentle-ai-rdd-defect-workflow`). Merge via PR; run the release on the feature branch *before* merging — `master` is protected (PR-only), so a `chore(release):` commit made after the merge would need a second throwaway branch/PR. `standard-version` (`bun run release:*`) bumps `package.json`, rewrites `CHANGELOG.md`, and tags `vX.Y.Z`; once the PR carries that commit and merges, push the tag (`git push origin vX.Y.Z`) to trigger CI build+deploy.

## When in doubt
- Which phase? This router. Which rule? `AGENTS.md`. Which doc? `context7` / `find-docs`. Which test? `test-driven-development`. Is it done? `doubt-driven-development` says no until reviewed — then the gate above decides.
