import {
  AuthError,
  DomainError,
  InfraError,
  ValidationError,
} from '@/core/errors/errors'
import { ErrorCodes } from '@/core/errors/error-codes'
import { logger } from '@/core/logging/logger'
import * as SentryNode from '@sentry/node'

type HttpErrorResponse = {
  status: number
  body: {
    code: string
    message: string
    meta?: Record<string, any>
  }
}

export function mapErrorToHttp(error: unknown): HttpErrorResponse {
  if (error instanceof ValidationError) {
    logger.warn({ error }, 'Validation error')
    return {
      status: 400,
      body: {
        code: error.code,
        message: error.message,
        meta: { details: error.details },
      },
    }
  }

  if (error instanceof AuthError) {
    if (
      error.code === ErrorCodes.AUTH_REQUIRED ||
      error.code === ErrorCodes.AUTH_INVALID_TOKEN ||
      error.code === ErrorCodes.AUTH_SESSION_EXPIRED
    ) {
      logger.warn({ error }, 'Auth error - unauthorized')
      return {
        status: 401,
        body: {
          code: error.code,
          message: error.message,
          meta: { details: error.details },
        },
      }
    }

    if (error.code === ErrorCodes.AUTH_FORBIDDEN) {
      logger.warn({ error }, 'Auth error - forbidden')
      return {
        status: 403,
        body: {
          code: error.code,
          message: error.message,
          meta: { details: error.details },
        },
      }
    }
  }

  if (error instanceof DomainError) {
    if (
      error.code === ErrorCodes.ANIME_NOT_FOUND ||
      error.code === ErrorCodes.MUSIC_NOT_FOUND ||
      error.code === ErrorCodes.WATCH_STATE_NOT_FOUND ||
      error.code === ErrorCodes.COLLECTION_NOT_FOUND
    ) {
      logger.warn({ error }, 'Domain error - not found')
      return {
        status: 404,
        body: {
          code: error.code,
          message: error.message,
          meta: { details: error.details },
        },
      }
    }
    logger.error({ error }, 'Domain error')

    return {
      status: 400,
      body: {
        code: error.code,
        message: error.message,
        meta: { details: error.details },
      },
    }
  }

  if (error instanceof InfraError) {
    logger.error({ error }, 'Infra error')
    SentryNode.captureException(error)

    return {
      status: 500,
      body: {
        code: error.code,
        message: 'Internal server error',
        meta: { details: error.details },
      },
    }
  }

  logger.error({ error }, 'Unknown error')
  SentryNode.captureException(error as Error)

  return {
    status: 500,
    body: { code: ErrorCodes.UNKNOWN_ERROR, message: 'Internal server error' },
  }
}
