## Why

`AGENTS.md` and the `frontend` skill both require that every presentational
component ship a **live demo** on `/showcase`, and both phrase it as a promise
("when `src/pages/showcase.astro` is available") because the route does not exist.
ROADMAP Fase 0 still lists it as the open living-docs item, and D6 already settled
the approach (dynamic, API-fed; Storybook rejected because it cannot render
`.astro`).

The debt just grew. `home-shell-and-featured-carousel` added eleven presentational
components and none of them could get the demo the rule asks for; the anime detail
page will add roughly as many again.

But a gallery of fixed screenshots is not what makes this worth building. The
value is being able to **drive a component** — change its title, flip its status,
empty its score, stretch its text, swap its variant — and see what the real
server-rendered component does. That is what `/card-preview` could not do: one
page, hardcoded fixtures, one component, no controls.

## What Changes

**`/showcase` becomes a props playground, not a catalog**

- `/showcase` lists every registered component grouped by owner, each linking to
  its own playground.
- `/showcase?component=<slug>` renders that component alone, next to **editable
  controls for every prop it declares** — text, number, boolean, select, color,
  and a JSON field for structured props.
- Changing a control re-renders the component with the new props. **Prop state
  lives in the URL**, so any combination is a shareable, reproducible link and the
  back button is history.
- **Presets**: each entry declares named prop combinations (a card's airing /
  finished / unrated / not-yet-aired states, a button's five variants) as links
  that load into the playground and can then be edited further.

**Real data underneath the controls**

- A playground's base props come from the same domain service a production page
  would use, selected with `?id=`. Control values are applied **on top** of that
  record, so you can take a live anime and force any state.
- Per-domain `fixtures/` are the fallback when the service yields nothing — an
  empty catalog, no record selected, or a dependency outage — and the view states
  which of the two it is showing.

**No React, no client framework**

- The controls are a `<form method="get">`: the playground works fully with
  JavaScript disabled. A plain page script (the pattern `anime-carousel/script.ts`
  already uses) debounces control changes and re-renders through
  `astro:transitions/client`, so editing feels live without an island.

**A component registry**

- Each owner declares its own entries — slug, title, component, controls, presets,
  and how to load its data. Registering a component is the single step that adds
  it to the showcase; the route never grows a per-component branch.

**Showcase entries for what already exists**

- The eleven components from the previous change, plus `ServiceUnavailable` and the
  `AnimeDetails` stub, get entries in this change.

**Removals**

- `src/pages/card-preview.astro` is deleted; its four card states become presets.

## Capabilities

### New Capabilities

- `frontend/component-showcase`: the living-documentation surface — how components
  are registered, how a playground's props are composed (service record, then
  control overrides, with a fixture fallback), how prop state is carried and
  validated, the no-JavaScript floor for the controls, and the route's visibility
  rules.

### Modified Capabilities

None. The showcase reads existing services through existing contracts and changes
no domain behavior. The presentational-container rule it enforces is already
specified in the archived `standardize-frontend-flow`.

## Impact

- **New**: `src/pages/showcase.astro`, the showcase's own UI components (index,
  playground, controls, props panel) with their control-descriptor types and
  URL-decoding schema, per-owner entry lists, and `fixtures/` under each domain.
- **Removed**: `src/pages/card-preview.astro`.
- **Config**: `/showcase` added to `publicRoutes` (`src/config/public-routes.ts`).
- **Client JS**: one plain page script for the debounced re-render. **No React
  island, no new dependency.**
- **Docs**: `AGENTS.md` and `.opencode/skills/frontend/SKILL.md` drop the "when the
  showcase is available" conditional; `ROADMAP.md` Fase 0 living-docs item.
- **No DB migration. No new API route.** Demos consume the services page routes
  already use.
- **Follow-up, not here**: the axe-core pass over `/showcase` that D7 specifies —
  it needs the Playwright browser project, so it rides with a testing change.
