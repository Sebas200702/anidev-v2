# Proposal: dark editorial design system

## Problem

The shipped system (rounded pills, Nunito/Inter, tonal-only depth) has no
language for the landing and marketing surfaces the roadmap needs, and three
things in it are wrong today:

- **Accent text fails contrast.** `editorial-accent` is `brand-700`. Used as
  text on `#121212` it measures 2.98:1 (kickers in `anime-card` and
  `carousel-item-header`).
- **The light theme accent is unusable.** `.light` maps `editorial-accent` to
  `brand-400`: 2.17:1 under `neutral-50` button text and 1.90:1 as text on
  `neutral-100`.
- **Documentation drift.** `global.css` and `DESIGN.md` quote 5.15:1 for the
  destructive button; the real figure is 4.65:1.

## Change

- Adopt the editorial language already built on `feat/design-system-editorial`:
  Kode Mono for display/headings/labels over Nunito Sans body, five hard button
  roles plus three situational extras, `radius-editorial` (2px), hard offset
  shadows (`brand-700`, `danger-deep` for destructive).
- Add the `editorial-ink` role for accent **text**; point the two components
  that used `editorial-accent` as text color at it.
- Fix the `.light` accent: `editorial-accent` and `editorial-ink` resolve to
  `brand-700`.
- Add four global utilities for the editorial motifs: `.plate-label`,
  `.kicker`, `.corner-ticks`, `.rail-vertical`.
- Ship `/design-system`: a public, `noindex` page documenting tokens, type,
  buttons, surfaces and rules, plus its `/showcase` entry.
- Pin the contrast figures with a unit test that reads `global.css`.

## Non-goals

- No new hues and no new font families. The palette and the swappable accent
  ramp are unchanged.
- No landing page in this change; it consumes this system later.
- `.light` feedback colors (`success` 4.15:1, `warning` 2.14:1 as text) are a
  known gap, recorded in design.md, not fixed here.
