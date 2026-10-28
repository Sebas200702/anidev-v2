# Design: dark editorial design system

## 1. Findings

- `global.css` on the editorial branch already holds the token layer
  (`--font-*`, `--shadow-hard*`, `--radius-editorial`, `--color-on-danger`,
  `--color-danger-deep`) and the five `.button-*` roles.
- Measured with the WCAG relative-luminance formula:

| Pair | Ratio | Verdict |
|---|---|---|
| `brand-700` text on `#121212` | 2.98 | fails |
| `brand-300` text on `#121212` | 10.42 | passes |
| `neutral-50` on `brand-700` / `brand-800` | 5.83 / 9.47 | passes |
| `neutral-50` on `brand-600` | 4.19 | fails — never put text on 600 |
| `on-danger` (`#fff`) on `danger` | 4.65 | passes |
| `.light`: `neutral-50` on `brand-400` | 2.17 | fails |
| `.light`: `brand-400` text on `neutral-100` | 1.90 | fails |
| `.light`: `brand-700` text on `neutral-100` | 5.09 | passes |

- Kode Mono is declared `preload: false` in `base-layout.astro` (display font,
  `swap`). The existing typography requirement said both families are
  preloaded; the requirement is updated to match what ships.

## 2. Decisions

- **A new alias, not new colors.** `editorial-ink` points to `brand-300` on
  dark and `brand-700` on light. Fills, hairlines and focus keep
  `editorial-accent`. This keeps the swappable ramp as the single source.
- **Light accent moves to `brand-700`.** One value fixes both the filled
  button (text `neutral-50`) and accent text.
- **Utilities, not components.** The motifs are repeated one-line patterns, so
  they live in `global.css` as `@apply` utilities, the one place AGENTS.md
  allows `@apply`.
- **Hard offset is not catalog decoration.** Catalog cards keep tonal depth;
  the offset marks actions and landing surfaces.
- **Test reads the CSS.** `src/styles/__tests__/contrast.test.ts` parses hex
  tokens from `global.css` so the documented figures cannot drift.

## 3. Known gaps

- `.light` `success` (4.15:1) and `warning` (2.14:1) fail as small text. Use
  them with an icon at 18px or larger, or as fills with `neutral-950` text,
  until a follow-up retunes them.
