/**
 * HTTP mapping for {@link DomainError}: status by code subset.
 *
 * @module shared/errors/domain-error-http-map
 * @remarks Consumed by {@link mapErrorToHttp}; split from
 * `error-http-maps.ts` to keep each mapper file focused.
 */
import type { DomainError } from '@shared/errors/app-error'
import { ErrorCodes, type ErrorCode } from '@shared/errors/codes'
import {
  buildAppErrorBody,
  toLoggableError,
} from '@shared/errors/error-http-maps'
import type { HttpErrorResponse } from '@shared/errors/http-error-types'
import { logger } from '@utils/logger-util'

/**
 * Domain error codes that map to **404 Not Found**.
 *
 * @remarks
 * Any other {@link DomainError} code maps to **400 Bad Request** and is logged at `error` severity.
 *
 * @internal
 */
const NOT_FOUND_DOMAIN_CODES = new Set<ErrorCode>([
  ErrorCodes.ANIME_NOT_FOUND,
  ErrorCodes.MANGA_NOT_FOUND,
  ErrorCodes.PRODUCER_NOT_FOUND,
  ErrorCodes.SITEMAP_NOT_FOUND,
  ErrorCodes.CHARACTER_NOT_FOUND,
  ErrorCodes.PERSON_NOT_FOUND,
  ErrorCodes.PROVIDER_NOT_CONFIGURED,
  ErrorCodes.EPISODE_NOT_FOUND,
  ErrorCodes.MUSIC_NOT_FOUND,
  ErrorCodes.WATCH_STATE_NOT_FOUND,
  ErrorCodes.COLLECTION_NOT_FOUND,
  ErrorCodes.USER_NOT_FOUND,
  ErrorCodes.MEDIA_NOT_FOUND,
  ErrorCodes.STORAGE_NOT_CONFIGURED,
])

/**
 * Domain error codes that map to **409 Conflict**.
 *
 * @remarks
 * Any other {@link DomainError} code maps to **400 Bad Request**.
 *
 * @internal
 */
const CONFLICT_DOMAIN_CODES = new Set<ErrorCode>([
  ErrorCodes.USER_PROFILE_CONFLICT,
  ErrorCodes.ACCOUNT_EXISTS_USE_PASSWORD,
])

/**
 * Domain error codes that map to **413 Content Too Large**.
 *
 * @internal
 */
const PAYLOAD_TOO_LARGE_DOMAIN_CODES = new Set<ErrorCode>([
  ErrorCodes.REQUEST_TOO_LARGE,
])

/**
 * Domain error codes that map to **415 Unsupported Media Type**.
 *
 * @internal
 */
const UNSUPPORTED_MEDIA_DOMAIN_CODES = new Set<ErrorCode>([
  ErrorCodes.UNSUPPORTED_MEDIA_TYPE,
])

/**
 * Maps {@link DomainError} instances to 404, 409, 413, 415 or 400 responses.
 *
 * @param error - Business-rule violation from domain logic
 * @returns **404** when `error.code` is in {@link NOT_FOUND_DOMAIN_CODES}; otherwise **400**
 *
 * @remarks
 * Not-found codes are logged at `warn`; other domain errors at `error`. Neither path reports
 * to Sentry here — capture happens once in the top-level mapper.
 *
 * @internal
 */
export const mapDomainErrorToHttp = (error: DomainError): HttpErrorResponse => {
  if (NOT_FOUND_DOMAIN_CODES.has(error.code)) {
    logger.warn({ err: toLoggableError(error) }, 'Domain error - not found')
    return {
      status: 404,
      body: buildAppErrorBody(error),
    }
  }

  if (CONFLICT_DOMAIN_CODES.has(error.code)) {
    logger.warn({ err: toLoggableError(error) }, 'Domain error - conflict')
    return {
      status: 409,
      body: buildAppErrorBody(error),
    }
  }

  if (PAYLOAD_TOO_LARGE_DOMAIN_CODES.has(error.code)) {
    logger.warn({ err: toLoggableError(error) }, 'Domain error - too large')
    return {
      status: 413,
      body: buildAppErrorBody(error),
    }
  }

  if (UNSUPPORTED_MEDIA_DOMAIN_CODES.has(error.code)) {
    logger.warn({ err: toLoggableError(error) }, 'Domain error - media type')
    return {
      status: 415,
      body: buildAppErrorBody(error),
    }
  }

  logger.error({ err: toLoggableError(error) }, 'Domain error')
  return {
    status: 400,
    body: buildAppErrorBody(error),
  }
}
