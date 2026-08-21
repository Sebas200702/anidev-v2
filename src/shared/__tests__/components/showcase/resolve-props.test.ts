import { describe, expect, it } from 'vitest'
import { resolveShowcaseProps } from '@components/showcase/resolve-props'

const fixture = { title: 'Fixture title', score: 7, status: 'Finished Airing' }

describe('resolveShowcaseProps', () => {
  it('falls back to the fixture and reports it', () => {
    expect(resolveShowcaseProps({ fixture, controlValues: {} })).toEqual({
      props: fixture,
      source: 'fixture',
    })
  })

  it('prefers the loaded record and reports it as live', () => {
    const record = { title: 'Frieren', score: 9, status: 'Currently Airing' }

    expect(
      resolveShowcaseProps({ fixture, record, controlValues: {} })
    ).toEqual({ props: record, source: 'live' })
  })

  it('applies control values on top of the loaded record', () => {
    const record = { title: 'Frieren', score: 9, status: 'Currently Airing' }

    expect(
      resolveShowcaseProps({
        fixture,
        record,
        controlValues: { status: 'Not yet aired' },
      })
    ).toEqual({
      props: { title: 'Frieren', score: 9, status: 'Not yet aired' },
      source: 'live',
    })
  })

  it('leaves props without a control untouched', () => {
    const record = { title: 'Frieren', score: 9, status: 'Currently Airing' }
    const { props } = resolveShowcaseProps({
      fixture,
      record,
      controlValues: { title: 'Edited' },
    })

    expect(props.score).toBe(9)
    expect(props.status).toBe('Currently Airing')
  })

  it('applies control values over the fixture when there is no record', () => {
    expect(
      resolveShowcaseProps({ fixture, controlValues: { score: 0 } })
    ).toEqual({
      props: { ...fixture, score: 0 },
      source: 'fixture',
    })
  })
})

describe('resolveShowcaseProps — nested control paths', () => {
  const nestedFixture = {
    anime: { title: 'Fixture', status: 'Finished Airing', score: 7 },
  }

  it('applies a dot-path value into the object prop', () => {
    const { props } = resolveShowcaseProps({
      fixture: nestedFixture,
      controlValues: { 'anime.status': 'Not yet aired' },
    })

    expect(props).toEqual({
      anime: { title: 'Fixture', status: 'Not yet aired', score: 7 },
    })
  })

  it('does not mutate the base record', () => {
    const record = { anime: { title: 'Frieren', score: 9 } }
    resolveShowcaseProps({
      fixture: nestedFixture,
      record,
      controlValues: { 'anime.title': 'Edited' },
    })

    expect(record.anime.title).toBe('Frieren')
  })

  it('creates the missing branch of a path', () => {
    const { props } = resolveShowcaseProps({
      fixture: {},
      controlValues: { 'item.genres': [] },
    })

    expect(props).toEqual({ item: { genres: [] } })
  })

  it('indexes into an array prop', () => {
    const { props } = resolveShowcaseProps({
      fixture: { items: [{ title: 'First' }, { title: 'Second' }] },
      controlValues: { 'items.0.title': 'Edited' },
    })

    expect(props.items).toEqual([{ title: 'Edited' }, { title: 'Second' }])
  })
})
