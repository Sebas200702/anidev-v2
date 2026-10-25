# user/profile-images Specification

## Purpose

Let a profile owner set an avatar and a banner, either by uploading an image
or by picking catalog art, without trusting client file names, remote URLs
or unbounded payloads.

## Requirements

### Requirement: Image upload
When storage is configured, the system SHALL serve
`PUT /api/user/:userId/avatar` and `PUT /api/user/:userId/banner` for the
profile owner. The request SHALL be `multipart/form-data` with a `file` part
and an optional crop box (`x`, `y`, `width`, `height`). The server SHALL:
- reject bodies over 5 MiB with `413`;
- detect the format from the file content and accept only JPEG, PNG, WebP,
  AVIF and GIF (first frame);
- strip all metadata, apply EXIF orientation and crop;
- resize to 512×512 (avatar) or 1920×534 (banner), encoded as WebP;
- store the result under a server-generated key;
- return the updated profile.

#### Scenario: Owner uploads an avatar
- **WHEN** the owner uploads a 2 MB PNG with a crop box
- **THEN** the response is `200` and `avatar` is a URL under `S3_PUBLIC_URL`
  ending in `.webp`
- **AND** the stored object is 512×512 WebP without EXIF

#### Scenario: Previous upload is replaced
- **WHEN** an owner who already uploaded an avatar uploads a new one
- **THEN** the profile points at the new object and the previous object is
  deleted

#### Scenario: Disguised or oversized file
- **WHEN** the file is an SVG or a text file renamed `.png`, or the body
  exceeds 5 MiB
- **THEN** the API answers `415 UNSUPPORTED_MEDIA_TYPE` or `413` and stores
  nothing

#### Scenario: Crop box outside the image
- **WHEN** the crop box does not fit inside the decoded image
- **THEN** the API answers `400 VALIDATION_ERROR`

#### Scenario: Storage not configured
- **WHEN** the S3 env vars are missing
- **THEN** both upload routes answer `404 STORAGE_NOT_CONFIGURED`

### Requirement: Gallery picks
The system SHALL serve `PUT /api/user/:userId/avatar/character`
(`{ characterId }`) and `PUT /api/user/:userId/banner/anime` (`{ animeId }`)
for the owner. They SHALL set the image to the catalog's `/media` URL of that
character portrait or anime banner. The id SHALL exist; a character with a
provisional name, an adult-rated anime or an anime without banner media
SHALL answer `400 VALIDATION_ERROR`.

#### Scenario: Character portrait as avatar
- **WHEN** the owner picks character 417
- **THEN** `avatar` becomes `${APP_BASE_URL}/media/character/417/poster/large`
  and any previously uploaded avatar object is deleted

### Requirement: Reset
`DELETE /api/user/:userId/avatar` and `DELETE /api/user/:userId/banner` SHALL
clear the image (the read DTO falls back to the default) and delete any
uploaded object.

#### Scenario: Reset an uploaded banner
- **WHEN** the owner deletes their uploaded banner
- **THEN** `banner` is `null` and the object no longer exists in the bucket

### Requirement: Ownership and limits
Every image route SHALL require a session (`401`) and SHALL only act on the
caller's own profile (`403`). It SHALL answer `404 USER_NOT_FOUND` when the
caller has no profile. Upload routes SHALL be limited to 10 requests per
minute per client IP (`429`).

#### Scenario: Another user's avatar
- **WHEN** a user uploads to `/api/user/<other>/avatar`
- **THEN** the API answers `403` and stores nothing

### Requirement: Avatar URL allowlist
The identity write schema's `avatar` field SHALL accept only URLs under
`APP_BASE_URL/media/`, `S3_PUBLIC_URL` or `https://lh3.googleusercontent.com/`.

#### Scenario: Arbitrary external avatar URL
- **WHEN** a client sends `avatar: "https://tracker.example/pixel.gif"`
- **THEN** the API answers `400 VALIDATION_ERROR`
