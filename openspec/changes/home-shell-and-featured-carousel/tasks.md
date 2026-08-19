# Tasks — Home shell and featured carousel

> Documented retroactively: the implementation landed in a working session before
> these artifacts existed. Boxes are checked against code that is present in the
> working tree, not against work still to do.

## 1. Design tokens

- [x] 1.1 Add the swappable brand ramp (`--brand-50` … `--brand-950`, `--on-brand`) on `:root` in `src/styles/global.css`, with a comment naming it the single source of accent truth.
- [x] 1.2 Convert `@theme` → `@theme static` and add the semantic tokens: surfaces (`surface`, `surface-raised`, `surface-overlay`), foregrounds (`on-surface`, `on-surface-muted`, `on-surface-subtle`), `border`/`border-strong`, `focus`, feedback (`success`, `warning`, `danger`).
- [x] 1.3 Add the editorial role aliases (`editorial-accent`, `editorial-muted`, `editorial-surface`, `editorial-border`) mapped onto brand/neutral steps — aliases, not new colors.
- [x] 1.4 Add the font tokens `--font-heading` (Nunito) and `--font-body` (Inter).
- [x] 1.5 Move `color-scheme: dark` from `*` to `:root` and add the `.light` block overriding every semantic token (including the light feedback triad).
- [x] 1.6 Replace the two legacy `.button-*` classes with the five pill variants (primary, secondary, tertiary, ghost, destructive), each with hover / active / disabled states.
- [x] 1.7 Add the `prefers-reduced-motion: reduce` block neutralizing animation, transition, and smooth scrolling.
- [x] 1.8 Order `.custom-scrollbar` / `.no-scrollbar` before `.light` so the themed scrollbar override does not trip Biome's `noDescendingSpecificity`.

## 2. App shell

- [x] 2.1 Rewrite the `#app` grid as three rows (`header / main / footer`), drop the `aside` column and the mobile reflow, and set `font-family: var(--font-body)`.
- [x] 2.2 Add `src/shared/components/button/{button.astro,types.ts,index.ts}` — `.astro`, `ButtonProps` with an `Icon` component prop and a `variant` union bound 1:1 to the global classes.
- [x] 2.3 Add `src/shared/components/overlay/{overlay.astro,gradient.ts,types.ts,index.ts}` with `resolveOverlayGradient` mapping token names (`surface`, `surface/60`) to CSS values.
- [x] 2.4 Add `src/shared/components/logos/{isotipo.astro,index.ts}`.
- [x] 2.5 Add `src/shared/components/header/header.astro` — utility strip (issue date, tagline, status dot + version, languages) and main bar (brand + studio line, nav with counters, search / login / sign-up actions).
- [x] 2.6 Add `src/shared/components/footer/footer.astro` — brand line, section links with the hover corner bracket, social actions, attribution strip.
- [x] 2.7 Add `src/shared/components/toolbar/{toolbar.tsx,use-toolbar.ts,use-handle-click-outside.ts,index.ts}` — the single island; scroll-to-top targets the shell's `#app` container with a window fallback.
- [x] 2.8 Extend `Picture` with `width` / `height` / `aspectRatio` / `sizing`, extract `types.ts`, skip the placeholder layer when both sources are equal, and fade it out on load.
- [x] 2.9 Wire `base-layout.astro`: Header → Toolbar (`client:load`) → `main` → Footer, and preload Nunito + Inter via `astro-font`.
- [x] 2.10 Export everything from the `@shared/components` barrel with `@module` JSDoc noting which entries are islands.

## 3. Carousel slice — data

- [x] 3.1 Add the `CAROUSEL_*` constants to `@anime/constants` (`CAROUSEL_REQUIRED_MEDIA_TYPES`, `CAROUSEL_SLIDE_LIMIT`, `CAROUSEL_SOURCE_PRIORITY`).
- [x] 3.2 Add `types/anime-carousel.d-types.ts` (`CarouselItem`, its genre shape) and export it from the domain `types` barrel.
- [x] 3.3 Add `repositories/anime-carousel/` — `getTopPopularWithMedia(limit)`: intersect the required-asset id sets from `anime_media`, then select those anime ordered by `popularity_rank`, wrapped in `dbError`.
- [x] 3.4 Add `mappers/anime-carousel/` — `pickBestAsset` (source-priority pick with a fallback) and `mapCarouselItem` (proxied media URLs, empty string for missing artwork, `?? 0` / `'Unknown'` defaults, `/discover?genre=` links).
- [x] 3.5 Add `cache/anime-carousel/` — one global key `anime:list:carousel` at `CacheTtl.Medium`.
- [x] 3.6 Add `services/anime-carousel/` — `withCache` over the repository, fanning out to the **media service** `getAnimeMedia` and `animeTaxonomyRepository.getGenresByAnimeId` with `Promise.all`, then delegating to the mapper.
- [x] 3.7 Add `schemas/anime-carousel-schema.ts` — the slide schema, the response envelope, and the (empty) request schema.
- [x] 3.8 Re-export each unit from its layer barrel (`cache`, `mappers`, `repositories`, `schemas`, `services`, `types`).

## 4. Carousel slice — surface

- [x] 4.1 Add `GET /api/anime/carousel` composing `withZodValidation(...)(withErrorHandling(..., { responseSchema }))`, documented with its status/code table.
- [x] 4.2 Add `components/anime-carousel/` — `anime-carousel.astro` (all slides server-rendered, first one visible, prev/next + dot tablist), `consts.ts` (ids, dot classes, getters, autoplay cadence), `types.ts`, `index.ts`.
- [x] 4.3 Add `components/anime-carousel/carousel-item/` — banner behind three token-driven `Overlay` scrims, kicker, genre links, clear logo, score/year meta, bracketed ID/season strip, action buttons.
- [x] 4.4 Add `script.ts` — `initCarousel` returning `{ goToSlide, nextSlide, prevSlide, destroy }`; autoplay only when `total > 1` and motion is not reduced; `destroy()` clears the interval and removes every listener; the component re-initializes on `astro:page-load`.
- [x] 4.5 Add `components/anime-card/` — editorial poster card taking an `AnimeCard` prop, with the kicker hairline, corner brackets, and a status dot that pulses only while airing.
- [x] 4.6 Add `src/shared/utils/get-status-color/` — `getStatusColor` (token name) and `getStatusDotClass` (literal class from a table, because interpolated classes are never emitted).
- [x] 4.7 Rewrite `src/pages/index.astro` as the container: `Promise.all` over the carousel service and the anime-list service, render the hero only when slides exist, pass everything down as props.
- [x] 4.8 Add `src/pages/card-preview.astro` — fixture harness covering airing / finished / unrated / not-yet-aired card states.

## 5. Dependencies and local stack

- [x] 5.1 Add `@tabler/icons-react` and `@formkit/tempo` to `dependencies`.
- [x] 5.2 Pin Dragonfly's `--proactor_threads=2 --maxmemory=512mb --cache_mode=true` in `docker-compose.yml`, with a comment explaining the 256 MiB-per-io-thread reservation.
- [x] 5.3 Verify the local stack end to end: `docker compose up -d` → `bun run db:migrate` → `bun run db:seed:e2e` → dev server → smoke every route.

## 6. Tests

- [x] 6.1 Add `src/domains/anime/__tests__/mappers/anime-carousel.test.ts` covering source priority, fallback when no preferred source matches, missing artwork → empty string, null numerics → defaults, and genre link construction (mocking `@media/mappers/media-url` and `@media/mappers/media-assets`).
- [ ] 6.2 Add a service-level unit test for `getCarouselItems` — cache hit path, empty-eligibility short-circuit, and the media/genre fan-out shape.
- [ ] 6.3 Add an E2E check that `/` renders the hero when eligible anime exist and omits it cleanly when they do not.

## 7. Design canvas — anime detail page

- [x] 7.1 Draft the three artboards (desktop 1440, mobile 390, component kit) from the v1 references treated as a content inventory, not a layout to copy.
- [x] 7.2 Restyle the canvas onto the shipped system: resolved token hexes, Nunito/Inter, the five pill variants, hairline kickers, corner brackets, `#Genre` links, status dots, the real masthead and footer, the real isotipo SVG.
- [x] 7.3 Record the accent decision in the canvas annotations with the measured contrast ratios.
- [ ] 7.4 Turn the canvas into an OpenSpec change for the anime detail page (ROADMAP Fase 1) — not part of this change.

## 8. Verification gate

- [x] 8.1 `bun run format`
- [x] 8.2 `bun run check` — Biome lint + format check
- [x] 8.3 `bun run check:types` — `astro check`
- [x] 8.4 `bun run test` — Vitest
- [x] 8.5 `bun run build`
- [ ] 8.6 `bun run test:e2e:install` + `bun run test:e2e` (Chromium not installed locally; runs in CI).

## 9. Release

- [x] 9.1 Move the superseded `.design/` canvas draft out of the repo (it was the only source of Biome errors: 26 a11y/unused-variable findings in `Main.dc.html`).
- [ ] 9.2 Decide the fate of the remaining untracked leftovers: `install.log` (an unrelated spicetify log dropped in the repo root) and `references/` (the v1 screenshots — commit, or add to `.gitignore`).
- [x] 9.3 Branch `feat/home-shell-and-featured-carousel` off `master` and commit per task group with Conventional Commits (`master` is protected — no direct push).
- [x] 9.4 Update `ROADMAP.md`: check off Fase 1 "Homepage — héroe + carruseles SSR".
- [ ] 9.5 Run `bun run release` on the feature branch so the PR carries the version bump, then open the PR against `master`.
- [ ] 9.6 Archive this change (`openspec-archive-change`) once merged, syncing the four deltas into `openspec/specs/`.
