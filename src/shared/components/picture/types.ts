/**
 * Prop types for the shared {@link Picture} component.
 *
 * @module shared/components/picture/types
 */

/**
 * Props accepted by {@link Picture}.
 *
 * @remarks
 * - `smallImageUrl` doubles as the LQIP placeholder; pass the same URL as
 *   `imageUrl` to skip the blur-up layer.
 * - `isBanner` marks the LCP image: eager loading, high fetch priority and
 *   explicit 1920×1080 intrinsics.
 * - `sizing: 'intrinsic'` keeps the image's own height (logos); the default
 *   `'fill'` covers the figure.
 */
export interface PictureProps {
  imageStyles?: string
  smallImageUrl: string
  imageUrl: string
  alt?: string
  isBanner?: boolean
  width?: number
  height?: number
  aspectRatio?: string
  sizing?: 'fill' | 'intrinsic'
}
