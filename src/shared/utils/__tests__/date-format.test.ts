/**
 * Locks the header issue-date format (Spanish `MM/YYYY` via `Intl`).
 *
 * @module shared/utils/__tests__/date-format
 * @remarks
 * Regression contract for the `@formkit/tempo` removal: the header renders
 * `new Intl.DateTimeFormat('es', { month: '2-digit', year: 'numeric' })`, and
 * this pins its exact output for a fixed date.
 */
import { describe, expect, it } from 'vitest'

describe('header issue date format', () => {
  it('renders MM/YYYY in Spanish locale', () => {
    expect(
      new Intl.DateTimeFormat('es', {
        month: '2-digit',
        year: 'numeric',
      }).format(new Date('2026-10-15T12:00:00Z'))
    ).toBe('10/2026')
  })
})
