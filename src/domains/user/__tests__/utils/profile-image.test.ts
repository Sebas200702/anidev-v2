import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { processProfileImage } from '@user/utils/profile-image'

const solid = (width: number, height: number) =>
  sharp({
    create: { width, height, channels: 3, background: '#3366cc' },
  })

const png = (width: number, height: number) =>
  solid(width, height).png().toBuffer()

describe('processProfileImage', () => {
  it('cover-resizes an avatar to a 512² WebP', async () => {
    const output = await processProfileImage({
      bytes: await png(800, 600),
      kind: 'avatar',
    })
    const meta = await sharp(output).metadata()
    expect(meta).toMatchObject({ format: 'webp', width: 512, height: 512 })
  })

  it('cover-resizes a banner to 1920×534', async () => {
    const output = await processProfileImage({
      bytes: await png(1000, 1000),
      kind: 'banner',
    })
    const meta = await sharp(output).metadata()
    expect(meta).toMatchObject({ width: 1920, height: 534 })
  })

  it('applies EXIF orientation before the crop and strips metadata', async () => {
    // 400×100 stored, orientation 6 → displayed 100×400.
    const rotated = await solid(400, 100)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const output = await processProfileImage({
      bytes: rotated,
      kind: 'avatar',
      crop: { x: 0, y: 300, width: 100, height: 100 },
    })
    const meta = await sharp(output).metadata()
    expect(meta.exif).toBeUndefined()
    expect(meta.orientation).toBeUndefined()
    expect(meta.width).toBe(512)
  })

  it('accepts the first frame of a GIF', async () => {
    const gif = await solid(64, 64).gif().toBuffer()
    const output = await processProfileImage({ bytes: gif, kind: 'avatar' })
    expect((await sharp(output).metadata()).pages).toBeUndefined()
  })

  it('rejects a crop box outside the oriented image with 400', async () => {
    await expect(
      processProfileImage({
        bytes: await png(200, 200),
        kind: 'avatar',
        crop: { x: 150, y: 0, width: 100, height: 100 },
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it.each([
    [
      'SVG',
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'
      ),
    ],
    ['text renamed .png', Buffer.from('definitely not an image')],
  ])('rejects %s with 415', async (_label, bytes) => {
    await expect(
      processProfileImage({ bytes, kind: 'avatar' })
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE' })
  })
})
