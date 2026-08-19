/**
 * State hook for the {@link Toolbar} island.
 *
 * @module shared/components/toolbar/use-toolbar
 */
import { useState } from 'react'
import { useHandleClickOutside } from './use-handle-click-outside'

/**
 * Holds the toolbar's open state and its scroll-to-top action.
 *
 * @returns `{ open, toggleToolbar, handleScrollToTop, ref }`
 *
 * @remarks
 * The app scrolls inside `#app` (the shell owns the scroll container), so
 * scroll-to-top targets that element and falls back to the window.
 *
 * @example
 * ```typescript
 * const { open, toggleToolbar, handleScrollToTop, ref } = useToolbar()
 * ```
 */
export const useToolbar = () => {
  const [open, setOpen] = useState(false)
  const { ref } = useHandleClickOutside(() => {
    setOpen(false)
  })

  const toggleToolbar = () => {
    setOpen(!open)
  }

  const handleScrollToTop = () => {
    const appElement =
      typeof document !== 'undefined' ? document.getElementById('app') : null
    const target = appElement ?? globalThis
    target.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return {
    open,
    toggleToolbar,
    handleScrollToTop,
    ref,
  }
}
