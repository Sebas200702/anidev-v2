/**
 * Showcase entries for the shared media components.
 *
 * @module shared/components/showcase/entries-media
 */
import Overlay from '../overlay/overlay.astro'
import Picture from '../picture/picture.astro'
import { SHOWCASE_SAMPLE_IMAGE } from './constants'
import type { ShowcaseEntry } from './types'

/** The gradient scrim and the blur-up image. */
export const mediaShowcaseEntries: readonly ShowcaseEntry[] = [
  {
    slug: 'overlay',
    title: 'Overlay',
    owner: 'shared',
    summary: 'Token-driven gradient scrim, shown over a sample image.',
    component: Overlay,
    fixture: {
      direction: 'up',
      fromColor: 'surface',
      viaColor: 'surface/60',
      viaInterval: '30%',
      toColor: 'transparent',
    },
    controls: [
      {
        name: 'direction',
        label: 'Direction',
        kind: 'select',
        options: ['up', 'down', 'left', 'right'],
      },
      {
        name: 'fromColor',
        label: 'From',
        kind: 'text',
        placeholder: 'surface',
      },
      {
        name: 'viaColor',
        label: 'Via',
        kind: 'text',
        placeholder: 'surface/60',
      },
      {
        name: 'viaInterval',
        label: 'Via stop',
        kind: 'text',
        placeholder: '30%',
      },
      {
        name: 'toColor',
        label: 'To',
        kind: 'text',
        placeholder: 'transparent',
      },
    ],
    presets: [
      {
        label: 'card scrim',
        values: { direction: 'up', viaColor: 'surface/60' },
      },
      {
        label: 'hero wash',
        values: { direction: 'right', viaColor: 'surface' },
      },
    ],
    stageClass:
      "relative aspect-video overflow-hidden rounded-md bg-cover bg-center bg-[url('/placeholder.webp')]",
  },
  {
    slug: 'picture',
    title: 'Picture',
    owner: 'shared',
    summary: 'LQIP blur-up image with explicit intrinsics; no layout shift.',
    component: Picture,
    fixture: {
      imageUrl: SHOWCASE_SAMPLE_IMAGE,
      smallImageUrl: SHOWCASE_SAMPLE_IMAGE,
      alt: 'Sample artwork',
      imageStyles: 'w-full h-full rounded-md',
      aspectRatio: '427/600',
    },
    controls: [
      { name: 'imageUrl', label: 'Image URL', kind: 'text' },
      { name: 'smallImageUrl', label: 'Placeholder URL', kind: 'text' },
      { name: 'alt', label: 'Alt text', kind: 'text' },
      {
        name: 'aspectRatio',
        label: 'Aspect ratio',
        kind: 'text',
        placeholder: '427/600',
      },
      {
        name: 'sizing',
        label: 'Sizing',
        kind: 'select',
        options: ['fill', 'intrinsic'],
      },
      { name: 'isBanner', label: 'Banner (eager, 1920×1080)', kind: 'boolean' },
    ],
    presets: [
      { label: 'poster', values: { aspectRatio: '427/600', sizing: 'fill' } },
      {
        label: 'banner',
        values: { aspectRatio: '1920/1080', isBanner: 'true' },
      },
    ],
    stageClass: 'max-w-xs',
  },
]
