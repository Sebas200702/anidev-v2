import type { ErrorCode } from '@/core/errors/error-codes'

export type ErrorSeverity = 'info' | 'warn' | 'error' | 'critical'

export abstract class BaseError extends Error {
  readonly code: ErrorCode
  readonly severity: ErrorSeverity
  readonly details?: unknown
  readonly cause?: unknown

  protected constructor(
    name: string,
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = 'error',
    details?: unknown,
    cause?: unknown
  ) {
    super(message)
    this.name = name
    this.code = code
    this.severity = severity
    this.details = details
    this.cause = cause

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class DomainError extends BaseError {
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    cause?: unknown
  ) {
    super('DomainError', code, message, 'error', details, cause)
  }
}

export class InfraError extends BaseError {
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    cause?: unknown
  ) {
    super('InfraError', code, message, 'critical', details, cause)
  }
}

export class ValidationError extends BaseError {
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    cause?: unknown
  ) {
    super('ValidationError', code, message, 'warn', details, cause)
  }
}

export class AuthError extends BaseError {
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    cause?: unknown
  ) {
    super('AuthError', code, message, 'warn', details, cause)
  }
}
