/**
 * Zod schemas for music card API payloads.
 *
 * @module domains/music/schemas/music-card-schema
 * @remarks
 * **Response schema** — validates mapped list/card DTOs from {@link mapMusicCard}.
 */
import { z } from 'zod'

/**
 * Validates an artist entry on a music card payload.
 *
 * @remarks
 * | Field | Rule |
 * |-------|------|
 * | `name` | `z.string()` |
 * | `malId` | `z.number()` |
 */
export const musicCardArtistSchema = z.object({
  name: z.string(),
  malId: z.number(),
})

/**
 * Validates a compact music card shown in list views.
 *
 * @remarks
 * | Field | Rule |
 * |-------|------|
 * | `id` | `z.number()` — internal music ID |
 * | `title` | `z.string()` |
 * | `type` | `'opening' \| 'ending' \| 'unknown'` |
 * | `typeCode` | `'OP' \| 'ED' \| 'UNK'` |
 * | `artists` | array of {@link musicCardArtistSchema} |
 *
 * @see {@link mapMusicCard}
 */
export const musicCardSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.enum(['opening', 'ending', 'unknown']),
  typeCode: z.enum(['OP', 'ED', 'UNK']),
  artists: z.array(musicCardArtistSchema),
})
