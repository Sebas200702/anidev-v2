/**
 * Canonical application error codes shared across domains, HTTP layers, and client contracts.
 *
 * @module shared/errors/codes
 * @remarks
 * Codes are stable string literals used on {@link BaseError.code}, in JSON error bodies, and for
 * client-side branching. HTTP status is determined by error **class** and code subsets in
 * {@link mapErrorToHttp}, not by encoding status into the code string.
 *
 * @see {@link ErrorCode} — union type of all code values
 * @see {@link mapErrorToHttp} — which codes map to 404 vs 401 vs 500
 */

/** Stable string identifiers for application errors. */
export const ErrorCodes = {
  /** Anime entity does not exist — maps to HTTP 404 via {@link DomainError}. */
  ANIME_NOT_FOUND: 'ANIME_NOT_FOUND',
  /** Anime id failed validation (type, range) — maps to HTTP 400. */
  ANIME_INVALID_ID: 'ANIME_INVALID_ID',

  /** Music entity does not exist — HTTP 404. */
  MUSIC_NOT_FOUND: 'MUSIC_NOT_FOUND',
  /** Music id failed validation — HTTP 400. */
  MUSIC_INVALID_ID: 'MUSIC_INVALID_ID',

  /** User watch-state row not found — HTTP 404. */
  WATCH_STATE_NOT_FOUND: 'WATCH_STATE_NOT_FOUND',

  /** User collection not found — HTTP 404. */
  COLLECTION_NOT_FOUND: 'COLLECTION_NOT_FOUND',

  /** Request lacks authentication — HTTP 401. */
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  /** Token present but invalid — HTTP 401. */
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  /** Session expired — HTTP 401. */
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  /** Authenticated but not allowed — HTTP 403. */
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

  /** Zod or manual request validation failed — HTTP 400. */
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  /** Database operation failed — HTTP 500, Sentry. */
  DB_ERROR: 'DB_ERROR',
  /** Cache layer failure — HTTP 500, Sentry. */
  CACHE_ERROR: 'CACHE_ERROR',
  /** Upstream external API failure — HTTP 500, Sentry. */
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',

  /** User profile/account not found — HTTP 404. */
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  /** User id failed validation — HTTP 400. */
  USER_INVALID_ID: 'USER_INVALID_ID',
  /** User not authorized for resource — HTTP 400 (domain) unless wrapped as {@link AuthError}. */
  USER_UNAUTHORIZED: 'USER_UNAUTHORIZED',

  /** Character referenced by anime join table does not exist — HTTP 400. */
  ANIME_CHARACTER_NOT_FOUND: 'ANIME_CHARACTER_NOT_FOUND',

  /** Unclassified failure — HTTP 500, Sentry. */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  /** Media asset not found for entity — HTTP 404 when thrown as {@link DomainError}. */
  MEDIA_NOT_FOUND: 'MEDIA_NOT_FOUND',
  /** Semantic media path invalid or unsupported — HTTP 400 / 500 depending on error class. */
  INVALID_IMAGE_PATH: 'INVALID_IMAGE_PATH',
} as const

/**
 * Union of all string literal values in {@link ErrorCodes}.
 *
 * @remarks
 * Use as the type for `code` fields on errors and API contracts so new codes are added in one place.
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]
