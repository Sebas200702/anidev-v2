import {
  optimizeImageBuffer,
  type OptimizeOptions,
} from '@/core/utils/image/optimize'

export const optimizeMediaImageBuffer = (
  buffer: Buffer,
  options: OptimizeOptions = {}
) => {
  return optimizeImageBuffer(buffer, options)
}
