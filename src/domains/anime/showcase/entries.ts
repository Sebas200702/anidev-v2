/**
 * Showcase entries for the anime domain's components.
 *
 * @module domains/anime/showcase/entries
 * @remarks
 * Each entry names a loader; the **route** runs it inside a `try/catch` and falls
 * back to the fixture, so no component fetches and an outage degrades one
 * playground instead of the page.
 *
 * Control names are dot paths because these components take a single object prop.
 *
 * @see {@link module:pages/showcase}
 */
import AnimeCard from '@anime/components/anime-card/anime-card.astro'
import AnimeCarousel from '@anime/components/anime-carousel/anime-carousel.astro'
import CarouselItem from '@anime/components/anime-carousel/carousel-item/carousel-item.astro'
import AnimeDetails from '@anime/components/anime-details/anime-details.astro'
import {
  animeCardFixture,
  animeDetailsFixture,
  carouselItemFixture,
} from '@anime/fixtures'
import { ANIME_STATUSES } from '@anime/constants'
import type { ShowcaseEntry } from '@components/showcase'
import { loadCard, loadCarousel, loadDetails } from './loaders'

/** Every anime component, in index order. */
export const animeShowcaseEntries: readonly ShowcaseEntry[] = [
  {
    slug: 'anime-card',
    title: 'AnimeCard',
    owner: 'anime',
    summary: 'Editorial poster card; the status dot pulses only while airing.',
    component: AnimeCard,
    fixture: { anime: animeCardFixture },
    load: loadCard,
    controls: [
      { name: 'anime.title', label: 'Title', kind: 'text' },
      {
        name: 'anime.status',
        label: 'Status',
        kind: 'select',
        options: ANIME_STATUSES,
      },
      { name: 'anime.score', label: 'Score', kind: 'number' },
      { name: 'anime.year', label: 'Year', kind: 'number' },
      { name: 'anime.type', label: 'Type', kind: 'text' },
      { name: 'anime.imageUrl', label: 'Poster URL', kind: 'text' },
    ],
    presets: [
      { label: 'airing', values: { 'anime.status': 'Currently Airing' } },
      { label: 'finished', values: { 'anime.status': 'Finished Airing' } },
      { label: 'not yet aired', values: { 'anime.status': 'Not yet aired' } },
      { label: 'unrated', values: { 'anime.score': '0', 'anime.year': '0' } },
      {
        label: 'long title',
        values: {
          'anime.title':
            'Kono Subarashii Sekai ni Shukufuku wo! Kurenai Densetsu',
        },
      },
    ],
    stageClass: 'max-w-60',
  },
  {
    slug: 'carousel-item',
    title: 'CarouselItem',
    owner: 'anime',
    summary: 'One featured slide: banner, scrims, clear logo and actions.',
    component: CarouselItem,
    fixture: { item: carouselItemFixture },
    load: loadCarousel,
    controls: [
      { name: 'item.title', label: 'Title', kind: 'text' },
      { name: 'item.description', label: 'Synopsis', kind: 'text' },
      { name: 'item.score', label: 'Score', kind: 'number' },
      { name: 'item.year', label: 'Year', kind: 'number' },
      { name: 'item.season', label: 'Season', kind: 'text' },
      {
        name: 'item.genres',
        label: 'Genres (JSON)',
        kind: 'json',
        placeholder:
          '[{"malId":1,"name":"Action","url":"/discover?genre=Action"}]',
      },
      { name: 'item.bannerImage', label: 'Banner URL', kind: 'text' },
      { name: 'item.clearLogo', label: 'Clear logo URL', kind: 'text' },
    ],
    presets: [
      { label: 'no synopsis', values: { 'item.description': '' } },
      { label: 'no genres', values: { 'item.genres': '[]' } },
      { label: 'no artwork', values: { 'item.clearLogo': '' } },
    ],
    stageClass: 'relative h-[60vh]',
  },
  {
    slug: 'anime-carousel',
    title: 'AnimeCarousel',
    owner: 'anime',
    summary:
      'The hero: every slide server-rendered, autoplay opt-out on motion.',
    component: AnimeCarousel,
    fixture: { items: [carouselItemFixture] },
    load: loadCarousel,
    controls: [
      { name: 'items.0.title', label: 'First slide title', kind: 'text' },
      { name: 'items', label: 'Slides (JSON)', kind: 'json' },
    ],
    presets: [{ label: 'single slide', values: {} }],
  },
  {
    slug: 'anime-details',
    title: 'AnimeDetails',
    owner: 'anime',
    summary: 'Detail page body — still the stub pending its own change.',
    component: AnimeDetails,
    fixture: { animeDetails: animeDetailsFixture },
    load: loadDetails,
    controls: [
      { name: 'animeDetails.title', label: 'Title', kind: 'text' },
      { name: 'animeDetails.synopsis', label: 'Synopsis', kind: 'text' },
      { name: 'animeDetails.year', label: 'Year', kind: 'number' },
      {
        name: 'animeDetails.bannerImageUrl',
        label: 'Banner URL',
        kind: 'text',
      },
    ],
  },
]
