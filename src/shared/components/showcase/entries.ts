/**
 * Showcase entries owned by `src/shared/components`.
 *
 * @module shared/components/showcase/entries
 */
import { mediaShowcaseEntries } from './entries-media'
import { primitiveShowcaseEntries } from './entries-primitives'
import { shellShowcaseEntries } from './entries-shell'
import type { ShowcaseEntry } from './types'

/**
 * Every shared component, in index order.
 *
 * @remarks
 * Shared entries never reach into a domain: components under `src/domains/*`
 * declare their own list, because `src/shared/` must not import from a domain.
 *
 * @see {@link module:pages/showcase}
 */
export const sharedShowcaseEntries: readonly ShowcaseEntry[] = [
  ...primitiveShowcaseEntries,
  ...mediaShowcaseEntries,
  ...shellShowcaseEntries,
]
