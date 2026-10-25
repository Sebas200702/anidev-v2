/**
 * S3-compatible object storage (R2, MinIO).
 *
 * @module lib/storage
 */
export { isStorageEnabled } from './config'
export { deleteObject, publicUrl, putObject } from './storage'
