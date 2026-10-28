/**
 * Reads a request body while enforcing a byte cap.
 *
 * @module shared/http/read-bounded-bytes
 * @remarks
 * Counts bytes as they stream in, so a chunked upload without
 * `Content-Length` is cut off at the cap instead of being buffered whole.
 */
import { requestTooLarge } from '@shared/errors/request-errors'

const concat = (chunks: Uint8Array[], total: number) => {
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

/**
 * Returns the request body, or throws once it passes `maxBytes`.
 *
 * @param request - Incoming request (its body is consumed)
 * @param maxBytes - Largest accepted body
 * @returns Body bytes (empty when there is no body)
 * @throws {RequestTooLargeError} When the body is larger than `maxBytes`
 */
export const readBoundedBytes = async (
  request: Request,
  maxBytes: number
): Promise<Uint8Array<ArrayBuffer>> => {
  if (!request.body) return new Uint8Array(0)

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    // Sequential by nature: each read depends on the previous chunk.
    const { done, value } = await reader.read() // NOSONAR
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw requestTooLarge(maxBytes)
    }
    chunks.push(value)
  }
  return concat(chunks, total)
}
