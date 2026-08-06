## Context

Repo today: Prettier only (`prettier.config.cjs`), no linter, no `biome.json`. 240 `.ts` files, 0 `.tsx`, 6 `.astro`. The example guide for this workspace uses Biome (single quotes, no semicolons, 2-space) — the target style matches the current Prettier style, so the migration is tool-swap, not style-swap. See `proposal.md` — Why.

Confirmed from official Biome docs (`context7` / `biomejs/website`): Biome does **not** natively format `.astro`; it does format JS/TS/JSX/TSX/JSON/CSS/HTML. Style options that map 1:1 to the current Prettier config exist: `quoteStyle: "single"`, `semicolons: "asNeeded"`, `indentStyle: "space"` + `indentWidth: 2`, `lineWidth: 80`.

## Goals / Non-Goals

**Goals:**
- Single toolchain (Biome) for format + lint on all supported files, with the same visual style as today (single quotes, no semicolons, 2-space, 80).
- Keep `.astro` files formatted via a scoped Prettier script.
- Add a `lint`/`check` command so the Verification gate gains a real lint step.

**Non-Goals:**
- Adopting Biome default style (double quotes, semicolons, tabs) — would rewrite the whole codebase for no functional reason.
- Formatting `.astro` with Biome.
- Enabling new lint rules aggressively; only the repo's existing conventions get enforced initially.

## Decisions

### D1 — Hybrid: Biome primary, Prettier `.astro`-only
Biome covers `.ts/.tsx/.css/.json`; Prettier keeps `prettier-plugin-astro` + `prettier-plugin-tailwindcss` for `.astro` only.
- *Alternative*: Biome-only (rejected — 6 `.astro` files would lose formatting).
- *Alternative*: keep Prettier everywhere (rejected — no lint gate gained, contradicts workspace tooling).

### D2 — Biome config preserves current style
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "files": { "includes": ["src/**", "astro.config.mjs", "tsconfig.json", "*.cjs"], "ignore": [".astro/**", "dist/**"] },
  "formatter": { "indentStyle": "space", "indentWidth": 2, "lineWidth": 80 },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "asNeeded", "arrowParentheses": "always" } },
  "linter": { "enabled": true, "rules": { "recommended": true } }
}
```
Mapping: Prettier `semi:false` → `semicolons:"asNeeded"`; `singleQuote:true` → `quoteStyle:"single"`; `tabWidth:2` → `indentStyle:"space"`/`indentWidth:2`; `printWidth:80` → `lineWidth:80`; `arrowParens:'always'` → `arrowParentheses:"always"`. Trailing commas es5: Biome's `trailingCommas` supports `es5` — set under `javascript.formatter`.
- *Note*: `trailingCommas: "es5"` is explicitly configured to match Prettier's `es5`.

### D3 — Scripts
- `format`: `biome format --write .`
- `check`: `biome check .` (lint + format) — the new quality gate
- `check:write`: `biome check --write .` (auto-fix)
- `format:astro`: `prettier --write "src/**/*.astro"` (scoped)
- `format`/`check` run against `.astro`-excluded paths (via `biome.json` `files.ignore`), so no tool fights the other.

### D4 — Verification gate gains lint
Order becomes `bun run format → bun run astro sync → bun run check → bun run build`. `check` runs Biome lint on src (excluding `.astro`); `.astro` correctness is covered by `build`.

### D5 — AGENTS.md reflects Biome
Replace Prettier Config section with Biome config summary, update Commands table, Verification & Code Quality, and Code Style & Naming (formatting now enforced by Biome; keep single-quote/no-semicolon style rules as-is since the config preserves them).

## Risks / Trade-offs

- **Astro formatting divergence** → Mitigation: scoped `format:astro` script + Prettier still owns those 6 files; add to Verification gate order before `build`.
- **Biome lint findings on first run** → Mitigation: start with `recommended` and `check --write` fixes only; surface remaining warnings without blocking; escalate rules later.
- **Tailwind class ordering lost outside `.astro`** → `.ts`/`.tsx` don't have Tailwind classes (Tailwind only in `.astro`/CSS); negligible.
- **Two formatters in one repo** → Mitigation: clear file-ownership split (`.astro` → Prettier; everything else → Biome) documented in AGENTS.md and enforced by each tool's ignore list.

## Migration Plan

1. `bun add -d @biomejs/biome`; create `biome.json` (D2 config).
2. Update `package.json` scripts (D3); narrow `prettier.config.cjs`/`.prettierignore` to `.astro`.
3. Run `biome check --write src/`; commit lint fixes separately from config.
4. Run `bun run format:astro` to confirm `.astro` still formats.
5. Update AGENTS.md (Commands, Verification, Prettier→Biome, Code Style).
6. Verify gate: `format → astro sync → check → build`.
7. Rollback: revert package.json/scripts, `git checkout` config files; no code reformat needed since style is preserved.

## Open Questions

- None blocking. (Whether to enable stricter lint rules beyond `recommended` is deferred to a follow-up.)
