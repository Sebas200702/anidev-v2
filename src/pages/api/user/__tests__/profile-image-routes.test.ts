/**
 * Route tests for the profile avatar and banner endpoints.
 *
 * @module pages/api/user/__tests__/profile-image-routes
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: {
    NODE_ENV: 'test',
    APP_BASE_URL: 'http://localhost:4321',
    LOG_LEVEL: 'silent',
  },
}))

const m = vi.hoisted(() => ({
  upload: vi.fn(),
  reset: vi.fn(),
  pickCharacterAvatar: vi.fn(),
  pickAnimeBanner: vi.fn(),
  isStorageEnabled: vi.fn(),
}))
vi.mock('@user/services/profile-image', () => ({ profileImageService: m }))
vi.mock('@lib/storage', () => ({ isStorageEnabled: m.isStorageEnabled }))

const avatar = await import('../[userId]/avatar')
const banner = await import('../[userId]/banner')
const character = await import('../[userId]/avatar/character')
const anime = await import('../[userId]/banner/anime')
const { unsupportedMediaType } = await import('@user/errors')

const profile = {
  id: 'u1',
  name: 'Ada',
  lastName: 'Lovelace',
  avatar: 'http://localhost:9000/b/users/u1/avatar/a.webp',
  banner: null,
}

const form = (size = 10) => {
  const body = new FormData()
  body.append('file', new File([new Uint8Array(size)], 'a.png'))
  return body
}

const context = (
  path: string,
  init: RequestInit,
  { targetId = 'u1', user = { id: 'u1' } as unknown } = {}
) =>
  ({
    request: new Request(
      `http://localhost:4321/api/user/${targetId}/${path}`,
      init
    ),
    params: { userId: targetId },
    locals: { user },
  }) as never

const json = (body: unknown): RequestInit => ({
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

beforeEach(() => {
  vi.clearAllMocks()
  m.isStorageEnabled.mockReturnValue(true)
  for (const method of [
    'upload',
    'reset',
    'pickCharacterAvatar',
    'pickAnimeBanner',
  ] as const) {
    m[method].mockResolvedValue(profile)
  }
})

describe('PUT /api/user/:userId/avatar|banner (upload)', () => {
  it('uploads the owner avatar without caching', async () => {
    const res = await avatar.PUT(
      context('avatar', { method: 'PUT', body: form() })
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    const [input] = m.upload.mock.calls[0]
    expect(input).toMatchObject({
      userId: 'u1',
      targetId: 'u1',
      kind: 'avatar',
    })
    expect(input.upload.bytes.byteLength).toBe(10)
  })

  it('routes banner uploads with kind banner', async () => {
    await banner.PUT(context('banner', { method: 'PUT', body: form() }))
    expect(m.upload.mock.calls[0][0].kind).toBe('banner')
  })

  it('answers 401 without a session', async () => {
    const res = await avatar.PUT(
      context('avatar', { method: 'PUT', body: form() }, { user: null })
    )
    expect(res.status).toBe(401)
  })

  it('answers 403 for another user', async () => {
    const res = await avatar.PUT(
      context('avatar', { method: 'PUT', body: form() }, { targetId: 'u2' })
    )
    expect(res.status).toBe(403)
    expect(m.upload).not.toHaveBeenCalled()
  })

  it('answers 404 STORAGE_NOT_CONFIGURED before reading the body', async () => {
    m.isStorageEnabled.mockReturnValue(false)
    const res = await avatar.PUT(
      context('avatar', { method: 'PUT', body: form() })
    )
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('STORAGE_NOT_CONFIGURED')
  })

  it('answers 413 for a file over 5 MiB', async () => {
    const res = await avatar.PUT(
      context('avatar', { method: 'PUT', body: form(5 * 1024 * 1024 + 1) })
    )
    expect(res.status).toBe(413)
  })

  it('answers 400 for a bad crop and 415 for a disguised file', async () => {
    const bad = form()
    bad.append('x', '-1')
    const res = await avatar.PUT(
      context('avatar', { method: 'PUT', body: bad })
    )
    expect(res.status).toBe(400)

    m.upload.mockRejectedValue(unsupportedMediaType('svg'))
    const svg = await avatar.PUT(
      context('avatar', { method: 'PUT', body: form() })
    )
    expect(svg.status).toBe(415)
  })
})

describe('DELETE /api/user/:userId/avatar|banner', () => {
  it('resets the image', async () => {
    const res = await banner.DELETE(context('banner', { method: 'DELETE' }))
    expect(res.status).toBe(200)
    expect(m.reset).toHaveBeenCalledWith({
      userId: 'u1',
      targetId: 'u1',
      kind: 'banner',
    })
  })

  it('answers 403 for another user', async () => {
    const res = await avatar.DELETE(
      context('avatar', { method: 'DELETE' }, { targetId: 'u2' })
    )
    expect(res.status).toBe(403)
  })
})

describe('gallery picks', () => {
  it('picks a character portrait as avatar', async () => {
    const res = await character.PUT(
      context('avatar/character', json({ characterId: 417 }))
    )
    expect(res.status).toBe(200)
    expect(m.pickCharacterAvatar).toHaveBeenCalledWith({
      userId: 'u1',
      targetId: 'u1',
      characterId: 417,
    })
  })

  it('picks an anime banner even without storage', async () => {
    m.isStorageEnabled.mockReturnValue(false)
    const res = await anime.PUT(context('banner/anime', json({ animeId: 1 })))
    expect(res.status).toBe(200)
    expect(m.pickAnimeBanner).toHaveBeenCalledWith({
      userId: 'u1',
      targetId: 'u1',
      animeId: 1,
    })
  })

  it.each([
    {},
    { characterId: 0 },
    { characterId: 'x' },
    { characterId: 1, extra: 1 },
  ])('rejects body %o with 400', async (body) => {
    const res = await character.PUT(context('avatar/character', json(body)))
    expect(res.status).toBe(400)
  })

  it('answers 403 for another user', async () => {
    const res = await anime.PUT(
      context('banner/anime', json({ animeId: 1 }), { targetId: 'u2' })
    )
    expect(res.status).toBe(403)
  })
})
