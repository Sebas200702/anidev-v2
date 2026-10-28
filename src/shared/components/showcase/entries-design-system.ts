/**
 * Showcase entry for the design-system docs.
 *
 * @module shared/components/showcase/entries-design-system
 */
import DesignSystem from '../design-system/design-system.astro'
import type { ShowcaseEntry } from './types'

/** Static token docs: no props, no controls — the page is the specimen. */
export const designSystemShowcaseEntries: readonly ShowcaseEntry[] = [
  {
    slug: 'design-system',
    title: 'DesignSystem',
    owner: 'shared',
    summary: 'Dark editorial tokens: type, color, buttons, surfaces, rules.',
    component: DesignSystem,
    fixture: {},
    controls: [],
  },
]
