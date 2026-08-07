/**
 * Types for image buffer optimization options and output formats.
 *
 * @module shared/utils/image/optimize-util-types
 * @remarks
 * Consumed by {@link module:shared/utils/image/optimize-util} for option shaping
 * and by the media cache/mapper layers for typed optimization defaults.
 *
 * @see {@link normalizeOptimizeOptions} for applying service defaults
 * @see {@link module:domains/media/types/media-config-types} for the service config shape
 */

/** Supported output formats for optimized images. */
export type ImageFormat = 'webp' | 'avif'

/**
 * Known upstream image providers; reserved for future per-source tuning.
 * @remarks Currently only stored on options; defaults do not vary by source yet.
 */
export type ImageSource =
  | 'myanimelist'
  | 'anilist'
  | 'kitsu'
  | 'thetvdb'
  | 'tmdb'
  | 'custom'
  | 'youtube'

/**
 * Options passed to {@link optimizeImageBuffer} and merged by {@link normalizeOptimizeOptions}.
 */
export interface OptimizeOptions {
  /** Target width in pixels; omitted or non-positive skips resize. */
  width?: number
  /** Encoder quality 1–100; default 50 in {@link optimizeImageBuffer}, or config default when normalized. */
  quality?: number
  /** Output format; default `'webp'`. */
  format?: ImageFormat
  /** Upstream provider hint for future optimization profiles. */
  source?: ImageSource
}
