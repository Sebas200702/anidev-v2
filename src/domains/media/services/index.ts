/**
 * @module @media/services
 * @remarks Barrel exports for media application services covering remote fetching, image
 * optimization, and the full semantic-path delivery pipeline.
 * @see {@link ./media-service} for orchestration
 * @see {@link ./media-fetch-service} for HTTP downloads
 * @see {@link ./image-optimizer-service} for buffer optimization
 * @example
 * ```typescript
 * import { mediaService, fetchMediaAsset, optimizeMediaImageBuffer } from '@media/services'
 * ```
 */

export { optimizeMediaImageBuffer } from './image-optimizer'
export { fetchMediaAsset } from './media-fetch'
export { resolveMedia } from './resolve-media'
export { fetchImageBuffer } from './fetch-image-buffer'
export { optimizeMedia } from './optimize-media'
export { optimizeMediaByUrl } from './optimize-media-url'
export { fetchRawMedia } from './fetch-raw-media'
export { getAnimeMedia } from './get-anime-media'
export { mediaService } from './media'
