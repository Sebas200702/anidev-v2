/**
 * E2E (browser): home page smoke — renders and is free of console errors.
 *
 * @module e2e/ui/smoke
 * @remarks
 * The growth point for UI E2E. Kept minimal today (thin frontend); real user
 * flows land here as pages ship.
 */
import { expect, test } from '@playwright/test'

test.describe('home page', () => {
  test('renders with a title and no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    const response = await page.goto('/')
    expect(response?.status() ?? 0).toBeLessThan(400)
    await expect(page).toHaveTitle(/.+/)

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
  })
})
