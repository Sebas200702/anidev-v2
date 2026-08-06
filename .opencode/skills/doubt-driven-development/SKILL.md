---
name: doubt-driven-development
description: Bless a non-trivial piece of work with a fresh-context adversarial review before it stands ("mark done" or open a PR). Use after an implementation task, before committing the task as finished, or before opening a PR. Use when you made several decisions, wrote code in an unfamiliar area, or fixed a subtle bug. Do not skip for any task whose correctness matters.
lifecycle-phase: DOUBT
---

# Doubt before it stands

Purpose: catch errors the warm-assumed implementation missed, before it's declared done.
The reviewer you play now is **not** the one who wrote it. Treat the change as unfamiliar.

## 0. Reset context
- Re-read the task statement from `tasks.md` and the related spec delta / design.
- Re-read the repo standards in `AGENTS.md` (code style, error handling, access, development lifecycle phases).

## 1. Attack your own work
For each file you changed, ask adversarially:
- **Does it do what the spec asked?** Not more, not less. No invented behavior.
- **Null/empty/edge**: does it handle `undefined` vs `null` (repos return `undefined`), empty lists, empty strings, missing rows?
- **Errors**: does it throw a generic `Error` or `console.log` as handling? It must use the domain error factory (see Data flow / error handling in AGENTS.md). Repositories wrap with try/catch + factory.
- **Boundary**: is user input validated with `safeParse()` (Zod) at the edge, not trusted in the middle?
- **Secrets/types**: no secrets logged; no `any`; `z.infer` for types; no non-null assertion where a case is unhandled.
- **Docs/JSDoc**: does the code you touched carry/update the repo's JSDoc (`@module`, `@param`, `@returns`, `@throws`, `@example`, `@see` on barrels)? This codebase is heavily documented; undeclared new exports or stale module blocks are defects. Load `jsdoc-typescript-docs`; keep the repo style (single quotes, no semicolons).

## 2. Attack the integration
- API routes: does it fit the envelope `{ data, status, error, meta }` (see API Route Patterns in AGENTS.md)? Correct status via `mapErrorToHttp`?
- Auth: routes that need auth use `sessionService.getSession()` typing; public routes stay in `src/config/public-routes.ts`.
- The data flow holds: DB schema → repository → mapper → service → page/route.

## 3. Rule of fresh eyes
For logic that was tricky (parsing, filtering, state transitions), re-solve it in one fresh pass (e.g. reason about small concrete inputs) instead of trusting the first attempt.

## 4. Verdict
- No true defect → OK, it can move to the VERIFY fire.
- A defect → fix it or write the failing test (TDD) before affirming; if it shakes the goal, go back to SPECIFY/PLAN and reconsider with the user.

## Source of truth
- `AGENTS.md`: all conventions this skill points to (naming, nullability, error handling, verification). Cite it, don't reinvent rules.