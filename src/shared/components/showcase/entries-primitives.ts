/**
 * Showcase entries for the shared control primitives.
 *
 * @module shared/components/showcase/entries-primitives
 */
import { IconPlayerPlay } from '@tabler/icons-react'
import Button from '../button/button.astro'
import Isotipo from '../logos/isotipo.astro'
import ServiceUnavailable from '../service-unavailable/service-unavailable.astro'
import { BUTTON_VARIANTS } from './constants'
import type { ShowcaseEntry } from './types'

/** Button, brand mark and the degraded-page fallback. */
export const primitiveShowcaseEntries: readonly ShowcaseEntry[] = [
  {
    slug: 'button',
    title: 'Button',
    owner: 'shared',
    summary: 'The five pill variants, with icon, loading and disabled states.',
    component: Button,
    fixture: {
      title: 'Watch Now',
      ariaLabel: 'Watch Now',
      variant: 'button-primary',
      Icon: IconPlayerPlay,
    },
    controls: [
      { name: 'title', label: 'Label', kind: 'text' },
      {
        name: 'variant',
        label: 'Variant',
        kind: 'select',
        options: BUTTON_VARIANTS,
      },
      { name: 'disabled', label: 'Disabled', kind: 'boolean' },
      { name: 'isLoading', label: 'Loading', kind: 'boolean' },
      { name: 'fullWidth', label: 'Full width', kind: 'boolean' },
      { name: 'ariaLabel', label: 'Accessible name', kind: 'text' },
    ],
    presets: BUTTON_VARIANTS.map((variant) => ({
      label: variant.replace('button-', ''),
      values: { variant },
    })),
    stageClass: 'flex justify-center',
  },
  {
    slug: 'isotipo',
    title: 'Isotipo',
    owner: 'shared',
    summary: 'The brand mark; takes its color from the accent tokens.',
    component: Isotipo,
    fixture: { className: 'w-24' },
    controls: [
      {
        name: 'className',
        label: 'Size class',
        kind: 'select',
        options: ['w-8', 'w-12', 'w-24', 'w-40'],
      },
    ],
    stageClass: 'flex justify-center',
  },
  {
    slug: 'service-unavailable',
    title: 'ServiceUnavailable',
    owner: 'shared',
    summary:
      'Degraded-page fallback. Renders its own heading, as it does on a real 503.',
    component: ServiceUnavailable,
    fixture: {
      title: 'We could not load this anime right now',
      message: 'Something went wrong on our side. Please retry in a moment.',
      retryHref: '/showcase?component=service-unavailable',
    },
    controls: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'message', label: 'Message', kind: 'text' },
      { name: 'retryHref', label: 'Retry href', kind: 'text' },
    ],
  },
]
