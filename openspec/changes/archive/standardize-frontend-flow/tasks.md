# Tasks — Standardize frontend flow

## 1. Repo frontend skill — router

- [x] 1.1 Create `.opencode/skills/frontend/SKILL.md` — the frontend workflow router: zero-JS + islands-on-demand rendering, data flow (pages as containers, presentational components zero-fetch), styling rules (Tailwind v4 tokens, no `<style>` blocks), accessibility, living docs link, done-checklist.
- [x] 1.2 Keep the router thin frontmatter: defer to `impeccable` (design craft), `presentational-container` (component structure), `web-quality-audit` / `webapp-testing` (verification), `AGENTS.md` as the source of truth.
- [x] 1.3 Document the dynamic living docs: `/showcase` fed by the domain API/service (selectable by `?id=`/id route), `fixtures/` per domain as bootstrap fallback only; container fetches, component never does.

## 2. Presentational-Container skill

- [x] 2.1 Create `.opencode/skills/presentational-container/SKILL.md` — rule "data comes from services in page routes, not fetched in components"; containers = page routes, presentational = components.
- [x] 2.2 Document directory convention (`Name/Name.astro` + `index.ts` barrel, `@module` JSDoc), props contract (`interface Props` + destructure, `is*`/`has*` booleans, plain serializable data, `undefined` not `null`), and the ≤150-line rule.

## 3. AGENTS.md — Frontend & UI section

- [x] 3.1 Add "Frontend & UI" under Architecture: zero-JS + islands-on-demand, View Transitions, hooks/`@hooks`/`@stores` conventions, Tailwind v4 styling (tokens only), `Picture` images, accessibility, impeccable craft.
- [x] 3.2 Add "Living documentation — componente showcase": every presentational component gets a dynamic `/showcase` demo fed by the domain API/service, `fixtures/` fallback, JSDoc conventions, demo added in the same task.

## 4. AGENTS.md — skills table & aliases

- [x] 4.1 Register skills in the Skills & Key Guidelines table: `Frontend flow` (+ `presentational-container`), `UI/UX craft (impeccable)`, `Web quality (audit/testing)`, `Component showcase`.
- [x] 4.2 Add note in Path Aliases: `@hooks` and `@stores` reserved for client-side React hooks and Zustand stores.
- [x] 4.3 Add the frontend skills to the "Skills:" list in Verification & Code Quality.

## 5. Verify with gate

- [ ] 5.1 Run gate: `bun run format`, `bun run check`, `bun run check:types`, `bun run test`, `bun run build`.
- [ ] 5.2 Commit per docs (Conventional Commits on `docs/frontend-flow-standardization`), open PR against `master`.