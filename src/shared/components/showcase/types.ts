/**
 * Types for the component showcase registry.
 *
 * @module shared/components/showcase/types
 * @remarks
 * An entry declares everything the playground route needs: which component to
 * render, which props are drivable, which named combinations are worth a link,
 * and how to load real data. The route reads the registry — it never branches
 * per component.
 *
 * @see {@link module:shared/components/showcase/control-schema}
 * @see {@link module:shared/components/showcase/resolve-props}
 */
import type { AstroComponentFactory } from 'astro/runtime/server/index.js'

/** Props passed to a demoed component. */
export type ShowcaseProps = Record<string, unknown>

/**
 * A drivable prop.
 *
 * @remarks
 * Declared, not inferred: a `Props` interface does not exist at runtime, so
 * every control the playground offers is spelled out here. `json` covers
 * structured props (a genre list) and falls back to the loaded value when the
 * text does not parse.
 */
export type ShowcaseControl =
  | {
      /** Prop name, or a dot path into an object prop (`anime.status`). */
      name: string
      label: string
      kind: 'text' | 'number' | 'color'
      placeholder?: string
    }
  | { name: string; label: string; kind: 'boolean' }
  | { name: string; label: string; kind: 'select'; options: readonly string[] }
  | { name: string; label: string; kind: 'json'; placeholder?: string }

/** A named prop combination, rendered as a link to the URL it represents. */
export interface ShowcasePreset {
  label: string
  values: Record<string, string>
}

/** What the route hands a loader. */
export interface ShowcaseLoadOptions {
  /** The `?id=` record identifier, when present and numeric. */
  recordId?: number
}

/**
 * One registry entry.
 *
 * @remarks
 * `load` is declared by the owner and executed by the **route**, inside a
 * `try/catch` that falls back to `fixture` — so a dependency outage degrades one
 * playground instead of the page, and no component ever fetches.
 *
 * Set `renderedByShell` for components the shell already renders (header,
 * footer): a second instance would duplicate a document landmark, so the
 * playground documents the contract instead.
 */
export interface ShowcaseEntry {
  slug: string
  title: string
  owner: string
  summary: string
  /** Omitted for entries the shell already renders. */
  component?: AstroComponentFactory
  fixture: ShowcaseProps
  controls: readonly ShowcaseControl[]
  presets?: readonly ShowcasePreset[]
  load?: (options: ShowcaseLoadOptions) => Promise<ShowcaseProps | undefined>
  renderedByShell?: boolean
  stageClass?: string
}

/** Where a playground's base props came from. */
export type ShowcaseSource = 'live' | 'fixture'

/** Result of composing the three prop layers. */
export interface ResolvedShowcaseProps {
  props: ShowcaseProps
  source: ShowcaseSource
}
