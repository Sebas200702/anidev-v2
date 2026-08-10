/**
 * Tests for the user identity reverse mapper.
 *
 * @module domains/user/__tests__/mappers/user-identity-to-db
 * @remarks
 * Validates the API identity fields used by `POST /api/user` and
 * `PATCH /api/user/:userId` are projected to a DB insert/update row that
 * matches the `profile` schema, with the session user id as `profile.id`
 * and list fields initialized as empty CSV on create.
 */
import { describe, expect, it } from 'vitest'

import {
  mapProfileIdentityPatchToDb,
  mapProfileIdentityToDb,
} from '@user/mappers/user-identity'

describe('mapProfileIdentityToDb', () => {
  it('maps required identity fields to DB columns for create', () => {
    const result = mapProfileIdentityToDb({
      id: 'session-user-123',
      input: {
        body: {
          name: 'Ada',
          lastName: 'Lovelace',
          gender: 'female',
        },
        params: {},
        query: {},
      },
    })

    expect(result).toEqual({
      id: 'session-user-123',
      userId: 'session-user-123',
      name: 'Ada',
      lastName: 'Lovelace',
      gender: 'female',
      avatar: null,
      birthday: null,
      favoriteAnimes: '',
      favoriteGenres: '',
      favoriteStudios: '',
      frequency: null,
      fanaticLevel: null,
      preferredFormat: null,
      watchedAnimes: '',
    })
  })

  it('includes optional avatar and birthday when provided', () => {
    const result = mapProfileIdentityToDb({
      id: 'session-user-123',
      input: {
        body: {
          name: 'Ada',
          lastName: 'Lovelace',
          gender: 'female',
          avatar: 'https://cdn.example.com/ada.png',
          birthday: '1815-12-10',
        },
        params: {},
        query: {},
      },
    })

    expect(result.avatar).toBe('https://cdn.example.com/ada.png')
    expect(result.birthday).toBe('1815-12-10')
  })
})

describe('mapProfileIdentityPatchToDb', () => {
  it('includes only the identity fields supplied in the input', () => {
    const result = mapProfileIdentityPatchToDb({
      body: { name: 'Grace' },
      params: { userId: 'session-user-123' },
      query: {},
    })

    expect(result).toEqual({ name: 'Grace' })
    expect(Object.keys(result)).toEqual(['name'])
  })

  it('maps every provided identity field into the patch', () => {
    const result = mapProfileIdentityPatchToDb({
      body: {
        name: 'Grace',
        lastName: 'Hopper',
        avatar: 'https://cdn.example.com/grace.png',
        birthday: '1906-12-09',
        gender: 'female',
      },
      params: { userId: 'session-user-123' },
      query: {},
    })

    expect(result).toEqual({
      name: 'Grace',
      lastName: 'Hopper',
      avatar: 'https://cdn.example.com/grace.png',
      birthday: '1906-12-09',
      gender: 'female',
    })
  })
})
