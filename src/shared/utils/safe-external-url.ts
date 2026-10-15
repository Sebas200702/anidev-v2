/**
 * Validates that a URL is safe to fetch from the server side.
 *
 * @module shared/utils/safe-external-url
 * @remarks
 * Only HTTPS absolute URLs are allowed, without embedded credentials, and never
 * pointing at loopback, private, link-local or metadata addresses.
 */
import { isIP } from 'node:net'
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

const isPrivateIPv4 = (ip: string): boolean => {
  const parts = ip.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part)))
    return true

  const [a, b] = parts

  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a >= 224) return true
  return false
}

const isPrivateIPv6 = (ip: string): boolean => {
  const normalized = ip.toLowerCase()
  if (normalized === '::' || normalized === '::1') return true
  if (
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd')
  )
    return true
  if (normalized.startsWith('ff')) return true
  return false
}

export const assertSafeExternalUrl = (value: string): void => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsafe external URL',
      { url: value }
    )
  }

  if (url.protocol !== 'https:') {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsafe external URL',
      { url: value }
    )
  }

  if (url.username !== '' || url.password !== '') {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsafe external URL',
      { url: value }
    )
  }

  const rawHostname = url.hostname.toLowerCase()
  const hostname =
    rawHostname.startsWith('[') && rawHostname.endsWith(']')
      ? rawHostname.slice(1, -1)
      : rawHostname

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === 'metadata.google.internal'
  ) {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsafe external URL',
      { url: value }
    )
  }

  const ipVersion = isIP(hostname)

  if (ipVersion === 4 && isPrivateIPv4(hostname)) {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsafe external URL',
      { url: value }
    )
  }
  if (ipVersion === 6 && isPrivateIPv6(hostname)) {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsafe external URL',
      { url: value }
    )
  }

  if (hostname === '169.254.169.254') {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsafe external URL',
      { url: value }
    )
  }
}
