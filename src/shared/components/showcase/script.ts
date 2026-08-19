/**
 * Client enhancement for the showcase controls.
 *
 * @module shared/components/showcase/script
 * @remarks
 * The form already works on its own — this only removes the click. On a control
 * change it debounces, then navigates to the URL the form would have submitted,
 * so View Transitions swaps in fresh server-rendered output.
 *
 * Mirrors {@link initCarousel}: returns a disposer, and the page re-initializes
 * on `astro:page-load` so listeners never stack across navigations.
 */
import { navigate } from 'astro:transitions/client'
import { SHOWCASE_DEBOUNCE_MS, SHOWCASE_FORM_ID } from './constants'

interface ShowcaseControlsHandle {
  destroy: () => void
}

/**
 * Wires the controls form currently in the DOM.
 *
 * @returns A disposer, or `undefined` when the page has no controls form (the
 * index view)
 *
 * @example
 * ```typescript
 * let handle = initShowcaseControls()
 * document.addEventListener('astro:page-load', () => {
 *   handle?.destroy()
 *   handle = initShowcaseControls()
 * })
 * ```
 */
export const initShowcaseControls = (): ShowcaseControlsHandle | undefined => {
  const form = document.getElementById(SHOWCASE_FORM_ID)
  if (!(form instanceof HTMLFormElement)) return

  let timer: ReturnType<typeof setTimeout> | undefined

  const submitToUrl = () => {
    const query = new URLSearchParams(
      new FormData(form) as unknown as Record<string, string>
    )
    navigate(`${form.getAttribute('action') ?? ''}?${query.toString()}`)
  }

  const schedule = (delay: number) => {
    clearTimeout(timer)
    timer = setTimeout(submitToUrl, delay)
  }

  const onInput = () => schedule(SHOWCASE_DEBOUNCE_MS)
  const onChange = () => schedule(0)

  form.addEventListener('input', onInput)
  form.addEventListener('change', onChange)

  const destroy = () => {
    clearTimeout(timer)
    form.removeEventListener('input', onInput)
    form.removeEventListener('change', onChange)
  }

  return { destroy }
}
