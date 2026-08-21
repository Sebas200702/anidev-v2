import { describe, expect, it } from 'vitest'
import { parseControlValues } from '@components/showcase/control-schema'
import type { ShowcaseControl } from '@components/showcase/types'

const controls: ShowcaseControl[] = [
  { name: 'title', label: 'Title', kind: 'text' },
  { name: 'score', label: 'Score', kind: 'number' },
  { name: 'isBanner', label: 'Banner', kind: 'boolean' },
  {
    name: 'status',
    label: 'Status',
    kind: 'select',
    options: ['Currently Airing', 'Finished Airing'],
  },
  { name: 'genres', label: 'Genres', kind: 'json' },
]

const parse = (query: string) =>
  parseControlValues(controls, new URLSearchParams(query))

describe('parseControlValues', () => {
  it('returns nothing when no control is present', () => {
    expect(parse('')).toEqual({})
  })

  it('drops parameters that match no control', () => {
    expect(parse('component=anime-card&id=5&nope=1')).toEqual({})
  })

  it('keeps a text value verbatim, including the empty string', () => {
    expect(parse('title=Frieren')).toEqual({ title: 'Frieren' })
    expect(parse('title=')).toEqual({ title: '' })
  })

  it('coerces a number and drops a non-numeric one', () => {
    expect(parse('score=8.75')).toEqual({ score: 8.75 })
    expect(parse('score=abc')).toEqual({})
    expect(parse('score=')).toEqual({})
  })

  it('parses booleans from their explicit string form', () => {
    expect(parse('isBanner=true')).toEqual({ isBanner: true })
    expect(parse('isBanner=false')).toEqual({ isBanner: false })
    expect(parse('isBanner=maybe')).toEqual({})
  })

  it('takes the last value when a name repeats', () => {
    expect(parse('isBanner=false&isBanner=true')).toEqual({ isBanner: true })
  })

  it('accepts only declared select options', () => {
    expect(parse('status=Finished+Airing')).toEqual({
      status: 'Finished Airing',
    })
    expect(parse('status=Cancelled')).toEqual({})
  })

  it('parses a json control and drops malformed input', () => {
    expect(parse('genres=%5B%7B%22name%22%3A%22Action%22%7D%5D')).toEqual({
      genres: [{ name: 'Action' }],
    })
    expect(parse('genres=%5B%7Bname')).toEqual({})
  })

  it('keeps the valid controls when one value is invalid', () => {
    expect(parse('title=Frieren&score=abc&isBanner=true')).toEqual({
      title: 'Frieren',
      isBanner: true,
    })
  })
})
