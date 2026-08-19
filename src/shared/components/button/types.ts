/**
 * Prop types for the shared {@link Button} component.
 *
 * @module shared/components/button/types
 */
import type { ComponentType } from 'react'

/** The five global button variants declared in `src/styles/global.css`. */
export type ButtonVariant =
  | 'button-primary'
  | 'button-secondary'
  | 'button-tertiary'
  | 'button-destructive'
  | 'button-ghost'

/**
 * Props accepted by {@link Button}.
 *
 * @remarks
 * `Icon` takes an icon component (e.g. a `@tabler/icons-react` export). It is
 * rendered server-side, so no client JS ships for it.
 *
 * @see {@link ButtonVariant} — maps 1:1 to the `.button-*` global classes
 */
export interface ButtonProps {
  id?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  isLoading?: boolean
  Icon?: ComponentType<{ className?: string; strokeWidth?: number }>
  title?: string
  ariaLabel?: string
  fullWidth?: boolean
  className?: string
  variant?: ButtonVariant
}
