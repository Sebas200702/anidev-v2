## Why

The repo has no defined frontend flow: `AGENTS.md` documents the backend/API
layer thoroughly (repositories, services, routes, auth, error handling) but the
UI layer exists only as half-applied presentational-component patterns with no
rendering strategy, no styling/accessibility/design rules, and no way to see
components in action. The frontend is the most important surface of the app and
needs a normative, documented workflow so every agent builds UI the same way.

## What Changes

- Add a **Frontend & UI** section in `AGENTS.md`: zero-JS + islands-on-demand
  rendering strategy, View Transitions, hooks/stores conventions, styling rules
  (Tailwind v4, tokens only), image patterns, accessibility targets, and design
  craft via the `impeccable` skill.
- Add a **Living documentation** rule: every presentational component gets a
  **dynamic** showcase demo on `/showcase` fed by the domain API/service
  (`fixtures/` per domain only as bootstrap fallback), plus JSDoc
  (`@module`/`@remarks`/`@see`/`@example`) and a typed `interface Props`.
- Create two repo skills:
  - `.opencode/skills/frontend/SKILL.md` — the frontend workflow router
    (render, composition, styling, living docs, done-checklist).
  - `.opencode/skills/presentational-container/SKILL.md` — the
    presentational/container separation for this repo.
- Register the available ecosystem skills (`astro`, `impeccable`,
  `tailwind-css-patterns`, `web-quality-audit`, `webapp-testing`,
  `jsdoc-typescript-docs`) in both the `AGENTS.md` Skills table and Skills
  list.
- Note the reserved `@hooks` (`src/shared/hooks/`) and `@stores`
  (`src/shared/stores/`) aliases in Path Aliases.

## Capabilities

### New Capabilities

None — this is a docs/tooling change (`skip_specs: true`).

### Modified Capabilities

None — no runtime behavior changes; no spec deltas.

## Impact

- **Docs**: `AGENTS.md` (Architecture / Frontend & UI, Living documentation,
  Skills & Key Guidelines, Path Aliases).
- **Tooling**: two new skills under `.opencode/skills/` (frontend,
  presentational-container).
- **No runtime code affected**; no dependencies added; no API/db/cache changes.
