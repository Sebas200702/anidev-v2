/**
 * Types for the anime carousel client controller.
 *
 * @module domains/anime/components/anime-carousel/types
 */

/** Handle returned by {@link initCarousel} so the caller can tear it down. */
export interface CarouselControls {
  goToSlide: (index: number) => void
  nextSlide: () => void
  prevSlide: () => void
  destroy: () => void
}
