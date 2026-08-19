/**
 * Toolbar — floating quick-actions island.
 *
 * @module shared/components/toolbar
 * @remarks
 * The one hydrated island in the shell (`client:load` in `base-layout.astro`):
 * it toggles a stack of actions and closes on an outside click, which a
 * `<form>` cannot express. Buttons reuse the global `.button-*` classes so the
 * island matches the Astro {@link Button} pixel for pixel.
 *
 * @see {@link useToolbar}
 */
import {
  IconArrowsShuffle,
  IconChevronsUp,
  IconMenu2,
  IconPlayerPlay,
  IconX,
} from '@tabler/icons-react'
import { useToolbar } from './use-toolbar'

export const Toolbar = () => {
  const { open, toggleToolbar, handleScrollToTop, ref } = useToolbar()

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-surface-raised border-border absolute right-4 bottom-20 z-100 flex flex-col gap-1 rounded-full border p-1"
    >
      <button
        type="button"
        className="button-ghost w-min p-2!"
        aria-label="Scroll to top"
        title="Scroll to top"
        onClick={handleScrollToTop}
      >
        <IconChevronsUp className="size-5" strokeWidth={2} />
      </button>

      <div
        className={`flex flex-col gap-1 transition-all ease-in-out ${open ? 'block' : 'hidden'}`}
      >
        <button
          type="button"
          className="button-primary p-2!"
          aria-label="Play"
          title="Play"
        >
          <IconPlayerPlay className="size-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="button-primary p-2!"
          aria-label="Random anime"
          title="Random anime"
        >
          <IconArrowsShuffle className="size-5" strokeWidth={2} />
        </button>
      </div>

      <button
        type="button"
        className={`${open ? 'button-ghost' : 'button-primary'} p-2! transition-all duration-500`}
        aria-label={open ? 'Close menu' : 'Open menu'}
        title={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={toggleToolbar}
      >
        {open ? (
          <IconX className="size-5" strokeWidth={2} />
        ) : (
          <IconMenu2 className="size-5" strokeWidth={2} />
        )}
      </button>
    </article>
  )
}
