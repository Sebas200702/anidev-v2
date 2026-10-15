/**
 * Content Security Policy emitted as a real HTTP header for documents.
 *
 * @module middleware/security-headers/policy
 * @remarks
 * Mirrors the `<meta http-equiv>` policy in `base-layout.astro`.
 *
 * Residual `'unsafe-inline'` (documented, not removable): Astro 7 injects
 * inline scripts that cannot be hashed statically (`<ClientRouter />` view
 * transitions, island hydration payloads) and inline styles (Tailwind,
 * `astro-font`), so `script-src`/`style-src` keep `'unsafe-inline'`.
 * Revisit only if Astro ships nonce/hash support for its injections.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "connect-src 'self' data: blob: https://a.animethemes.moe https://v.animethemes.moe https://i.ytimg.com https://o4510429009674240.ingest.us.sentry.io",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.gstatic.com http://www.gstatic.com",
  "frame-src 'self' https://www.youtube.com/ https://www.youtube-nocookie.com/",
  "style-src 'self' 'unsafe-inline'",
  "media-src 'self' blob: https://a.animethemes.moe https://v.animethemes.moe",
  "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://i.ytimg.com https://coffee-advanced-tern-335.mypinata.cloud https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev https://lh3.googleusercontent.com/ https://anidev.app https://www.anidev.app https://www.youtube.com/",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
].join('; ')
