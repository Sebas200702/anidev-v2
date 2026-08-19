/**
 * Domain types for the featured-anime carousel.
 *
 * @module domains/anime/types/anime-carousel
 */
import type { z } from 'zod'
import type {
  carouselGenreSchema,
  carouselItemSchema,
} from '@anime/schemas/anime-carousel-schema'

/**
 * One featured-anime slide.
 *
 * @remarks
 * Inferred from {@link carouselItemSchema}. Produced by
 * {@link animeCarouselService.getCarouselItems}.
 */
export type CarouselItem = z.infer<typeof carouselItemSchema>

/** Genre chip attached to a {@link CarouselItem}. */
export type CarouselGenre = z.infer<typeof carouselGenreSchema>
