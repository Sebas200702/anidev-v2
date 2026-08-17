# Design — Standardize frontend flow

## Context

See `proposal.md` — Why. The app is Astro 6 SSR (`output: 'server'`) with
`@astrojs/react` (React 19) configured but unused, Tailwind v4 via
`@tailwindcss/vite`, `astro-font` for Nunito, and a single shared presentational
component (`Picture`, LQIP blur-up) plus a domain component (`AnimeDetails`)
following the directory-per-component + barrel convention. No `client:*`
hydration exists yet; `<ClientRouter />` (View Transitions) is enabled in
`base-layout.astro`. The `@hooks`/`@stores` aliases resolve to directories that
do not exist yet.

## Goals / Non-Goals

**Goals**
- Document, in `AGENTS.md`, a binding frontend strategy that all agents follow.
- Formalize Presentational-Container and the living/showcase docs so UI work
  ships with a visible, API-fed demo.
- Give the repo first-class, project-owned frontend skills.

**Non-Goals**
- No runtime code changes (no `.tsx`, no hydration, no showcase route yet).
- No new dependencies, no DB/cache/API changes.
- Not implementing the showcase page itself — that is a future feature change.

## Decisions

- **Rendering: zero-JS + islands on demand.** Default to static SSR `.astro`
  SFCs; hydrate a React island (`client:load`/`client:visible`) only when a
  control requires client interactivity, and prefer a `<form>` + API route for
  anything a form can do. Rationale: keeps Astro's performance and the Vercel
  serverless payload small; React is a tool, not the default.
  Alternatives: hydrating everything (rejected — heavier pages, no current
  consumer); pure SSG (rejected — future player/votes need islands).
- **Data flow stays one-way.** Pages are containers; components receive props.
  No component ever imports a service/client/repo.
- **Living docs = dynamic, API-fed.** `/showcase` consumes the domain service +
  API route (selecting by `?id=`/id route) so it reflects real data; `fixtures/`
  per domain only the bootstrap fallback. Container page fetches, presentational
  never does. Alternatives: static fixture-only demos (rejected — stale vs.
  the API reality the user asked for).
- **Two new skills vs one.** A thin `frontend` router skill plus a focused
  `presentational-container` skill. Router stays thin (like
  `development-lifecycle`), deferring craft to `impeccable`/`web-quality-audit`.
- **Ecosystem skills stay global.** `astro`, `impeccable`,
  `tailwind-css-patterns`, `web-quality-audit`, `webapp-testing` already exist
  at the user level; AGENTS.md lists them as "installed skill" rather than
  vendoring copies into the project.

## Risks / Trade-offs

- [Holistic "frontend skill" drift / bloat] → keep `frontend` a router; move
  depth into `presentational-container` and the global skills; trim if
  `AGENTS.md` and the skill duplicate each other.
- [Dynamic showcase needs API data to exist] → `fixtures/` fallback per domain
  keeps docs usable; a future feature implements the `/showcase` route.
- [Agents default all components astray] → the done-checklist in the skill and
  the Frontend & UI section act as the norm; VERIFY gate still runs.

## Migration Plan

Docs/tooling only. Ship on a `docs/frontend-flow-standardization` branch, pass
the gate, merge via PR; no release bump (docs-only commits → patch/minor
depends on commit set; no runtime delta, so skip `release:*`).

## Open Questions

None.