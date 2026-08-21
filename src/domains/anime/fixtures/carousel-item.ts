/**
 * Bootstrap fixture for the featured-carousel components.
 *
 * @module domains/anime/fixtures/carousel-item
 * @remarks
 * Typed as {@link CarouselItem}, so a schema change fails the build.
 */
import type { CarouselItem } from '@anime/types'

/** One slide with every field populated. */
export const carouselItemFixture: CarouselItem = {
  malId: 1575,
  title: 'Code Geass: Hangyaku no Lelouch',
  clearLogo: '/placeholder.webp',
  bannerImage: '/placeholder.webp',
  description:
    'In an alternate timeline, an exiled prince gains the power to command absolute obedience and turns it against the empire that discarded him.',
  genres: [
    { malId: 1, name: 'Action', url: '/discover?genre=Action' },
    { malId: 8, name: 'Drama', url: '/discover?genre=Drama' },
    { malId: 24, name: 'Sci-Fi', url: '/discover?genre=Sci-Fi' },
  ],
  score: 8.7,
  year: 2006,
  season: 'fall',
}
