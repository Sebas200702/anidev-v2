---
name: presentational-container
description: The Presentational-Container pattern for this repo. Use when building or editing any Astro component, page, layout or client island to enforce the separation — containers in pages fetch from domain services, presentational components render props and do zero data-fetching. Also governs barrel exports, props contracts, and directory layout for components.
lifecycle-phase: IMPLEMENT
---

# Presentational-Container in this repo

The rule in one line — *"Data is supplied by domain services in page routes,
not fetched inside components"* (AGENTS.md). A component that imports a
service, client or repository is broken container logic; move the fetch to the
page route and pass the result as props.

## Container (the page route — `src/pages/`)

- Owns data acquisition, validation, metadata, error/redirect handling.
- Calls `service.getX(...)`, maps `undefined` → `Astro.redirect('/404')`,
  builds `metadata`, spreads it into `<Base {...metadata}>` from
  `@layouts/base-layout.astro`.
- Reference: `src/pages/anime/[malId]/[slug].astro`.
- API routes follow `withZodValidation`/`withErrorHandling` (see
  `api-and-interface-design`); page routes follow this pattern.

## Presentational (component — `src/domains/*/components/`)

- **Receives everything it needs as props.** No `Astro.fetch`, no service import,
  no `import.meta.env` reads inside the SFC.
- **Directory convention**: one per component.
  ```text
  Name/
    Name.astro      # the SFC
    index.ts        # barrel: export { default as Name } from '@anime/components/name/name.astro'
  ```
  Add `@module Name` JSDoc in the barrel. Export PascalCase names; import via
  the domain/shared barrel (`@anime/components`, `@shared/components`) or the
  deep-path only where the barrel does not reach.
- **Props**: `interface Props` in the frontmatter, destructure right away.
  ```astro
  interface Props {
    animeDetails: AnimeDetails
    isFavorite?: boolean
  }
  const { animeDetails, isFavorite } = Astro.props
  ```
- **Booleans** `is*`/`has*`. **Plain serializable data**, never `null` —
  optional fields are `undefined`. Arrays for lists.
- **Server-rendered Astro SFCs have no state, effects, or data-fetching.**
  Client islands may use local UI state and effects when interaction requires
  them, but service/repository data-fetching remains outside the island and
  islands still receive data through props.

## Rules of thumb

- Ask: "can I render both loading and loaded from props alone?" If no, the data
  fetch belongs in the container.
- If a component grows a service import → split: the page fetches, the
  component receives.
- Keep the SFC ≤ 150 lines; break into sibling components per responsibility.

## Sources
- `AGENTS.md` — "Architecture · Presentational-Container", "Data flow",
  "Max file size".
- Reference: `src/domains/anime/components/anime-details/`,
  `src/pages/anime/[malId]/[slug].astro`.
