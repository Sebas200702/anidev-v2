/**
 * @module @media/schemas/media-schema
 * @remarks Zod schemas for validating media proxy route requests, including catch-all path
 * params and optional image transform query parameters.
 */
import { z } from 'zod'

/**
 * Validates an image URL served by the media proxy: either an absolute URL
 * (external CDN/OAuth asset) or an origin-relative `/media/...` path.
 *
 * @remarks
 * Since the origin-relative fix, `buildMediaUrl` emits `/media/...` paths
 * (no origin), so response schemas must accept both shapes.
 * - Not `z.url({ relative: true })`: Zod's relative-url check rejects bare
 *   paths like `/media/x` and still accepts `javascript:` schemes.
 * - Not `z.string().min(1)`: too loose (accepts `not-a-url`).
 * The regex `^\/(?!\/)` matches a leading single `/` and rejects
 * protocol-relative `//host` strings.
 * @see {@link mediaRequestSchema} for the proxy request schema
 * @example
 * ```typescript
 * mediaUrlSchema.parse('/media/anime/5114/poster/large') // ok
 * mediaUrlSchema.parse('https://cdn.example.com/x.webp') // ok
 * mediaUrlSchema.parse('//evil.example/x') // throws
 * ```
 */
export const mediaUrlSchema = z.union([z.url(), z.string().regex(/^\/(?!\/)/)])

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
      w: z.coerce.number().int().min(16).max(2048).optional(),
      q: z.coerce.number().int().min(1).max(100).optional(),
      source: z
        .enum([
          'myanimelist',
          'anilist',
          'kitsu',
          'thetvdb',
          'custom',
          'youtube',
        ])
        .optional(),
      version: z.string().optional(),
      resolution: z.string().optional(),
    })
    .optional()
    .default({}),
  body: z.unknown().optional(),
})
