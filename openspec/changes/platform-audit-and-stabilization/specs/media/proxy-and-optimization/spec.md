## Purpose

Keeps the image/media proxy trustworthy under adversarial input: unsupported paths fail as client errors, optimization parameters are bounded, upstream payloads are size-capped and MIME-restricted, and the default Astro image endpoint never transforms remote sources.

## ADDED Requirements

### Requirement: Unsupported media entities fail as client errors

Media path segments that parse but resolve to no supported entity (e.g. `studio`) MUST fail with a 4xx domain error (`MEDIA_NOT_FOUND` / `INVALID_IMAGE_PATH`), never as a `503` infrastructure error, and MUST NOT trigger monitoring error alerts.

#### Scenario: Studio path is a client error

- **WHEN** a client requests `GET /media/studio/1/poster`
- **THEN** the response is `404` (or `400`) with the corresponding stable code, and no `InfraError` alert is emitted

### Requirement: Optimization parameters are bounded

The media request schema MUST bound the `w` parameter to an allowlisted range (e.g. `16`–`2048`) and normalize equivalent values, so the sharp transform and cache-key space cannot be expanded arbitrarily by a client.

#### Scenario: Out-of-range width is rejected

- **WHEN** a client requests `/media/anime/5114/poster?w=999999`
- **THEN** the request fails validation with `400` before any upstream fetch or sharp transform

### Requirement: Raw media responses are MIME-restricted and nosniff-protected

Raw (non-optimized) media responses MUST allowlist upstream content types (`video/*`, `audio/*`, and image types for image entities), apply `X-Content-Type-Options: nosniff`, and MUST NOT forward arbitrary upstream `text/html` content under the app origin.

#### Scenario: Upstream returns text/html for an episode source

- **WHEN** the upstream source for a raw episode asset responds with `Content-Type: text/html`
- **THEN** the proxy rejects or sanitizes the response and never serves executable HTML from the `/media` origin

### Requirement: Raw media fetches enforce a byte budget

Raw media streaming MUST abort with a typed error when the upstream exceeds the configured byte budget or does not respond within the timeout, and MUST NOT buffer the full asset in process memory or unbounded temporary files.

#### Scenario: Huge upstream body is cut off

- **WHEN** an upstream source streams a body larger than the configured budget
- **THEN** the request aborts cleanly with `503 EXTERNAL_API_ERROR` and no partial body is cached as complete

### Requirement: Remote image transformation stays disabled

The Astro image endpoint (`/_image`) MUST NOT transform remote sources unless an explicit allowlist (`image.remotePatterns`) is configured and security-reviewed; the local branch MUST remain limited to files inside the build output directory.

#### Scenario: Remote transform without allowlist is refused

- **WHEN** a client requests `/_image?href=https://evil.example/avif` with no remote allowlist configured
- **THEN** the endpoint refuses the request with `403` and no remote fetch occurs
