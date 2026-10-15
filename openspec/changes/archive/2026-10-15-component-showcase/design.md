## Context

See `proposal.md` — Why. The constraints that actually decide the architecture:

- **`.astro` components render only on the server.** There is no client-side
  re-render for them, so "change a prop and see it" is necessarily a server
  round-trip or a fragment fetch — not a component re-rendering in the browser.
- **No React.** Decided with the maintainer for this change: the playground uses no
  client framework. The precedent for client behavior without one already exists in
  the repo — `anime-carousel/script.ts` is a plain module imported by an `.astro`
  component.
- **D4 already says the URL is the state** for exploratory surfaces. A props
  playground is exactly that surface.
- Layering runs domain → shared: `src/shared/` must not import `src/domains/`, so a
  single central registry importing every component is unavailable.
- `AGENTS.md` names the route `src/pages/showcase.astro`; ≤150 lines per file; unit
  folders behind barrels; constants in dedicated modules; validate input at the
  boundary with Zod.
- Twelve components exist today; the detail page will roughly double that.
- Also decided with the maintainer: public with `noindex`, and an index plus
  `?component=<slug>` rather than one long page or a route per component.

## Goals / Non-Goals

**Goals:**

- Drive any prop of any component and see the real server-rendered result.
- Every state reproducible and shareable as a URL, including states that no record
  in the database actually has.
- Adding a component is one registry entry — no edit to the route.
- The showcase obeys the rules it documents, so it doubles as the reference
  container implementation.

**Non-Goals:**

- Editing *structure* — reordering children, composing slots visually. Controls
  drive props, not composition.
- Visual-regression snapshots. Separate concern, separate change.
- The axe-core pass over `/showcase` (D7) — needs the Playwright browser project.
- A Starlight page. D6 keeps them separate: UI here, prose there.
- Auto-deriving controls from the `Props` interface. TypeScript types do not exist
  at runtime; see decision 3.

## Decisions

### 1. Props live in the URL; re-render is a navigation

The playground's state is its query string:

```text
/showcase?component=anime-card&id=52991&title=Frieren&status=Not+yet+aired&score=
```

The route decodes it, composes the props, and Astro renders the component
server-side. Consequences that come for free: every state is a shareable link, the
back button is undo, and the rendered markup is **byte-identical to production**
because it is the same SSR path — not a re-implementation.

*Alternative — a render endpoint using Astro's Container API* (`astro/container`
does ship `experimental_AstroContainer` in the 6.1.2 we run): an island posts props
and swaps an HTML fragment. Faster-feeling and better isolated, but it puts an
API marked experimental on a production route, needs renderers registered by hand,
and renders the component through a second path that can drift from the real one.
Rejected for now; if the round-trip ever annoys, it is an additive change behind
the same URL contract.

### 2. Controls are a `<form method="get">`, enhanced by a plain script

The form's fields *are* the query parameters — submitting it produces exactly the
URL the playground reads. So the zero-JS path is not a degraded fallback, it is the
mechanism; the script only removes the click.

```text
src/shared/components/showcase/script.ts   → debounced input/change → navigate()
```

`navigate()` from `astro:transitions/client` (View Transitions is already enabled
in `base-layout`) swaps the page without a reload. The script follows the
carousel's shape: it returns a `destroy()` and re-initializes on
`astro:page-load`, so navigating between playgrounds does not stack listeners.

An explicit submit button stays in the markup for the no-JS path, and because a
visible "apply" is useful when typing into a JSON field.

### 3. Controls are declared, not inferred

There is no runtime type information for an `interface Props`, so controls are
descriptors on the entry:

```ts
type ShowcaseControl =
  | { name: string; label: string; kind: 'text' | 'number' | 'color'; default?: … }
  | { name: string; label: string; kind: 'boolean'; default?: boolean }
  | { name: string; label: string; kind: 'select'; options: string[]; default?: string }
  | { name: string; label: string; kind: 'json'; default?: unknown }
```

Writing five descriptors is the cost of a demo that actually drives the component.
The `json` kind covers structured props (a card's genre list) — parsed with
`safeParse`, falling back to the base value on malformed input, so a half-typed
array never breaks the page.

A generated Zod object schema (one field per descriptor) validates the query string
at the boundary; unknown parameters and unparseable values fall back to defaults.
That single schema is what makes "never error on a bad URL" a property of the
design rather than a pile of guards.

### 4. Props compose in three layers, in this order

```text
fixture  →  service record (?id=)  →  control values
```

The fixture is the floor, so a demo always renders. The service record is the real
data. Control values win last, which is what lets you take a live anime and force
`status = Not yet aired` — a state the record does not have and possibly no record
has. The view labels the base as `live` or `fixture`; a playground silently showing
a fixture would be worse than none.

Only props with a declared control participate in the third layer, so an
unmentioned prop always keeps its loaded value.

### 5. Presets are just URLs

A preset is a named prop combination rendered as a link to the URL it represents.
No state, no JS, and clicking one leaves everything editable — because it lands in
the same query string the controls write. `card-preview`'s four status states become
`AnimeCard` presets; `Button`'s five variants become its presets.

### 6. Entries are declared per owner, composed by the route

`src/shared/` cannot import `src/domains/`, so each owner declares its own list:

```text
src/shared/components/showcase/entries.ts   → shared component entries
src/domains/anime/showcase/entries.ts       → anime component entries
```

and `src/pages/showcase.astro` composes them. The page route is the only place that
knows every owner — which is where cross-domain composition belongs here.

Each entry names its loader (`load?`); the **route** executes it, inside a
`try/catch` that falls back to the fixture per entry. So an outage degrades one
playground, not the page, and the presentational-container rule still holds: no
component fetches anything.

*Alternative:* `import.meta.glob` auto-discovery — finds files, not the controls and
data a playground needs, and would silently list a component whose entry was never
written.

### 7. Fixtures live in the domain that owns the type

`src/domains/<domain>/fixtures/` holds them, typed as the domain types
(`AnimeCard`, `CarouselItem`, `AnimeDetails`). The compiler then fails when a
domain type changes and a fixture was not updated — the cheapest guard against
fixture rot.

### 8. Shell components are documented, not duplicated

`Header` and `Footer` are already on the page. Rendering them again would put two
`banner` and two `contentinfo` landmarks in one document — the exact defect this
page should catch, not create. Their entries carry `renderedByShell: true`: props
contract and controls list shown, with the page's own chrome as the live instance.

### 9. `noindex` on the page; `/showcase` in `publicRoutes`

One `<meta name="robots" content="noindex, nofollow">`. No layout prop until a
second page needs it. Gating on `NODE_ENV` was rejected with the maintainer: it
would hide the showcase in PR previews, where reviewing a component is most useful.

## Risks / Trade-offs

- **Every keystroke is a server round-trip** → debounced in the script, and local
  SSR of one component is milliseconds. If it ever bites, decision 1 leaves the
  fragment-endpoint upgrade open without changing the URL contract.
- **Control descriptors can drift from the real `Props`** → a wrong prop name shows
  up immediately as a control that changes nothing, and the props panel prints what
  was actually passed. Not compiler-enforced; accepted.
- **A component can be added without an entry** → nothing here detects that; it
  stays a review item. A check comparing the registry against the component
  directories is its own change.
- **The `json` control is a sharp edge** → malformed input falls back to the base
  value rather than erroring, and the panel shows the props actually used, so the
  failure is visible instead of silent.
- **A public showcase reveals the UI inventory** → accepted by the maintainer; the
  data is the public catalog and no previously private route is exposed.

## Open Questions

- Whether `/showcase` should also carry a "foundations" group for the tokens
  themselves (surfaces, the brand ramp, the type scale). Useful and separable —
  adding it later changes neither the registry contract, the route, nor the task
  breakdown.
