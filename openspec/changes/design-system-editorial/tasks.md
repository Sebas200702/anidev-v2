## 1. Token layer

- [x] 1.1 Editorial tokens in `global.css`: fonts, hard-offset shadows, `radius-editorial`, `on-danger`, `danger-deep`
- [x] 1.2 Five hard button roles + three situational extras
- [x] 1.3 Add `editorial-ink` (dark: `brand-300`; light: `brand-700`) and move the light `editorial-accent` to `brand-700`
- [x] 1.4 Add `.plate-label`, `.kicker`, `.corner-ticks`, `.rail-vertical`
- [x] 1.5 Correct the destructive contrast figure to 4.65:1 in `global.css` and `DESIGN.md`

## 2. Consumers

- [x] 2.1 Point `anime-card` and `carousel-item-header` accent text at `editorial-ink`
- [x] 2.2 `/design-system` page and showcase entry, public + `noindex` (`publicRoutes`)
- [x] 2.3 Docs page shows `editorial-ink` and the motif utilities

## 3. Tests

- [x] 3.1 `src/styles/__tests__/contrast.test.ts` pins the documented ratios to `global.css`
- [x] 3.2 `public-routes.test.ts` covers `/design-system`

## 4. Verification

- [x] 4.1 `bun run format`, `bun run check`, `bun run check:types`, `bun run test`, `bun run build`
- [ ] 4.2 Visual check of `/design-system`, Home and `/showcase` in dark and `.light`
