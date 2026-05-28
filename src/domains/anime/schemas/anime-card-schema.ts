/**
 * Zod schemas for anime card API payloads.
 *
 * @module domains/anime/schemas/anime-card-schema
 * @remarks
 * **Response schema** — validates mapped list/card DTOs from {@link mapAnimeCard}.
 */
import { z } from 'zod'

/**
 * Validates a compact anime card shown in list and grid views.
 *
 * @remarks
 * | Field | Rule |
 * |-------|------|
 * | `malId` | `z.number()` |
 * | `title` | `z.string()` |
 * | `year` | `z.number()` |
 * | `status` | `z.string()` |
 * | `score` | `z.number().nullable()` |
 * | `type` | `z.string()` |
 * | `imageUrl` | `z.url()` |
 * | `smallImageUrl` | `z.url()` |
 * | `altImageText` | `z.string()` |
 */
export const animeCardSchema = z.object({
  malId: z.number(),
  title: z.string(),
  year: z.number(),
  status: z.string(),
  score: z.number().nullable(),
  type: z.string(),
  imageUrl: z.url(),
  smallImageUrl: z.url(),
  altImageText: z.string(),
})
