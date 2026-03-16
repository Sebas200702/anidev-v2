import type { APIContext } from 'astro'
import type { ZodType } from 'zod'
import { ValidationError } from '@/core/errors/errors'
import { ErrorCodes } from '@/core/errors/error-codes'

type ValidatedHandler<T> = (
  context: APIContext & { validated: T }
) => Response | Promise<Response>

export function withZodValidation<T>(schema: ZodType<T>) {
  return (handler: ValidatedHandler<T>) => {
    return async (context: APIContext) => {
      const url = new URL(context.request.url)

      const data = {
        params: context.params,
        query: Object.fromEntries(url.searchParams.entries()),
        body:
          context.request.method === 'GET'
            ? null
            : await context.request.json().catch(() => null),
      }

      const result = schema.safeParse(data)

      if (!result.success) {
        throw new ValidationError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request',
          { issues: result.error.issues }
        )
      }

      return handler({
        ...context,
        validated: result.data,
      })
    }
  }
}
