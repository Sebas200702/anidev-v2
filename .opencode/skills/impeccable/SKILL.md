---
name: impeccable
description: Design craft authority for AniDev — north star, tokens, type, layout and component rules. Use when any UI work touches visual design, layout, color, typography, motion or UX copy in Astro components, pages, layouts or styles.
lifecycle-phase: PLAN / IMPLEMENT
---

# Impeccable — design craft for AniDev

This skill is the **design authority**, not the workflow router.
Workflow lives in `frontend`; structure in `presentational-container`.
Read the sources below before deciding color, type, layout, motion or copy.

## 1. Sources — read in order

Paths are relative to this skill dir (`.opencode/skills/impeccable/`):

1. `../../../PRODUCT.md` — north star (`Libertad de exploración`), principles.
2. `../../../DESIGN.md` — human-readable system (colors, type, layout, components, do/don't).
3. `../../../.impeccable/design.json` — machine-readable tokens and components.
4. `../../../src/styles/global.css` — `@theme` tokens, the only source of color/type in code.

If `DESIGN.md` and `design.json` disagree, `DESIGN.md` wins and flag the drift.

## 2. Binding rules

- **Dark-only.** `color-scheme: dark`; base `#121212`, raised `#1c1c1c`.
- **Tokens only.** Color via `@theme` (`brand`/`neutral`/semantic `surface`, `border`, `focus`); never raw hex in components. `@apply` only in `global.css`.
- **Personal Accent Rule.** Primary-button text keeps ≥ 4.5:1 contrast against the accent; restrict selectable accents or pick a conforming foreground dynamically.
- **Type scale.** Title/subtitle plus `text-lxx` → `text-sxx` classes; `Nunito` headings, body fallback.
- **Depth via tone.** Flat by default; shadow only on interactive states (`interactive-md`).
- **Motion.** Brief transitions; full `prefers-reduced-motion` cut-off.
- **A11y.** Semantic HTML, `focus-visible`, contrast ≥ 4.5:1, keyboard reachable.
- **Do:** preserve accent choice across states; clear hierarchy; responsive (`md` 768px, single column on mobile).
- **Don't:** rigid admin-table feel; decoration competing with artwork; one fixed accent.

## 3. Done checklist

- [ ] Choice traces to `DESIGN.md`/`design.json` tokens.
- [ ] No hex, no `<style>` block in the component.
- [ ] Contrast, focus-visible, reduced-motion covered.
- [ ] Accent_rule holds for every selectable accent.
