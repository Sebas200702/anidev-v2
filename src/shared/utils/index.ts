/**
 * Cross-cutting utilities: structured logging, image/media processing, and string normalization.
 *
 * @module shared/utils
 * @remarks
 * Utilities are stateless helpers except for the singleton {@link logger}. Image helpers depend on
 * domain media config and repositories for asset resolution.
 *
 * @see {@link module:shared/utils/logger-util}
 * @see {@link module:shared/utils/image}
 * @see {@link module:shared/utils/string}
 */

export { logger } from './logger-util'
// Image and string utilities are available via their respective sub-path barrels:
//   import { normalizeImageUrl } from '@shared/utils/image'
//   import { normalizeString } from '@shared/utils/string'
