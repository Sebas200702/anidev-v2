/**
 * Constants shared by the showcase route, its UI and its client script.
 *
 * @module shared/components/showcase/constants
 */

/** Owner groups, in the order the index renders them. */
export const SHOWCASE_OWNERS = [
  { id: 'shared', label: 'Shared' },
  { id: 'anime', label: 'Anime' },
] as const

/** Query parameters the route owns; a control may not claim these names. */
export const SHOWCASE_RESERVED_PARAMS = ['component', 'id', 'preset'] as const

/** The showcase route path. */
export const SHOWCASE_PATH = '/showcase'

/** Form id the client script enhances. */
export const SHOWCASE_FORM_ID = 'showcase-controls'

/** How long to wait after the last keystroke before re-rendering. */
export const SHOWCASE_DEBOUNCE_MS = 350

/** Image used by the media playgrounds so a scrim or a crop is visible. */
export const SHOWCASE_SAMPLE_IMAGE = '/placeholder.webp'

/** The button variants declared in `global.css`, in presentation order. */
export const BUTTON_VARIANTS = [
  'button-primary',
  'button-secondary',
  'button-tertiary',
  'button-ghost',
  'button-destructive',
] as const
