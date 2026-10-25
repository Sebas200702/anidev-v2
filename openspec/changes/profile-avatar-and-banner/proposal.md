# Proposal: profile avatar and banner (Fase 2, change 2 of 3)

## Problem

Today a profile has an `avatar` URL column and no banner.
- The identity write schema accepts any URL as `avatar`. This is v1's bug #5:
  arbitrary external URLs and tracking pixels can be set as an avatar.
- There is no way to upload an image.

v1 let users upload or take a photo, crop it, or pick an anime character
portrait or anime banner from a gallery. But it did so with:
- a server-side fetch of any URL (SSRF);
- client-chosen file names, which let one user delete another user's files;
- no size limit;
- Pinata IPFS, where nothing can really be deleted.

The decision recorded for Fase 2 is S3-compatible storage: R2 in production,
MinIO in local Docker.

## Scope

Backend only.

1. **Optional S3-compatible storage.**
   - Env: `S3_ENDPOINT`, `S3_REGION` (default `auto`), `S3_BUCKET`,
     `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`. All set or
     none.
   - Without them, the upload routes answer `404 STORAGE_NOT_CONFIGURED`.
     Gallery picks still work.
   - Uses `@aws-sdk/client-s3`.
   - Docker Compose gains `minio` plus a one-shot bucket init job with a
     public-read policy.
2. **Uploads.**
   - `PUT /api/user/:userId/avatar` and `PUT /api/user/:userId/banner`, owner
     only, as `multipart/form-data`:
     - `file` (required);
     - an optional crop box `x`, `y`, `width`, `height` in source pixels.
   - Checks before decoding: at most 5 MiB, and the format is checked from the
     file's bytes, not its declared type. Accepted formats are JPEG, PNG,
     WebP, AVIF and GIF (first frame only).
   - Processing with sharp:
     - EXIF auto-rotate and all metadata stripped;
     - crop or centered cover;
     - avatar 512×512, banner 1920×534;
     - WebP at quality 82.
   - The server generates the key: `users/{userId}/{avatar|banner}/{uuid}.webp`.
   - The previous upload is deleted only after the profile points at the new
     one.
3. **Gallery picks.**
   - `PUT /api/user/:userId/avatar/character` `{ characterId }` sets the
     avatar to a character portrait. The character must exist and must not
     have a provisional name.
   - `PUT /api/user/:userId/banner/anime` `{ animeId }` sets the banner to an
     anime banner. The anime must pass the `safe` floor and have banner media.
   - Both resolve to the existing `/media` URLs. Nothing remote is fetched at
     write time.
4. **Reset.** `DELETE /api/user/:userId/avatar` and
   `DELETE /api/user/:userId/banner` go back to the defaults and delete the
   stored object.
5. **Profile shape.**
   - New `banner` column, plus `avatar_key` and `banner_key`. The keys stay
     server-side and record which object to delete.
   - The read DTO gains `banner`.
   - The identity schema's free `avatar` URL is restricted to our own origins:
     the app's `/media`, `S3_PUBLIC_URL` and Google's picture host.
6. **Serving.**
   - Uploaded files are immutable (new key per upload). They are served from
     `S3_PUBLIC_URL`, an R2 public domain, or MinIO locally.
   - The CSP `img-src` adds that origin from env. The policy stays
     hard-coded otherwise.
   - This avoids the `/media` route, whose numeric-id parser and SSRF guard
     (https only, no localhost) do not fit user files.
7. **Rate limit.** A new `upload` bucket of 10 requests per minute per IP for
   these routes.

## Non-goals

- Client-side cropping UI, camera capture and gallery browsing. These are UI
  work; the backend already has the character and anime media lists.
- Animated avatars. GIFs are flattened to their first frame.
- Moderation or NSFW scanning of uploads.
- Migrating existing `profile.avatar` values. Those are Google URLs or null,
  and they stay valid.

## Breaking changes

`PATCH /api/user/:userId` (and `POST /api/user`) now reject an `avatar` URL
outside the allowed origins with `400`. Clients should use the new avatar
routes. Existing stored values are untouched.
