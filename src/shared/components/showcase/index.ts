/**
 * Component showcase — registry contract, shared entries and playground UI.
 *
 * @module shared/components/showcase
 * @remarks
 * The route (`src/pages/showcase.astro`) composes the owner entry lists, decodes
 * the URL, loads the data and renders these components. Nothing here fetches.
 *
 * @see {@link module:pages/showcase}
 */

export { controlValueSchema, parseControlValues } from './control-schema'
export { resolveShowcaseProps } from './resolve-props'
export { sharedShowcaseEntries } from './entries'
export {
  SHOWCASE_DEBOUNCE_MS,
  SHOWCASE_FORM_ID,
  SHOWCASE_OWNERS,
  SHOWCASE_PATH,
  SHOWCASE_RESERVED_PARAMS,
} from './constants'
export { default as ShowcaseControls } from './showcase-controls.astro'
export { default as ShowcaseHeader } from './showcase-header.astro'
export { default as ShowcaseIndex } from './showcase-index.astro'
export { default as ShowcasePresets } from './showcase-presets.astro'
export { default as ShowcasePropsPanel } from './showcase-props.astro'
export { default as ShowcaseStage } from './showcase-stage.astro'
export type {
  ResolvedShowcaseProps,
  ShowcaseControl,
  ShowcaseEntry,
  ShowcaseLoadOptions,
  ShowcasePreset,
  ShowcaseProps,
  ShowcaseSource,
} from './types'
