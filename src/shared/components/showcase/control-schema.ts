/**
 * Query-string decoding for showcase controls.
 *
 * @module shared/components/showcase/control-schema
 * @remarks
 * Each control kind gets a Zod schema, and values are parsed **one control at a
 * time** on purpose: a single unusable value must fall back to its default
 * without discarding the rest of the URL. Unknown parameters never reach a
 * component.
 *
 * @see {@link ShowcaseControl}
 */
import { z } from 'zod'
import type { ShowcaseControl, ShowcaseProps } from './types'

const jsonSchema = z.string().transform((value, ctx) => {
  try {
    return JSON.parse(value) as unknown
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Malformed JSON' })
    return z.NEVER
  }
})

/**
 * Builds the schema that validates one control's raw string value.
 *
 * @param control - The declared control
 * @returns A schema producing the prop value, or failing so the default survives
 *
 * @example
 * ```typescript
 * controlValueSchema({ name: 'score', label: 'Score', kind: 'number' })
 *   .safeParse('8.75') // { success: true, data: 8.75 }
 * ```
 */
export const controlValueSchema = (control: ShowcaseControl) => {
  if (control.kind === 'boolean') {
    return z.enum(['true', 'false']).transform((value) => value === 'true')
  }
  if (control.kind === 'number') {
    // An empty field means "not set", not zero — so the loaded value survives.
    return z
      .string()
      .refine((value) => value.trim() !== '')
      .transform((value) => Number(value))
      .refine(Number.isFinite)
  }
  if (control.kind === 'select') {
    return z.literal([...control.options])
  }
  if (control.kind === 'json') {
    return jsonSchema
  }
  return z.string()
}

/**
 * Decodes the controlled props carried by a URL.
 *
 * @param controls - The entry's declared controls
 * @param params - The request's search parameters
 * @returns Only the controls present and valid; every other prop keeps its
 * loaded value
 *
 * @remarks
 * A repeated parameter resolves to its **last** value, which is what lets a
 * checkbox ship a `false` hidden field ahead of its `true` one and still work
 * without client JavaScript.
 *
 * @example
 * ```typescript
 * parseControlValues(controls, new URLSearchParams('title=Frieren&score=abc'))
 * // { title: 'Frieren' }
 * ```
 */
export const parseControlValues = (
  controls: readonly ShowcaseControl[],
  params: URLSearchParams
): ShowcaseProps => {
  const values: ShowcaseProps = {}

  for (const control of controls) {
    const raw = params.getAll(control.name).at(-1)
    if (raw === undefined) continue

    const parsed = controlValueSchema(control).safeParse(raw)
    if (parsed.success) values[control.name] = parsed.data
  }

  return values
}
