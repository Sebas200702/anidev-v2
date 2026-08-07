/**
 * @module @auth/services/session-service-types
 * @remarks Result envelope pairing Better Auth response data with the response
 * headers session operations must forward.
 */

export interface AuthResult<T> {
  data: T
  headers: Headers
}
