/**
 * Public exports for the shared service-unavailable component.
 *
 * @module shared/components/service-unavailable
 * @remarks
 * Re-exports {@link ServiceUnavailable} for degraded SSR pages when an
 * {@link InfraError} turns a page fetch into a 503 instead of a crash.
 *
 * @see {@link module:shared/errors/app-error} — `InfraError`
 */

export { default as ServiceUnavailable } from './service-unavailable.astro'
