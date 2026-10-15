## Context

See `proposal.md` — Why. Design-relevant starting state:

- `src/styles/global.css` held only two `.button-*` classes, a `@theme` block of
  raw neutral steps, and an `#app` grid whose first column was an 80px `aside`
  area that no component ever filled.
- `base-layout.astro` rendered `<slot />` directly inside `<body>`; there was no
  masthead, footer, or shell.
- The `anime` domain already had `anime-list` (cards) and the `media` domain
  already had `getAnimeMedia` + `buildMediaUrl` + `detectMediaSource`.
- The visual system existed as finished components in an earlier checkout of this
  same project (`../anidev-v2-btrfs`), written against v1 conventions: `.tsx`
  everywhere, an `aside` rail, `@domains/*` imports, loose `*-types.ts` siblings.
- `AGENTS.md` constrains the port: module unit folders behind barrels, data
  fetched in page routes only, zero-JS default with islands on demand, "no `.tsx`
  React components exist yet — keep it that way unless a change requires it",
  ≤150 lines per file, constants in dedicated modules, `@domains/*` blocked by
  Biome.

## Goals / Non-Goals

**Goals:**

- Port the existing visual system without rewriting its design, translating it
  onto v2's conventions rather than v2's conventions onto it.
- Make the token layer the only place a color or font is decided, and make the
  accent swappable at the root so Fase 2's "color de énfasis" preference needs no
  component changes.
- Ship the carousel as a complete vertical slice (repository → mapper → service →
  cache → schema → route → component) so it is the reference shape for the rest of
  Fase 1.
- Keep the home page's client JS to one island and one page script.

**Non-Goals:**

- The anime **detail** page. The design canvas explores it; implementing it is a
  separate change.
- `/showcase`. `card-preview.astro` is an interim harness, not the living-docs
  route Fase 0 asks for.
- A generic carousel. This one renders featured anime; a music or seasonal
  carousel is a later generalization, not a pre-built abstraction.
- Theme switching UI. The `.light` token block exists; nothing toggles it yet.
- Any change to `anime-list`, `anime-detail`, or the media pipeline.

## Decisions

### 1. Two token tiers: a raw ramp on `:root`, semantics in `@theme static`

The brand ramp (`--brand-50` … `--brand-950`) lives on plain `:root`; every
semantic token in `@theme` resolves *through* it. Overriding the ramp on the root
re-themes the app; overriding a semantic token re-themes one role.

`@theme static` rather than `@theme`: Tailwind v4 only emits the tokens a utility
class references, and this system reads tokens from inline styles
(`Overlay`'s computed gradient), from `class:list` tables, and potentially from a
runtime accent override. `static` forces all of them onto `:root`.

*Alternatives:* a single flat token set (loses the "swap the accent, keep the
roles" property); Tailwind config colors (v4 puts this in CSS, and a JS config
would not be readable from inline styles).

### 2. Editorial roles are aliases, not new colors

`editorial-accent` / `editorial-muted` / `editorial-surface` / `editorial-border`
map onto existing brand and neutral tokens. They exist so markup can say *why* it
is accented (an editorial rule, a kicker) rather than *which* brand step, which is
what makes the accent swap safe.

### 3. Accent text uses a lighter stop than accent fills

`editorial-accent` (`--brand-700`) on `surface` measures ≈3.0:1 — fine for a 1px
rule or a corner bracket, short of the 4.5:1 floor for a 12px label. Fills, rules
and brackets keep the darker stop; accent **text** uses the lighter `focus` stop
(`--brand-400`). This is recorded in `frontend/design-system` as a requirement so
the split does not read as an inconsistency later.

*Alternative:* lighten `editorial-accent` itself — rejected, it weakens the filled
button, which needs the darker stop to keep white text legible on it.

### 4. Static shared components are `.astro`; only the toolbar is React

`Button`, `Overlay`, `Isotipo`, `Header` and `Footer` render markup and never hold
state, so they are `.astro` and ship no client JS — this keeps AGENTS.md's "no
`.tsx` unless a change requires it" intact. The toolbar expands/collapses *and*
dismisses on an outside click, which a `<form>` cannot express; it is the one
island, hydrated `client:load` in the layout.

Consequence: `Button` accepts an icon *component* (`Icon`), so a
`@tabler/icons-react` export renders server-side inside an `.astro` file. The
island renders its own buttons with the same global `.button-*` classes rather than
importing the `.astro` component, so both paths look identical.

### 5. The shell drops the `aside` rail

Confirmed with the maintainer: the app will not have a rail. `#app` becomes a
three-row grid (`header / main / footer`) and navigation moves into the masthead.
This removes the mobile grid reflow entirely.

### 6. `Overlay` resolves token names, not colors

`fromColor="surface"` → `var(--color-surface)`; `fromColor="surface/60"` →
`rgb(from var(--color-surface) r g b / 60%)`; literals and CSS keywords pass
through. Slides can then stack three scrims that follow the theme, satisfying the
"tokens only" rule while still producing a computed inline gradient.

### 7. Status colors come from a lookup table, not string interpolation

`bg-${token}` never reaches Tailwind's output — the class does not exist in the
source text, so it is never emitted. `getStatusColor` returns the token name (for
semantics) and `getStatusDotClass` returns a complete, literal class from a table.
The airing pulse is applied only for `Currently Airing`, so a finished series does
not animate for no reason.

### 8. The carousel needs its own read path, not `anime-list`

Worth stating because it looks like duplication. `AnimeCard` (what `anime-list`
returns) has no banner, no clear logo, no synopsis, no genres, and no season;
popularity is not in `animeSortFields`; and "has both a banner and a clear logo"
is not expressible through list filters. Reusing `getAnimeList` would mean
widening the card payload for every consumer and adding a sort key and a filter
that only the hero uses.

What the slice does reuse: the `media` domain's **service** (`getAnimeMedia`), not
its repository, so media caching and asset resolution stay owned by `media`; and
`animeTaxonomyRepository.getGenresByAnimeId` for genres. Mapping lives in
`mappers/anime-carousel`, not in the service, per the layer contract.

*Alternative considered and rejected:* one join query returning anime + assets +
genres. It would bypass `media`'s cache and hard-code that domain's asset
resolution into an `anime` repository.

### 9. Eligibility is decided from `anime_media` first

`getTopPopularWithMedia` reads `(anime_id, media_type)` for the required types,
intersects the id sets in memory, then selects those anime ordered by
`popularity_rank`. Filtering `anime` by two `EXISTS` subqueries was the
alternative; the two-step form keeps the required-asset list a constant
(`CAROUSEL_REQUIRED_MEDIA_TYPES`) instead of hard-coding one subquery per type in
SQL, and `anime_media` is small relative to the catalog.

If `anime_media` grows enough for the id-set read to matter, this is the single
function to change — the requirement ("both assets present") does not.

### 10. One global cache entry, medium TTL

Key `anime:list:carousel`, TTL `CacheTtl.Medium` (3600 s), one payload for
everyone. The hero is identical for all visitors, so a per-user variant would only
multiply the cost. The whole mapped slide array is cached — not the raw rows — so a
hit costs no media or genre fan-out.

### 11. Slides render server-side; the script only toggles visibility

All slides are in the HTML, the first one visible, with `initCarousel` swapping
opacity/z-index/`aria-hidden` and syncing the dots. So the hero is meaningful with
JS disabled, and there is no hydration cost.

`initCarousel` returns a `destroy()` and the page listens to `astro:page-load` to
call it before re-initializing. Without that, View Transitions leave the previous
page's `setInterval` running — every navigation back to the home page would add
another timer.

Autoplay is skipped entirely when `prefers-reduced-motion: reduce` matches or when
there is a single slide.

### 12. `Picture` fades its placeholder out with an inline `onload`

The old version left the blurred small image stacked under the full one forever.
An island for one class toggle is not justified, so the fade is an inline `onload`
handler that adds `opacity-0` to the previous sibling. Explicit
`width`/`height`/`aspectRatio` props make the box reservable, which is what
protects CLS.

### 13. Dragonfly gets pinned resources in `docker-compose.yml`

Dragonfly reserves 256 MiB per io thread and spawns one per core, so on a 12-core
host it demanded 3 GiB and restart-looped — which surfaced as
`Stream isn't writeable and enableOfflineQueue options is false` on every cached
read. Pinning `--proactor_threads=2 --maxmemory=512mb --cache_mode=true` with a
comment explaining the arithmetic fixes the dev experience; the file is
development-only, so production sizing is unaffected.

## Risks / Trade-offs

- **Two accent stops could read as an inconsistency** → recorded as a requirement
  in `frontend/design-system` with the measured ratio, not left as a silent habit.
- **The carousel's read path is a second way into `anime`** → bounded to one
  repository function whose eligibility rule is a constant; the media and taxonomy
  reads go through the owning domains.
- **The in-memory id intersection scales with `anime_media`** → acceptable at
  current catalog size; isolated to one function, and the behavior contract does
  not depend on the strategy.
- **Autoplay plus View Transitions is a leak-shaped pattern** → mitigated by
  `destroy()` on `astro:page-load`; the requirement is spelled out in
  `anime/home-carousel` so a future refactor cannot quietly drop it.
- **`card-preview.astro` is an unlinked route** → it renders fixtures only and
  reaches no service; it should be replaced by `/showcase`, and the ROADMAP Fase 0
  living-docs item still tracks that.
- **Two new dependencies** → `@tabler/icons-react` is rendered server-side, so it
  costs build size, not client bytes; `@formkit/tempo` is used for one formatted
  date in the masthead and is the lightest thing already vetted for that job.
- **The masthead's nav counters and language switcher are static** → they are
  presentation placeholders, not features; nothing reads them and no requirement
  claims they work.

## Migration Plan

No data migration and no schema change — the slice reads existing tables.

Deploy order is irrelevant: the new route is additive and the home page degrades to
"no hero" when no anime is eligible. Rollback is reverting the change; the only
persistent artifact is the `anime:list:carousel` cache key, which expires on its
own TTL.

Local setup after pulling this change: `docker compose up -d` →
`bun run db:migrate` → `bun run db:seed:e2e`. The e2e seed does not populate
`anime_media`, so the hero is empty on a freshly seeded local database — that is
the specified empty-result behavior, not a failure.
