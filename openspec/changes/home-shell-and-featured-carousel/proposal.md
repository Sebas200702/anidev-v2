## Why

The homepage was the last route with no design language: `global.css` carried two
legacy `.button-*` classes, a shell grid that reserved an 80px `aside` column
nobody rendered, and raw neutral scales used directly in markup. ROADMAP Fase 1
asks for a homepage with "héroe + carruseles SSR", and Fase 0 asks for a
documented, repeatable UI pattern — neither was possible without a token layer
and a real app shell first.

The visual system already existed: the maintainer had designed and built it in an
earlier checkout of this project (`anidev-v2-btrfs`). This change ports that work
into v2 under v2's conventions instead of re-inventing it, and delivers the first
feature that consumes it — the featured-anime carousel.

Documented retroactively: the implementation landed during a working session and
these artifacts record the delivered behavior, the decisions taken, and the
verification run.

## What Changes

**Design system (`src/styles/global.css`)**

- Add a swappable brand ramp (`--brand-50` … `--brand-950`, `--on-brand`) on
  `:root` as the single source of accent truth.
- Add semantic tokens under `@theme static` — surfaces (`surface`,
  `surface-raised`, `surface-overlay`), foregrounds (`on-surface`,
  `on-surface-muted`, `on-surface-subtle`), `border`/`border-strong`, `focus`,
  feedback (`success`, `warning`, `danger`), editorial roles
  (`editorial-accent`, `editorial-muted`, `editorial-surface`,
  `editorial-border`) and fonts (`--font-heading` Nunito, `--font-body` Inter).
- Replace the two legacy button classes with **five** pill variants:
  `button-primary`, `button-secondary`, `button-tertiary`, `button-ghost`,
  `button-destructive` — all with focus, active, and disabled states.
- Add a `.light` token override block (dark stays the default via
  `color-scheme: dark` on `:root`) and a `prefers-reduced-motion` block.
- **BREAKING (internal)** — the `#app` grid loses its `aside` column and area;
  the shell is now `header / main / footer` only.

**App shell (`src/shared/components/`, `base-layout.astro`)**

- New shared components: `Button` (`.astro`), `Overlay` (token-driven gradient
  scrim), `Isotipo`, `Header` (editorial masthead), `Footer`, and `Toolbar` —
  the single React island in the shell.
- `Picture` gains explicit intrinsics (`width`/`height`/`aspectRatio`), a
  `sizing` mode, and a blur-up placeholder that fades out on load instead of
  staying blurred underneath forever.
- `base-layout.astro` renders the shell (Header → Toolbar island → main →
  Footer) and preloads both brand fonts.

**Featured carousel — full vertical slice (`anime` domain)**

- New unit folders: `repositories/anime-carousel`, `mappers/anime-carousel`,
  `services/anime-carousel`, `cache/anime-carousel`,
  `schemas/anime-carousel-schema`, `types/anime-carousel.d-types`.
- New presentational components: `AnimeCarousel` + `carousel-item`, and
  `AnimeCard` (editorial poster card) with a `getStatusColor` shared util.
- New public route `GET /api/anime/carousel`.
- `src/pages/index.astro` becomes the container: it loads slides and the
  top-rated grid in parallel and passes both down as props.
- New `src/pages/card-preview.astro` — a static harness rendering every
  `AnimeCard` state (interim stand-in until `/showcase` exists).

**Local stack**

- Pin Dragonfly's `--proactor_threads` / `--maxmemory` / `--cache_mode` in
  `docker-compose.yml` so the dev cache boots on a many-core host.

**Dependencies**

- Add `@tabler/icons-react` (icon set, rendered server-side) and
  `@formkit/tempo` (masthead issue date).

**Design artifact (no code)**

- A clickable three-artboard design canvas for the anime **detail** page
  (desktop 1440, mobile 390, component kit), aligned to the shipped system.
  Implementing that page is out of scope here — it stays a ROADMAP Fase 1 item.

## Capabilities

### New Capabilities

- `frontend/design-system`: the token layer (swappable brand ramp + semantic
  tokens), the five button variants, the type scale, the image primitive's
  layout-stability and blur-up contract, and the accessibility floor
  (contrast, focus-visible, reduced motion).
- `frontend/app-shell`: the persistent `header / main / footer` shell every page
  renders inside — masthead, footer, the scroll container, and the single
  hydrated island (toolbar) with its outside-click behavior.
- `anime/home-carousel`: featured-anime slides — artwork eligibility, popularity
  ordering, cached payload, the public API route, and the zero-JS-first
  rendering + autoplay contract.

### Modified Capabilities

- `infrastructure/local-development`: the local cache service must start with
  bounded resources on a developer machine rather than refusing to boot based on
  host core count.

## Impact

- **Styles**: `src/styles/global.css` (token layer rewritten; legacy button
  classes replaced; shell grid changed).
- **Shared**: `src/shared/components/{button,overlay,logos,header,footer,toolbar,picture}`,
  `src/shared/layouts/base-layout.astro`, `src/shared/utils/get-status-color`,
  plus the `@shared/components` and `@utils` barrels.
- **Anime domain**: five new unit folders + two component folders + constants
  (`CAROUSEL_*`), and the `cache`/`mappers`/`repositories`/`schemas`/`services`/
  `types`/`components` barrels.
- **Routes**: new `GET /api/anime/carousel` (public — covered by the existing
  `/api/anime` public prefix), rewritten `/`, new `/card-preview`.
- **Client JS**: one island (`Toolbar`, `client:load`) and one page script (the
  carousel controller, which disposes itself on `astro:page-load`).
- **Dependencies**: `@tabler/icons-react`, `@formkit/tempo`.
- **Infra**: `docker-compose.yml` (dragonfly command flags only; production
  sizing is not driven by this file).
- **No DB migration**: the slice reads existing `anime` / `anime_media` /
  `anime_genre` tables.
