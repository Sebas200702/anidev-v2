/**
 * Tests for image buffer optimization guardrails in
 * {@link module:shared/utils/image/optimize-util}.
 *
 * @module shared/__tests__/utils/image/optimize-util
 * @remarks
 * Focuses on the pre-Sharp validations that reject malformed input before the
 * (native, hard to run in CI) decoder is invoked: empty buffers throw a typed
 * {@link EmptyImageError}. `@media/config` is mocked because importing it
 * would eagerly load the Zod-validated env at module import.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@media/config', () => ({
  mediaServiceConfig: {
    defaultQuality: 75,
    defaultFormat: 'webp',
    defaultPlaceholderUrl: 'http://localhost/placeholder.webp',
    supportedMediaTypes: [],
    supportedEntities: [],
  },
}))

import {
  EmptyImageError,
  optimizeImageBuffer,
} from '@utils/image/optimize-util'

describe('optimizeImageBuffer guardrails', () => {
  it('rejects an empty buffer with EmptyImageError', async () => {
    await expect(optimizeImageBuffer(Buffer.alloc(0))).rejects.toBeInstanceOf(
      EmptyImageError
    )
  })
})
