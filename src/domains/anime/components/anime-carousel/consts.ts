/**
 * DOM ids, dot classes and element getters for the anime carousel.
 *
 * @module domains/anime/components/anime-carousel/consts
 * @remarks
 * Shared by the Astro markup (ids) and the client script (getters), so both
 * sides agree on one contract.
 */

export const CAROUSEL_ID = 'shared-carousel'
export const PREV_ID = `${CAROUSEL_ID}-prev`
export const NEXT_ID = `${CAROUSEL_ID}-next`

export const DOT_ACTIVE_CLASS =
  'size-2.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-focus bg-editorial-accent w-6'
export const DOT_INACTIVE_CLASS =
  'size-2.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-focus bg-white/50 hover:bg-white/70'

export const getDots = () =>
  document.querySelectorAll<HTMLElement>('[data-carousel-dot]')

export const getSlides = () =>
  document.querySelectorAll<HTMLElement>('[data-carousel-slide]')

export const getTotal = () =>
  Number(document.getElementById(CAROUSEL_ID)?.dataset.total)

export const getPrevButton = () => document.getElementById(PREV_ID)

export const getNextButton = () => document.getElementById(NEXT_ID)

/** Autoplay cadence: first rotation and the reset after manual navigation. */
export const AUTOPLAY_INTERVAL_MS = 5000
export const AUTOPLAY_RESET_MS = 8000
