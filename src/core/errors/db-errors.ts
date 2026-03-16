import { InfraError } from '@/core/errors/errors'
import { ErrorCodes } from '@/core/errors/error-codes'

export function dbError(operation: string, details?: unknown, cause?: unknown) {
  return new InfraError(
    ErrorCodes.DB_ERROR,
    `Database error during ${operation}`,
    details,
    cause
  )
}
