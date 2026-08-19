/**
 * Client controller for the anime carousel.
 *
 * @module domains/anime/components/anime-carousel/script
 * @remarks
 * The only client JS on the home page. Slides are all rendered server-side;
 * this just swaps opacity/z-index, keeps the dots in sync, and autoplays
 * (never under `prefers-reduced-motion`).
 */
import {
  AUTOPLAY_INTERVAL_MS,
  AUTOPLAY_RESET_MS,
  DOT_ACTIVE_CLASS,
  DOT_INACTIVE_CLASS,
  getDots,
  getNextButton,
  getPrevButton,
  getSlides,
  getTotal,
} from './consts'
import type { CarouselControls } from './types'

/**
 * Wires the carousel currently in the DOM.
 *
 * @returns Controls to drive or dispose it, or `undefined` when no carousel is
 * mounted on the page
 *
 * @remarks
 * Call {@link CarouselControls.destroy} before re-initialising (e.g. on
 * `astro:page-load`) so the timer and listeners of the previous page are
 * released.
 *
 * @example
 * ```typescript
 * let controls = initCarousel()
 * document.addEventListener('astro:page-load', () => {
 *   controls?.destroy()
 *   controls = initCarousel()
 * })
 * ```
 */
export const initCarousel = (): CarouselControls | undefined => {
  const dots = getDots()
  const slides = getSlides()
  const total = getTotal()
  const prevButton = getPrevButton()
  const nextButton = getNextButton()

  if (!total || slides.length === 0) return

  let current = 0
  let interval: ReturnType<typeof setInterval> | undefined

  const updateSlide = (index: number) => {
    slides.forEach((slide, i) => {
      const isActive = i === index
      slide.style.opacity = isActive ? '1' : '0'
      slide.style.zIndex = isActive ? '10' : '0'
      slide.style.pointerEvents = isActive ? 'auto' : 'none'
      slide.setAttribute('aria-hidden', String(!isActive))
    })
    dots.forEach((dot, i) => {
      const isActive = i === index
      dot.className = isActive ? DOT_ACTIVE_CLASS : DOT_INACTIVE_CLASS
      dot.setAttribute('aria-selected', String(isActive))
    })
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
  const canAutoplay = total > 1 && !prefersReducedMotion

  const resetInterval = () => {
    clearInterval(interval)
    if (canAutoplay) {
      interval = setInterval(nextSlide, AUTOPLAY_RESET_MS)
    }
  }

  const goToSlide = (index: number) => {
    current = ((index % total) + total) % total
    updateSlide(current)
    resetInterval()
  }

  function nextSlide() {
    goToSlide(current + 1)
  }

  const prevSlide = () => {
    goToSlide(current - 1)
  }

  const dotHandlers = Array.from(dots).map((_, index) => () => goToSlide(index))

  nextButton?.addEventListener('click', nextSlide)
  prevButton?.addEventListener('click', prevSlide)
  dots.forEach((dot, index) => {
    dot.addEventListener('click', dotHandlers[index])
  })

  const destroy = () => {
    clearInterval(interval)
    nextButton?.removeEventListener('click', nextSlide)
    prevButton?.removeEventListener('click', prevSlide)
    dots.forEach((dot, index) => {
      dot.removeEventListener('click', dotHandlers[index])
    })
  }

  updateSlide(0)
  if (canAutoplay) {
    interval = setInterval(nextSlide, AUTOPLAY_INTERVAL_MS)
  }

  return { goToSlide, nextSlide, prevSlide, destroy }
}
