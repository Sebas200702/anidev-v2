/**
 * Public exports for anime domain UI components.
 *
 * @module domains/anime/components
 * @remarks
 * Astro components for rendering anime pages. Data is supplied by domain
 * services in page routes, not fetched inside components.
 *
 * @see {@link animeService}
 */

export { default as AnimeCard } from './anime-card/anime-card.astro'
export { default as AnimeCarousel } from './anime-carousel/anime-carousel.astro'
export { default as AnimeDetails } from './anime-details/anime-details.astro'
