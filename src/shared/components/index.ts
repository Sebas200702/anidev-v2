/**
 * Shared Astro components reused across feature domains.
 *
 * @module shared/components
 * @remarks
 * Barrel for presentation components that are not tied to a single domain (anime, auth, etc.).
 * Import from `@shared/components` to avoid deep paths.
 *
 * Everything here is server-rendered (zero client JS) except {@link Toolbar},
 * which is a React island and needs a `client:*` directive at its usage site.
 *
 * @see {@link module:shared/components/picture} — responsive image component
 * @see {@link module:shared/components/button} — the five button variants
 */

export { default as Button } from './button/button.astro'
export type { ButtonProps, ButtonVariant } from './button/types'
export { default as Footer } from './footer/footer.astro'
export { default as Header } from './header/header.astro'
export { default as Isotipo } from './logos/isotipo.astro'
export { default as Overlay } from './overlay/overlay.astro'
export type { OverlayProps, OverlayDirection } from './overlay/types'
export { default as Picture } from './picture/picture.astro'
export type { PictureProps } from './picture/types'
export { default as ServiceUnavailable } from './service-unavailable/service-unavailable.astro'
export { Toolbar } from './toolbar'
