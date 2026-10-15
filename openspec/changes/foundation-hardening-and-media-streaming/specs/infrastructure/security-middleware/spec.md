## Purpose

Provides request correlation IDs, HTTP security headers, Dragonfly-backed rate limiting, and zero-DB-hit session skipping for asset and health routes.

## ADDED Requirements

### Requirement: Every response carries a correlation request ID

The middleware pipeline SHALL assign or propagate an `x-request-id` header on every request and include it on the outgoing HTTP response.

#### Scenario: Request without x-request-id receives a generated UUID

- **WHEN** a client sends a request without an `x-request-id` header
- **THEN** the middleware generates a UUID and sets `x-request-id` on the response headers

### Requirement: Standard HTTP security headers are applied

The middleware pipeline SHALL set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy` compatible with Astro SSR, self-hosted assets, and configured monitoring endpoints.

#### Scenario: Page and API responses include hardening headers

- **WHEN** a client requests `/` or `/api/anime`
- **THEN** the response headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`

### Requirement: Rate limiting protects auth and public API endpoints

The middleware pipeline SHALL enforce per-IP rate limits backed by Dragonfly on `/api/auth/*` and `/api/*` routes, returning `429 Too Many Requests` with a `Retry-After` header when exceeded, and degrading fail-open if Dragonfly is unreachable.

#### Scenario: Excessive login attempts are rate-limited

- **WHEN** a client exceeds the configured request threshold on `/api/auth/login` within the window
- **THEN** the server responds with `429` and a `Retry-After` header without invoking Better Auth

#### Scenario: Down cache does not block traffic

- **WHEN** Dragonfly is unreachable during a request to `/api/anime`
- **THEN** the rate-limit middleware logs a warning and allows the request to proceed

### Requirement: Asset and health routes skip database session resolution

The authentication middleware SHALL skip calling `resolveAuthActor` on `/media/*`, `/api/health*`, and `/showcase` even when session cookies are present, and SHALL cache resolved sessions in Dragonfly for a short TTL invalidated on logout.

#### Scenario: Authenticated user loads 20 poster images

- **WHEN** a browser with an active `session_token` cookie requests 20 `/media/anime/*` URLs
- **THEN** the middleware performs zero database queries for those `/media/*` requests
