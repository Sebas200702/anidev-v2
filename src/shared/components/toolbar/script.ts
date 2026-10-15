/**
 * Client controller for the toolbar.
 *
 * @module shared/components/toolbar/script
 * @remarks
 * Vanilla replacement for the former React island: toggles the action stack,
 * closes on outside press, and scrolls the shell container to top. No
 * framework ships for this — markup renders server-side in
 * `toolbar.astro`.
 */

export interface ToolbarControls {
  destroy: () => void
}

/**
 * Wires the toolbar currently in the DOM.
 *
 * @returns Controls to dispose listeners, or `undefined` when no toolbar is
 * mounted on the page
 *
 * @remarks
 * Call {@link ToolbarControls.destroy} before re-initialising (e.g. on
 * `astro:page-load`) so listeners of the previous page are released.
 * Smooth scrolling honors `prefers-reduced-motion`.
 *
 * @example
 * ```typescript
 * let controls = initToolbar()
 * document.addEventListener('astro:page-load', () => {
 *   controls?.destroy()
 *   controls = initToolbar()
 * })
 * ```
 */
export const initToolbar = (): ToolbarControls | undefined => {
  const root = document.querySelector('[data-toolbar]')
  if (!(root instanceof HTMLElement)) return undefined
  const toggle = root.querySelector('[data-toolbar-toggle]')
  const actions = root.querySelector('[data-toolbar-actions]')
  const top = root.querySelector('[data-toolbar-top]')
  const iconOpen = root.querySelector('[data-toolbar-icon-open]')
  const iconClose = root.querySelector('[data-toolbar-icon-close]')
  if (
    !(toggle instanceof HTMLButtonElement) ||
    !(actions instanceof HTMLElement) ||
    !(top instanceof HTMLButtonElement)
  ) {
    return undefined
  }

  let open = false
  const reduceMotion = globalThis.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  const render = () => {
    actions.classList.toggle('hidden', !open)
    actions.classList.toggle('flex', open)
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    toggle.title = open ? 'Close menu' : 'Open menu'
    toggle.classList.toggle('button-ghost', open)
    toggle.classList.toggle('button-primary', !open)
    iconOpen?.classList.toggle('hidden', open)
    iconClose?.classList.toggle('hidden', !open)
  }

  const onToggle = () => {
    open = !open
    render()
  }

  const onOutside = (event: MouseEvent) => {
    if (open && !root.contains(event.target as Node)) {
      open = false
      render()
    }
  }

  const onTop = () => {
    const app = document.getElementById('app')
    const target = app ?? globalThis
    target.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  toggle.addEventListener('click', onToggle)
  document.addEventListener('mousedown', onOutside)
  top.addEventListener('click', onTop)
  render()

  return {
    destroy: () => {
      toggle.removeEventListener('click', onToggle)
      document.removeEventListener('mousedown', onOutside)
      top.removeEventListener('click', onTop)
    },
  }
}
