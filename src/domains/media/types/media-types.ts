/**
 * @module @domains/media/types/media-types
 * @remarks Aggregating module for the media domain types. Re-exports the focused type modules
 * (enums, asset/path types, request shapes, and service config) so existing
 * `@domains/media/types/media-types` imports keep working from a single entry point.
 *
 * @see {@link media-enums} — entity/type/size enumerations
 * @see {@link media-asset-types} — optimized output, semantic paths, assets
 * @see {@link media-request-types} — HTTP request shapes
 * @see {@link media-config-types} — service config and cache key options
 */
export * from '@domains/media/types/media-enums'
export * from '@domains/media/types/media-asset-types'
export * from '@domains/media/types/media-request-types'
export * from '@domains/media/types/media-config-types'
