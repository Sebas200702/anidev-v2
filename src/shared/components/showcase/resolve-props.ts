/**
 * Composes the props a showcase playground renders with.
 *
 * @module shared/components/showcase/resolve-props
 * @remarks
 * Most components in this codebase take a single object prop (`anime`, `item`,
 * `animeDetails`), so a control name may be a **dot path** (`anime.status`) and
 * is applied into a copy of the base record — the loaded value is never mutated.
 */
import type { ResolvedShowcaseProps, ShowcaseProps } from './types'

interface ResolveShowcasePropsInput {
  fixture: ShowcaseProps
  record?: ShowcaseProps
  controlValues: ShowcaseProps
}

const copyOf = (value: unknown): ShowcaseProps => {
  if (Array.isArray(value)) return [...value] as unknown as ShowcaseProps
  if (typeof value === 'object' && value !== null) {
    return { ...(value as ShowcaseProps) }
  }
  return {}
}

const setPath = (target: ShowcaseProps, path: string, value: unknown) => {
  const keys = path.split('.')
  const last = keys.pop()
  if (!last) return

  let node = target
  for (const key of keys) {
    node[key] = copyOf(node[key])
    node = node[key] as ShowcaseProps
  }
  node[last] = value
}

/**
 * Merges the three prop layers.
 *
 * @param input - The entry's fixture, the loaded record (when there is one) and
 * the decoded control values
 * @returns The props to render with, and whether the base was live or a fixture
 *
 * @remarks
 * Order is `fixture → record → controls`. The fixture is the floor, so a
 * playground always renders; the controls win last, which is what lets a real
 * record be forced into a state it does not have.
 *
 * @example
 * ```typescript
 * resolveShowcaseProps({
 *   fixture,
 *   record,
 *   controlValues: { 'anime.status': 'Not yet aired' },
 * })
 * ```
 */
export const resolveShowcaseProps = ({
  fixture,
  record,
  controlValues,
}: ResolveShowcasePropsInput): ResolvedShowcaseProps => {
  const props: ShowcaseProps = { ...(record ?? fixture) }

  for (const [path, value] of Object.entries(controlValues)) {
    setPath(props, path, value)
  }

  return { props, source: record ? 'live' : 'fixture' }
}
