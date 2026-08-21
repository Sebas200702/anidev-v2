/**
 * Bootstrap fixture for the {@link AnimeDetails} component.
 *
 * @module domains/anime/fixtures/anime-details
 */
import type { AnimeDetails } from '@anime/types'

/** A detail payload with every field populated. */
export const animeDetailsFixture: AnimeDetails = {
  malId: 1575,
  title: 'Code Geass: Hangyaku no Lelouch',
  year: 2006,
  status: 'Finished Airing',
  genres: ['Action', 'Drama', 'Sci-Fi'],
  themes: ['Mecha', 'Military'],
  synopsis:
    'In an alternate timeline, an exiled prince gains the power to command absolute obedience and turns it against the empire that discarded him.',
  demographics: ['Shounen'],
  trailerUrl: 'https://www.youtube.com/watch?v=xa2vhARhbjs',
  imageUrl: '/placeholder.webp',
  smallImageUrl: '/placeholder.webp',
  bannerImageUrl: '/placeholder.webp',
  url: '/anime/1575/code-geass-hangyaku-no-lelouch',
  slug: 'code-geass-hangyaku-no-lelouch',
  shareText: 'Code Geass: Hangyaku no Lelouch on AniDev',
  watchUrl: '/watch/code-geass-hangyaku-no-lelouch',
  altImageText: 'Poster for Code Geass: Hangyaku no Lelouch',
}
