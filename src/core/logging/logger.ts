import pino, { type Logger } from 'pino'
import { env } from '@/config/env'
const isDev = env.NODE_ENV !== 'production'

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
