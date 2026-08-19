# Tasks — Component showcase (props playground)

## 1. Entry and control contract

- [x] 1.1 Add `src/shared/components/showcase/types.ts` — `ShowcaseControl` (the `text` / `number` / `color` / `boolean` / `select` / `json` kinds), `ShowcasePreset`, `ShowcaseEntry` (slug, title, owner, component, controls, presets, `load?`, `renderedByShell?`), `ShowcaseLoadOptions`.
- [x] 1.2 Add `src/shared/components/showcase/constants.ts` — owner group order and labels, the debounce interval, the query-parameter names reserved by the route (`component`, `id`, `preset`).
- [x] 1.3 TDD: failing test first for `buildControlSchema(controls)` — one Zod field per descriptor, unknown parameters dropped, unparseable value → the control's default, malformed `json` → `undefined` (so the base value survives). Then implement it in `control-schema.ts`.
- [x] 1.4 TDD: failing test first for `resolveShowcaseProps({ fixture, record, controlValues })` — the three-layer merge in order, only controlled props overridden, and `source` reported as `live` or `fixture`. Then implement it in `resolve-props.ts`.

## 2. Showcase UI

- [x] 2.1 Add `showcase-index.astro` — entries grouped by owner in the configured order, each linking to `?component=<slug>`, flagging shell-rendered entries.
- [x] 2.2 Add `showcase-controls.astro` — the `<form method="get">`: a hidden `component` field, one labelled control per descriptor with its current value, a submit button, and a reset link to the bare playground URL. Every control gets a programmatically associated label.
- [x] 2.3 Add `showcase-presets.astro` — presets as links to the URL each one represents, marking the active one.
- [x] 2.4 Add `showcase-props.astro` — the resolved props panel plus the `live` / `fixture` source badge.
- [x] 2.5 Add `showcase-stage.astro` — the isolated render surface: `<entry.component {...props} />`, or the props-contract-only view when `renderedByShell` is set.
- [x] 2.6 Add `script.ts` — debounced `input`/`change` on the form → `navigate()` from `astro:transitions/client`; returns `destroy()` and re-initializes on `astro:page-load`, mirroring `anime-carousel/script.ts`. No framework.
- [x] 2.7 Barrel + `@module` JSDoc; every file under 150 lines.

## 3. Route

- [x] 3.1 Add `src/pages/showcase.astro` — compose the owner entry lists, resolve `?component=`, build the control schema, `safeParse` the query, run `load` in `try/catch` with the fixture fallback, merge, render index or playground.
- [x] 3.2 Not-found outcome for an unregistered slug.
- [x] 3.3 `<meta name="robots" content="noindex, nofollow">`.
- [x] 3.4 Add `/showcase` to `publicRoutes`, update that module's JSDoc, extend the existing `public-routes` test.

## 4. Shared entries

- [x] 4.1 `Button` — presets for the five variants; controls for `title`, `variant` (select), `disabled`, `isLoading`, `fullWidth`, `ariaLabel`.
- [x] 4.2 `Overlay` — controls for `direction` (select), `fromColor`, `viaColor`, `viaInterval`, `toColor`, rendered over a sample image so the scrim is visible.
- [x] 4.3 `Picture` — controls for `imageUrl`, `smallImageUrl`, `aspectRatio`, `sizing` (select), `isBanner`; presets for "with LQIP placeholder" and "same source (no placeholder)".
- [x] 4.4 `Isotipo` (size control), `ServiceUnavailable` (title / message / retry href).
- [x] 4.5 `Header` and `Footer` as `renderedByShell: true` — props contract only, no duplicate landmarks.
- [x] 4.6 `Toolbar` — document that it is the shell's island and is already live on the page; no second hydrated instance.

## 5. Anime entries and fixtures

- [x] 5.1 Add `src/domains/anime/fixtures/` — typed `AnimeCard`, `CarouselItem`, `AnimeDetails` payloads.
- [x] 5.2 `AnimeCard` entry — `load` from `animeListService` honoring `?id=`; presets for airing / finished / unrated / not-yet-aired (carried over from `card-preview`); controls for `title`, `status` (select), `score`, `year`, `type`, `imageUrl`.
- [x] 5.3 `AnimeCarousel` and `CarouselItem` entries — `load` from `animeCarouselService`; controls for `title`, `description`, `score`, `year`, `season`, and `genres` as a `json` control.
- [x] 5.4 `AnimeDetails` entry — `load` from `animeService.getAnimeDetails` honoring `?id=`.
- [x] 5.5 Barrel fixtures and entries; verify no component imports a fixture.

## 6. Remove the stopgap

- [x] 6.1 Delete `src/pages/card-preview.astro`.
- [x] 6.2 Grep for references (docs, comments, JSDoc `@see`) and point them at `/showcase`.

## 7. Docs

- [x] 7.1 `AGENTS.md` — drop the "when `src/pages/showcase.astro` is available" conditional in "Living documentation" and in the Skills table; state that a component ships its playground entry (controls + presets) in the same task that creates it.
- [x] 7.2 `.opencode/skills/frontend/SKILL.md` — same de-conditionalizing in section 5 and the done-checklist.
- [x] 7.3 `ROADMAP.md` — leave the Fase 0 living-docs item `[ ]` until this change is archived, per the document's own convention.

## 8. Verification

- [x] 8.1 Gate: `bun run format` → `bun run check` → `bun run check:types` → `bun run test` → `bun run build`.
- [x] 8.2 Manual pass with the local stack up: every entry renders; changing each control kind re-renders correctly; `?id=` reaches the loader; a preset then an edit keeps the rest of the preset; a garbage query value falls back to its default; back button restores the previous state.
- [x] 8.3 Disable JavaScript and confirm the form still drives every control.
- [x] 8.4 Stop the database and confirm every playground falls back to its fixture with the `fixture` badge.
- [x] 8.5 Landmark and label pass on `/showcase`: one `banner` (the page's own `<header>` sits inside `<main>`, so it is not a second banner), one `contentinfo`, every control labelled.
- [ ] 8.6 **Pre-existing defect found, not fixed here**: `header.astro` marks the brand as `<h1>AniDev</h1>`, so *every* page in the app carries a second `<h1>` alongside its own title. Fixing it means demoting the brand to a `<p>` **and** giving the home page a real `<h1>` (it has none today) — a homepage content decision that belongs to its own change, not to this one.

## 9. Release

- [ ] 9.1 Branch `feat/component-showcase` off `master`, Conventional Commits per task group.
- [ ] 9.2 Gate green, then `bun run release:minor` on the branch so the PR carries the bump (standard-version lowers `feat` to a patch while the version is `0.x`).
- [ ] 9.3 Open the PR against `master`; push the tag after merge.
- [ ] 9.4 Archive the change, then flip the ROADMAP Fase 0 living-docs item to `[x]`.
