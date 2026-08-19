/**
 * Click-outside hook for the {@link Toolbar} island.
 *
 * @module shared/components/toolbar/use-handle-click-outside
 * @remarks
 * Client-only (React island). Co-located because the toolbar is its single
 * consumer; promote it to `@hooks` when a second island needs it.
 */
import { useEffect, useRef } from 'react'

/**
 * Calls `onClickOutside` when a pointer press lands outside the returned ref.
 *
 * @param onClickOutside - Invoked on an outside `mousedown`
 * @returns `{ ref }` — attach it to the element that should stay open
 *
 * @example
 * ```typescript
 * const { ref } = useHandleClickOutside(() => setOpen(false))
 * ```
 */
export const useHandleClickOutside = (onClickOutside: () => void) => {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClickOutside])

  return { ref }
}
