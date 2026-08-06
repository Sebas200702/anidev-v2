## Why

The repo has no linter today: `format` is Prettier-only, and lint/typecheck scripts are a documented gap. Biome replaces Prettier with a single all-in-one toolchain (formatter + linter + import organization) that is faster and adds a lint gate that does not exist. It is also the formatter/linter used by the sibling projects in this workspace, keeping tooling consistent.

## What Changes

- Add `@biomejs/biome` as a dev dependency and create `biome.json` configured to preserve the repo's current style: `indentStyle: space` (2), `lineWidth: 80`, `quoteStyle: single`, `semicolons: asNeeded` (no `;`), `trailingCommas: es5`.
- **Hybrid formatter coverage** (Biome does not support `.astro`): Biome formats `.ts`/`.tsx`/`.css`/`.json`; Prettier remains **only** for the 6 `.astro` files via a scoped `prettier` script. Use Biome's ignore mechanism in `biome.json` (`files.includes` / `files.ignore`) so each tool only touches its own files.
- Replace the `format` script with `format` (Biome `format --write`) + `check` (Biome lint+format) and keep a `format:astro` script for Prettier; remove Prettier from the main path.
- Remove `prettier-plugin-astro`/`prettier-plugin-tailwindcss` only where Prettier still needs them for `.astro`; add Biome as the repo's single toolchain otherwise.
- Update `AGENTS.md`: Prettier references → Biome (Config/Commands/Code Style/Verification), document the hybrid `.astro` carve-out, and note the new `lint` gate in the verification order.
- Optionally run `biome check --write` over `src/` to apply lint fixes; formatting is kept compatible with the current style to avoid a full-repo rewrite.

## Capabilities

### New Capabilities
None — dev tooling only; no runtime behavior change.

### Modified Capabilities
None — `openspec/specs/` is empty and no capability-level requirement changes.

> Pure tooling change, so the change declares `skip_specs: true` (see `.openspec.yaml`). No spec delta is required or invented.

## Impact

- **Dev deps**: add `@biomejs/biome`; adjust Prettier plugin usage to `.astro`-only.
- **Config**: new `biome.json`; `prettier.config.cjs` narrowed to `.astro` handling.
- **Scripts**: `package.json` `format`/`check`/`format:astro` (replaces current `format`).
- **Docs**: `AGENTS.md` (Commands, Verification & Code Quality, Prettier Config → Biome, Code Style & Naming).
- **CI**: `.github/workflows/deploy.yml` unchanged (no lint gate today; gate stays local in the Verification step).
- **No application code, APIs, or runtime behavior change.**
