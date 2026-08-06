## 1. Install & configure Biome

- [x] 1.1 Add `@biomejs/biome` as a dev dependency via `bun add -d @biomejs/biome`
- [x] 1.2 Create `biome.json` preserving current style (single quotes, no semicolons, space/2 indent, lineWidth 80, trailingCommas es5)
- [x] 1.3 Configure `biome.json` so Biome never touches `.astro` (and ignores `.astro/`, `dist/`); note: Biome 2.5 removed `files.ignore` — achieved via `files.includes: ["**", "!**/*.astro"]` + `vcs.useIgnoreFile`

## 2. Scripts & formatter split

- [x] 2.1 Update `package.json` scripts: `format` → `biome format --write .`, add `check` (`biome check .`), `check:write` (`biome check --write .`), `format:astro` (Prettier scoped to `src/**/*.astro`)
- [x] 2.2 Narrow `prettier.config.cjs` and `.prettierignore` to `.astro`-only (drop packages not needed)
- [x] 2.3 Remove Prettier from the main `format` path so Biome and Prettier never operate on the same files

## 3. Remove/keep dependencies

- [x] 3.1 Keep `prettier-plugin-astro`/`prettier-plugin-tailwindcss` only for the `.astro` carve-out (via `format:astro`); added `prettier` itself as a dev dep (only plugins were present, binary was missing)
- [x] 3.2 Confirm no `prettier` binary is referenced by main `format`/`check`

## 4. Apply lint fixes

- [x] 4.1 Run `bun run check:write` over `src/` and commit the auto-fixes (style-preserving)
- [x] 4.2 Run `bun run format:astro` to confirm `.astro` still formats

## 5. Update AGENTS.md

- [x] 5.1 Replace `Prettier Config` with a `Biome` section (config summary + hybrid `.astro` carve-out)
- [x] 5.2 Update `Commands` table and `Code Style & Naming` (formatting now enforced by Biome; keep single-quote/no-semicolon rules)
- [x] 5.3 Update `Verification & Code Quality` gate to include `bun run check` (order: format → astro sync → check → build)

## 6. Verification

- [x] 6.1 `bun run format` and `bun run check` pass on supported files
- [x] 6.2 `bun run format:astro` formats the 6 `.astro` files and only those
- [x] 6.3 `bun run astro sync` and `bun run build` pass
- [x] 6.4 `openspec validate --change migrate-to-biome` passes
