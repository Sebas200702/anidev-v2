import { z } from 'zod'

export const createApiResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) =>
  z.object({
    data: dataSchema.nullable(),
    status: z.number().int(),
    error: z.string().optional(),
    meta: z.record(z.any(), z.any()).optional(),
  })

export type ApiResponse<
  T extends z.ZodType<
    unknown,
    unknown,
    z.core.$ZodTypeInternals<unknown, unknown>
  >,
> = z.infer<ReturnType<typeof createApiResponseSchema<T>>>
