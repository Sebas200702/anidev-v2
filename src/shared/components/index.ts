/**
 * Shared Astro components reused across feature domains.
 *
 * @module shared/components
 * @remarks
 * Barrel for presentation components that are not tied to a single domain (anime, auth, etc.).
 * Import from `@shared/components` to avoid deep paths.
 *
 * @see {@link module:shared/components/picture} — responsive image component
 */

export { default as Picture } from './picture/picture.astro'
