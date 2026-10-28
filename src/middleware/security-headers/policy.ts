/**
 * Content Security Policy emitted as a real HTTP header for documents.
 *
 * @module middleware/security-headers/policy
 * @remarks
 * `base-layout.astro` mirrors it as `<meta http-equiv>` through
 * {@link META_CONTENT_SECURITY_POLICY}, so both policies always match.
 *
 * Residual `'unsafe-inline'` (documented, not removable): Astro 7 injects
 * inline scripts that cannot be hashed statically (`<ClientRouter />` view
 * transitions, island hydration payloads) and inline styles (Tailwind,
 * `astro-font`), so `script-src`/`style-src` keep `'unsafe-inline'`.
 * Revisit only if Astro ships nonce/hash support for its injections.
 *
 * The only env-driven part is the uploads origin (`S3_PUBLIC_URL`) in
 * `img-src`: profile avatars and banners are served straight from storage.
 */
import { env } from '@config/env'
import {
  CSP_DIRECTIVES,
  CSP_IMG_SOURCES,
  META_IGNORED_DIRECTIVE,
} from '@middleware/security-headers/constants'

/**
 * Builds the policy, allowing the storage origin for images when given.
 *
 * @param storagePublicUrl - `S3_PUBLIC_URL`; only its origin is allowed
 * @returns The `;`-joined policy
 */
export const buildContentSecurityPolicy = (storagePublicUrl?: string) => {
  const imgSources = storagePublicUrl
    ? [...CSP_IMG_SOURCES, new URL(storagePublicUrl).origin]
    : CSP_IMG_SOURCES
  return [...CSP_DIRECTIVES, `img-src ${imgSources.join(' ')}`].join('; ')
}

/** Header policy for HTML responses. */
export const CONTENT_SECURITY_POLICY = buildContentSecurityPolicy(
  env.S3_PUBLIC_URL
)

/** Same policy for `<meta http-equiv>`, which ignores `frame-ancestors`. */
export const META_CONTENT_SECURITY_POLICY = CONTENT_SECURITY_POLICY.split('; ')
  .filter((directive) => !directive.startsWith(META_IGNORED_DIRECTIVE))
  .join('; ')
