/**
 * @module @domains/media/schemas/media-schema
 * @remarks Zod schemas for validating media proxy route requests, including catch-all path
 * params and optional image transform query parameters.
 */
import { z } from 'zod'

/**
 * Validates media proxy route params and optional transform query params.
 *
 * @remarks The catch-all `path` param is parsed by {@link parseMediaPath} into a
 * {@link SemanticMediaPath}. Query params `w` (width) and `q` (quality) map to
 * {@link OptimizeOptions}; `source` filters upstream asset hosts.
 * @see {@link mediaService.optimizeMedia} for the optimization pipeline entry point
 * @see {@link MediaRequest} for the inferred request interface
 * @example
 * ```typescript
 * const request = mediaRequestSchema.parse({
 *   params: { path: 'anime/5114/poster/large' },
 *   query: { w: 400, q: 75, source: 'myanimelist' },
 * })
 *
 * const parsedPath = mediaService.parsePath(request.params.path)
 * const optimized = await mediaService.optimizeMedia(parsedPath, {
 *   width: request.query.w,
 *   quality: request.query.q,
 *   source: request.query.source,
 * })
 * ```
 */
export const mediaRequestSchema = z.object({
  params: z.object({
    path: z.string().min(1),
  }),
  query: z
    .object({
      w: z.coerce.number().int().positive().optional(),
      q: z.coerce.number().int().min(1).max(100).optional(),
      source: z
        .enum(['myanimelist', 'anilist', 'kitsu', 'thetvdb', 'custom', 'youtube'])
        .optional(),
    })
    .optional()
    .default({}),
  body: z.unknown().optional(),
})
