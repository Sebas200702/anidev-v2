/**
 * Constants for the media domain.
 *
 * @module domains/media/constants
 */

/**
 * `episode_media.media_type` for episode thumbnails.
 *
 * @remarks
 * Episode media types are free text. Thumbnails are images, so `/media`
 * serves them through the optimize pipeline (placeholder fallback) instead of
 * the raw stream proxy used for episode video. The ingestion pipeline must
 * write thumbnails under this value.
 *
 * @see {@link isStreamedMedia}
 */
export const EPISODE_THUMBNAIL_MEDIA_TYPE = 'thumbnail'

/** Media types of streamed entities that are still served as images. */
export const STREAMED_ENTITY_IMAGE_TYPES = new Set<string>([
  EPISODE_THUMBNAIL_MEDIA_TYPE,
])
