# Migrate SDD → ODD + RDD

Replace the project's Spec-Driven Development (OpenSpec) methodology with Organic
Driven Development (ODD) + Receipt-Driven Development (RDD). Docs-and-tooling change,
no runtime behavior delta.

## Specs

- **S1** — Replace the SDD/OpenSpec methodology across all project docs with ODD +
  RDD. ODD = the 7-step organic workflow (Authorize → Explore → Resolve uncertainty
  → Classify → Track-before-first-write → Implement task-by-task → Close); large
  authorized work is tracked in `odd/tasks/<feature>.md` + Engram mirror + visible
  todo + work-unit commits (~400 changed lines) on a feature branch. RDD = the
  user-owned review switch (`gentle-ai review mode`) that gates an extra outside
  review for high-risk candidates; review evidence is review-only and never
  authorizes delivery (commit/push/PR/release follow ordinary repo policy).
- **S2** — Move `openspec/specs/` (13 capabilities, 39 files) out of `openspec/`
  into `docs/specs/` as committed behavior documentation, preserving the tree.
- **S3** — Delete the rest of `openspec/` (`changes/`, `config.yaml`) after S2.
- **S4** — Delete the 7 `openspec-*` skills under `.opencode/skills/` and the 6
  `opsx-*.md` commands under `.opencode/commands/`.
- **S5** — Rewrite `.opencode/skills/development-lifecycle/SKILL.md` to route the
  ODD phases + RDD instead of OpenSpec SPECIFY/PLAN/ARCHIVE.
- **S6** — Update every openspec/SDD reference in `AGENTS.md`, `ARCHITECTURE.md`,
  `README.md`, `ROADMAP.md`, `.atl/skill-registry.md` to ODD/RDD and the new
  `docs/specs/` path.

## Tasks

- **T1** (S2,S3) ✅ — git mv `openspec/specs/*` → `docs/specs/`; delete `openspec/changes/` + `config.yaml`. Commit `69b939d` (rename-only; 10491 lines are moves, not authored content — single atomic slice).
- **T2** (S4) — Delete `openspec-*` skills + `opsx-*` commands. Commit `chore(tooling): remove openspec skills and opsx commands`.
- **T3** (S1,S5) — Rewrite `development-lifecycle` SKILL + AGENTS.md methodology/lifecycle sections to ODD+RDD. Commit `docs(agents): replace SDD methodology with ODD + RDD`.
- **T4** (S6) — Update ARCHITECTURE.md, README.md, ROADMAP.md, .atl/skill-registry.md references. Commit `docs: point architecture/readme/roadmap to ODD + docs/specs`.

## Log

- **L1** — User (verbatim): "Migremos sdd a odd y rdd de este proyecto cambiemos la metodologia de desarrollo"
- **L2** — User decisions: (1) active openspec changes → delete openspec/ entirely; (2) openspec/specs/ → move to docs/ normal; (3) scope → everything (docs + skills + commands). Resolution: move specs to docs/specs first (S2), then delete the rest (S3).
