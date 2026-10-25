/**
 * Lazily built S3-compatible client (R2, MinIO, any S3 API).
 *
 * @module lib/storage/client
 * @remarks
 * Built on first use so deployments without storage never construct it.
 * Checksums are only sent when an operation requires them: recent SDK
 * defaults add CRC headers that some S3-compatible backends reject.
 */
import { S3Client } from '@aws-sdk/client-s3'
import { env } from '@config/env'

let client: S3Client | undefined

/**
 * Returns the shared S3 client, creating it on the first call.
 *
 * @returns Client configured from the `S3_*` environment
 */
export const getStorageClient = (): S3Client => {
  client ??= new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? '',
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  return client
}
