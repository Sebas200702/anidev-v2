/**
 * Bootstrap fixture for the {@link AnimeCard} component.
 *
 * @module domains/anime/fixtures/anime-card
 * @remarks
 * Typed as the domain type on purpose: when `AnimeCard` changes and this is not
 * updated, the build fails. Used by the showcase only when the service yields
 * nothing — never by a component.
 */
import type { AnimeCard } from '@anime/types'

/** A finished, well-rated series. */
export const animeCardFixture: AnimeCard = {
  malId: 52991,
  title: 'Sousou no Frieren',
  year: 2023,
  status: 'Finished Airing',
  score: 9.03,
  type: 'TV',
  imageUrl: '/placeholder.webp',
  smallImageUrl: '/placeholder.webp',
  altImageText: 'Poster for Sousou no Frieren',
}
