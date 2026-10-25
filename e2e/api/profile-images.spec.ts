/**
 * E2E tests for profile avatar and banner: uploads to real storage, gallery
 * picks and resets.
 *
 * @module e2e/api/profile-images
 * @remarks
 * Upload specs need the `storage` compose profile (MinIO) and the `S3_*`
 * variables in the Playwright environment; CI provides both. Without
 * `S3_PUBLIC_URL` they are skipped. Multipart writes send
 * `Sec-Fetch-Site: same-origin`, as a browser's same-origin `fetch` does:
 * Astro's `checkOrigin` trusts it before comparing `Origin`.
 */
import type { APIRequestContext } from '@playwright/test'
import sharp from 'sharp'
import { expect, test } from '../fixtures/auth'
import { SEED_CHARACTER_MAL_ID } from '../fixtures/seed-data'
import { SEED_BANNER_ANIME_MAL_ID } from '../fixtures/seed-profile-images'

const storageUrl = process.env.S3_PUBLIC_URL

const createProfile = async (request: APIRequestContext) => {
  const session = await (await request.get('/api/auth/session')).json()
  const created = await request.post('/api/user', {
    data: { name: 'Ada', lastName: 'Lovelace', gender: 'female' },
  })
  expect(created.status()).toBe(201)
  return session.data.user.id as string
}

const png = async () => ({
  name: 'picture.png',
  mimeType: 'image/png',
  buffer: await sharp({
    create: { width: 900, height: 700, channels: 3, background: '#cc3366' },
  })
    .png()
    .toBuffer(),
})

const putImage = (
  request: APIRequestContext,
  path: string,
  multipart: Record<
    string,
    string | { name: string; mimeType: string; buffer: Buffer }
  >
) =>
  request.put(path, { headers: { 'sec-fetch-site': 'same-origin' }, multipart })

test.describe('profile image uploads', () => {
  // Skipped only without S3_PUBLIC_URL (local runs without the `storage`
  // compose profile); CI always provides MinIO, so it runs there.
  test.skip(!storageUrl, 'needs object storage (compose profile `storage`)') // NOSONAR

  test('upload with crop, replace, reset', async ({
    authedRequest,
    request,
  }) => {
    const userId = await createProfile(authedRequest)
    const crop = { x: '100', y: '50', width: '600', height: '600' }

    const first = await putImage(authedRequest, `/api/user/${userId}/avatar`, {
      file: await png(),
      ...crop,
    })
    expect(first.status()).toBe(200)
    const firstUrl: string = (await first.json()).data.avatar
    expect(firstUrl.startsWith(String(storageUrl))).toBe(true)
    expect(firstUrl.endsWith('.webp')).toBe(true)

    const stored = await request.get(firstUrl)
    expect(stored.status()).toBe(200)
    expect(stored.headers()['content-type']).toBe('image/webp')
    const meta = await sharp(await stored.body()).metadata()
    expect([meta.width, meta.height, meta.exif]).toEqual([512, 512, undefined])

    const second = await putImage(authedRequest, `/api/user/${userId}/avatar`, {
      file: await png(),
    })
    const secondUrl: string = (await second.json()).data.avatar
    expect(secondUrl).not.toBe(firstUrl)
    expect((await request.get(firstUrl)).status()).toBe(404)

    const banner = await putImage(authedRequest, `/api/user/${userId}/banner`, {
      file: await png(),
    })
    const bannerUrl: string = (await banner.json()).data.banner
    const reset = await authedRequest.delete(`/api/user/${userId}/banner`)
    expect(reset.status()).toBe(200)
    expect((await reset.json()).data.banner).toBeNull()
    expect((await request.get(bannerUrl)).status()).toBe(404)
  })

  test('rejects an SVG with 415', async ({ authedRequest }) => {
    const userId = await createProfile(authedRequest)
    const res = await putImage(authedRequest, `/api/user/${userId}/avatar`, {
      file: {
        name: 'pixel.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'
        ),
      },
    })
    expect(res.status()).toBe(415)
    expect((await res.json()).code).toBe('UNSUPPORTED_MEDIA_TYPE')
  })

  test('a character pick deletes the uploaded avatar', async ({
    authedRequest,
    request,
    baseURL,
  }) => {
    const userId = await createProfile(authedRequest)
    const upload = await putImage(authedRequest, `/api/user/${userId}/avatar`, {
      file: await png(),
    })
    const uploadedUrl: string = (await upload.json()).data.avatar

    const pick = await authedRequest.put(
      `/api/user/${userId}/avatar/character`,
      {
        data: { characterId: SEED_CHARACTER_MAL_ID },
      }
    )
    expect(pick.status()).toBe(200)
    expect((await pick.json()).data.avatar).toBe(
      `${baseURL}/media/character/${SEED_CHARACTER_MAL_ID}/poster/large`
    )
    expect((await request.get(uploadedUrl)).status()).toBe(404)
  })
})

test.describe('profile image ownership and gallery', () => {
  test('uploading to another user answers 403', async ({ authedRequest }) => {
    await createProfile(authedRequest)
    const res = await putImage(authedRequest, '/api/user/someone-else/avatar', {
      file: await png(),
    })
    expect(res.status()).toBe(403)
  })

  test('an anime banner pick sets the catalog banner', async ({
    authedRequest,
    baseURL,
  }) => {
    const userId = await createProfile(authedRequest)
    const res = await authedRequest.put(`/api/user/${userId}/banner/anime`, {
      data: { animeId: SEED_BANNER_ANIME_MAL_ID },
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).data.banner).toBe(
      `${baseURL}/media/anime/${SEED_BANNER_ANIME_MAL_ID}/banner`
    )
  })
})
