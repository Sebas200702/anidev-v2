/**
 * Security headers applied to every response.
 *
 * @module middleware/security-headers/service
 */
export const applySecurityHeaders = <T>(response: T, requestId: string): T => {
  if (!(response instanceof Response)) return response
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-content-type-options', 'nosniff')
  response.headers.set('x-frame-options', 'DENY')
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'strict-transport-security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }
  return response
}
