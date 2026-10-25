/**
 * Static Content Security Policy sources.
 *
 * @module middleware/security-headers/constants
 */

/** Every directive except `img-src`, which is built with the storage origin. */
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "connect-src 'self' data: blob: https://a.animethemes.moe https://v.animethemes.moe https://i.ytimg.com https://o4510429009674240.ingest.us.sentry.io",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.gstatic.com http://www.gstatic.com",
  "frame-src 'self' https://www.youtube.com/ https://www.youtube-nocookie.com/",
  "style-src 'self' 'unsafe-inline'",
  "media-src 'self' blob: https://a.animethemes.moe https://v.animethemes.moe",
  "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
] as const

/** Static `img-src` sources. */
export const CSP_IMG_SOURCES = [
  "'self'",
  'data:',
  'blob:',
  'https://i.ytimg.com',
  'https://coffee-advanced-tern-335.mypinata.cloud',
  'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev',
  'https://lh3.googleusercontent.com/',
  'https://anidev.app',
  'https://www.anidev.app',
  'https://www.youtube.com/',
] as const

/** Directive browsers ignore in `<meta http-equiv>` (header only). */
export const META_IGNORED_DIRECTIVE = 'frame-ancestors'
