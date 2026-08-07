/**
 * @module @auth/services/credentials-service-types
 * @remarks Result envelope pairing Better Auth response data with the response
 * headers credential operations must forward.
 */

export interface AuthResult<T> {
  data: T
  headers: Headers
}
