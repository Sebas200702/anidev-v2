import { describe, expect, it } from 'vitest'
import { mapProducerCard, mapProducerDetails } from '@producer/mappers/producer'

describe('mapProducerCard', () => {
  it('keeps the name and falls back when there is none', () => {
    expect(mapProducerCard({ malId: 1, name: 'Bones', works: 3 })).toEqual({
      malId: 1,
      name: 'Bones',
      works: 3,
    })
    expect(mapProducerCard({ malId: 2, name: null, works: 0 }).name).toBe(
      'Producer 2'
    )
  })
})

describe('mapProducerDetails', () => {
  it('takes the first title as name and zero-fills missing roles', () => {
    const details = mapProducerDetails({
      producer: { malId: 4, established: '1998-10-01', about: null },
      titles: [
        { title: 'Bones', type: 'Default' },
        { title: 'ボンズ', type: 'Japanese' },
      ],
      credits: [{ role: 'studio', works: 120 }],
    })
    expect(details.name).toBe('Bones')
    expect(details.titles).toHaveLength(2)
    expect(details.counts).toEqual({
      studio: 120,
      producer: 0,
      licensor: 0,
      serialization: 0,
    })
  })

  it('falls back to a generic name without titles', () => {
    const details = mapProducerDetails({
      producer: { malId: 9, established: null, about: null },
      titles: [],
      credits: [],
    })
    expect(details.name).toBe('Producer 9')
  })
})
