---
name: frontend
description: The global frontend workflow for this repo — rendering strategy (zero-JS + islands on demand), component composition, data flow from services to pages, styling conventions, accessibility, and living component documentation. Use for ANY UI work: building or editing Astro components, pages, layouts, styles, or client islands. Routes you to the right sub-skill per phase (impeccable for design craft, presentational-container for component structure, web-quality-audit / webapp-testing for verification).
lifecycle-phase: PLAN / IMPLEMENT / DOUBT
---

# Frontend Flow — zero-JS by default, islands on demand

This skill is the **frontend router**. The binding rules for architecture and
code style live in `AGENTS.md` (sections "Architecture · Presentational-Container"
and "Frontend & UI"); design craft lives in the **impeccable** skill; component
composition in **presentational-container**. Read those before writing UI.

**The pivotal rule: the UI renders off the data flows the backend already built.**
Pages are **containers** that call a domain service and pass plain data as
props to **presentational** components. Components never fetch. If you catch a
component importing a service/repository/client, move that fetch up into the
page route.

## 1. Rendering strategy — zero-JS + islands on demand

- **Default: every component is a static, SSR-rendered `.astro` SFC.** Zero client
  JS. No `client:*` directive unless the interaction genuinely needs JS.
- **Islands only when necessary** (`@astrojs/react`, React 19). Add a `client:load`
  / `client:visible` only after proving it — a track player, a live vote, a
  toggling panel. Not "just in case".
- Keep the browser payload minimal: prefer a `<form>` + API route (progressive
  enhancement) over a React island for anything a form can do.
- **View Transitions** (`<ClientRouter />`) is already enabled in
  `base-layout.astro` — use it for page transitions; do not hand-roll client-side
  page swaps.

## 2. Page → data flow (containers)

Page routes in `src/pages/` own service data for rendered UI and pass it to
presentational components. API routes may call services to produce API
responses. Page route pattern (see `src/pages/anime/[malId]/[slug].astro`):

1. Validate `Astro.params` / `Astro.url`; on bad input
   `return Astro.redirect('/404')`.
2. `const data = await service.getX(...)`; on `undefined`/`null` → redirect.
3. Build `metadata` (`{ title, imageUrl, description, url }`) and pass it to
   `<Base {...metadata}>` from `@layouts/base-layout.astro`.
4. Render presentational components with the data as props.

## 3. Component structure — see `presentational-container`

- Presentational components live in `src/domains/*/components/`; shared ones in
  `src/shared/components/`. **One directory per component**: `Name/Name.astro` +
  `index.ts` barrel (export named `Name`, `@module` JSDoc).
- Props: `interface Props` in the frontmatter and destructure immediately.
  Boolean props use `is*`/`has*` prefix. Optional props use `?`. Props are plain,
  serializable data — never a `null`, never derived from a store.
- Two categories: **display** widgets (render a domain type they receive) and
  **interactive** widgets (roll a client island — mount with a `client:*`
  directive).

## 4. Styling & design rules

- Load **impeccable** for anything that touches visual design, layout, motion or
  UX copy; follow its routing. It governs typography, tokens, color and layout
  decisions in this repo.
- **Tailwind v4 only.** No inline `<style>` blocks inside components; `@apply`
  is allowed only for shared global utility classes in
  `src/styles/global.css`, while component styles compose utilities directly
  and avoid `@apply`. Color exclusively from `@theme` tokens (`brand` scale,
  `neutral` scale) — never raw hex inside a component.
- Accessibility first: semantic HTML, ARIA when the element is not semantic,
  `focus-visible`, contrast ≥ 4.5:1, `prefers-reduced-motion`. Preload the LCP
  image; use `Picture` (LQIP blur-up) with `aspect-*` and explicit sizes on
  banners.

## 5. Living documentation — `/showcase`

Components are not only JSDoc-commented — they are *driven*. `/showcase` is a
props playground: `?component=<slug>` renders one component isolated, next to a
control for every prop its entry declares, and the prop state lives in the URL
(shareable link, back button as undo).

- **Register, don't edit the route**: add an entry to your owner's list
  (`src/shared/components/showcase/entries*.ts` or
  `src/domains/<d>/showcase/entries.ts`). The page route composes the owners.
- **Controls are declared** (`text`/`number`/`color`/`boolean`/`select`/`json`);
  a name may be a dot path (`anime.status`) since components take one object prop.
- **Real data first**: `load` pulls from the same service a production page uses
  (`?id=` selects the record); `fixtures/` per domain are the fallback when the
  service yields nothing or a dependency is down. Control values apply on top, so
  any state can be forced. The panel labels the base `live` or `fixture`.
- **The route fetches, never the component.**
- **No client framework**: controls are a `<form method="get">` that works with JS
  disabled; a plain script debounces and navigates via `astro:transitions/client`.
- A component ships its entry (controls + presets) in the same task that creates
  it. Components the shell renders are declared `renderedByShell`.

## 6. Done checklist — UI

- [ ] Components never fetch; pages do.
- [ ] No `client:*` unless the interaction requires JS.
- [ ] Own directory + barrel export per component.
- [ ] Showcase entry added: controls per prop, presets, `load` from the domain
      service, `fixtures/` fallback.
- [ ] Tokens only for color; no `<style>` blocks.
- [ ] Contrast, focus-visible, reduced-motion covered.
- [ ] Gate: `bun run format → bun run check → bun run check:types → bun run test → bun run build`; `web-quality-audit` on new pages.

## When in doubt
Design craft: **impeccable**. Component structure: **presentational-container**.
Page quality: **web-quality-audit** / **webapp-testing**. Router: this skill.
