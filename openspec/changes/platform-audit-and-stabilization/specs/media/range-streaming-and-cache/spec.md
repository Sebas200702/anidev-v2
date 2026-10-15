## Purpose

Provides zero-buffer HTTP `Range` (`206 Partial Content`) streaming for episode and music media, version/resolution-aware cache keys, SSRF and timeout guards on upstream fetches, and bounded disk caching for optimized images.

## ADDED Requirements

### Requirement: Raw media keys include version and resolution

The media cache MUST include both `version` and `resolution` segments when building raw media and raw metadata cache keys so distinct variants of the same music track or episode never collide.

#### Scenario: Different resolutions of the same music track

- **WHEN** a client requests `/media/music/42/video?version=1&resolution=720p` followed by `/media/music/42/video?version=1&resolution=1080p`
- **THEN** the cache stores and resolves two distinct metadata keys and serves the matching upstream URL for each request

### Requirement: Raw media metadata is serialized once

The media cache store MUST pass `RawMeta` objects directly to `cacheSet` and `cacheGet` without applying redundant `JSON.stringify` or `JSON.parse` calls.

#### Scenario: Metadata round-trip

- **WHEN** `writeRawMeta` stores `{ src: 'https://cdn.example.com/op1.webm' }` and `readRawMeta` reads it back
- **THEN** `readRawMeta` returns the typed `RawMeta` object after a single JSON parse inside `cacheGet`

### Requirement: Episode and music media support HTTP Range streaming without full-file RAM buffering

The `/media/[...path]` endpoint MUST stream episode and music assets using a `ReadableStream` without buffering the full file in memory, forwarding `Range` headers and returning `206 Partial Content` with `Accept-Ranges: bytes` and `Content-Range` when a byte range is requested.

#### Scenario: Client seeks within a video or audio stream

- **WHEN** a client sends `GET /media/music/1/video` with header `Range: bytes=0-1023`
- **THEN** the server forwards the `Range` header to the upstream asset, responds with status `206 Partial Content`, includes `Content-Range` and `Accept-Ranges: bytes`, and streams only the requested byte slice

#### Scenario: Full stream request without Range header

- **WHEN** a client sends `GET /media/music/1/audio` without a `Range` header
- **THEN** the server responds with `200 OK`, `Accept-Ranges: bytes`, and streams the upstream response body without writing the full file to unbounded temporary disk files

### Requirement: Outbound media fetches enforce timeouts and SSRF protection

The media fetch service MUST reject non-HTTPS URLs, URLs with embedded credentials, and loopback, private, or link-local IP addresses, and MUST apply a default timeout via `AbortSignal.timeout` when no signal is provided.

#### Scenario: Private or loopback upstream URL is rejected

- **WHEN** a media asset resolves to `http://127.0.0.1/secret` or `https://169.254.169.254/latest/meta-data`
- **THEN** the media fetch service throws a typed error before opening a network connection

#### Scenario: Hung upstream CDN times out

- **WHEN** an upstream CDN does not respond within the configured fetch timeout
- **THEN** the request aborts cleanly and maps to `503 EXTERNAL_API_ERROR` with a `Retry-After` header

### Requirement: Optimized images use bounded disk cache and immutable HTTP headers

Optimized image buffers produced by Sharp MUST be cached on local disk with a bounded size limit rather than as base64 strings inside Dragonfly, and `/media/*` image responses MUST include `Cache-Control: public, max-age=31536000, immutable`.

#### Scenario: Optimized image response headers and storage

- **WHEN** a client requests `GET /media/anime/5114/poster/large?w=400&q=85`
- **THEN** the response includes `Cache-Control: public, max-age=31536000, immutable` and no base64 image buffer is written to Dragonfly
