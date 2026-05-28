/**
 * Application-wide structured logger backed by Pino and environment configuration.
 *
 * @module shared/utils/logger-util
 * @remarks
 * Log level and pretty-print transport are derived from {@link env.NODE_ENV} and {@link env.LOG_LEVEL}.
 * Used by {@link mapErrorToHttp} and other shared modules for consistent structured logging.
 *
 * **Development** (`NODE_ENV !== 'production'`)
 * - Default level: `debug` (unless `LOG_LEVEL` overrides)
 * - `pino-pretty` transport with colorized, timestamped single/multi-line output
 *
 * **Production**
 * - Default level: `info`
 * - JSON logs to stdout (no pretty transport)
 *
 * @see {@link logger}
 */

import pino, { type Logger } from 'pino'
import { env } from '@/config/env'

const isDev = env.NODE_ENV !== 'production'

/**
 * Root Pino logger instance for the application.
 *
 * @remarks
 * Import this singleton rather than creating child loggers at module scope unless you need
 * request-scoped bindings (`logger.child({ requestId })`).
 */
export const logger: Logger = pino({
  level: env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
})
