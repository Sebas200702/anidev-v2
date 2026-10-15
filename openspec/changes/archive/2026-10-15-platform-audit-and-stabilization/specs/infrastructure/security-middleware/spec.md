## Purpose

Provides request correlation IDs, HTTP security headers, Dragonfly-backed rate limiting (auth abuse, public API, and media endpoints), a bounded request-body contract, and a navigable-URL policy that keeps `javascript:`-style sinks out of the rendered surface.

## ADDED Requirements

### Requirement: Every response carries a correlation request ID

The middleware pipeline SHALL assign or propagate an `x-request-id` header on every request and include it on the outgoing HTTP response, and SHALL make the ID available to request-scoped logs.

#### Scenario: Request without x-request-id receives a generated UUID

- **WHEN** a client sends a request without an `x-request-id` header
- **THEN** the middleware generates a UUID, sets `x-request-id` on the response headers, and binds it to the request-scoped logger

#### Scenario: Client-provided request ID is propagated

- **WHEN** a client sends a request with a valid `x-request-id` header
- **THEN** the same value is echoed on the response and used in the request-scoped logs

### Requirement: Standard HTTP security headers are applied

The middleware pipeline SHALL set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'` in the CSP, and a `Content-Security-Policy` compatible with Astro SSR, self-hosted assets, and configured monitoring endpoints — delivered as real HTTP headers (not only a `<meta>` element) so they also cover JSON and binary responses such as `/media/*` and `/api/*`.

#### Scenario: Page and API responses include hardening headers

- **WHEN** a client requests `/`, `/api/anime`, or `/media/anime/5114/poster`
- **THEN** the response headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`

#### Scenario: Binary responses are protected from sniffing

- **WHEN** a media asset is proxied with a non-image content type
- **THEN** the response includes `X-Content-Type-Options: nosniff` and a safe `Content-Disposition`, so an upstream `text/html` payload cannot execute in the app origin

### Requirement: Rate limiting protects auth and public API endpoints

The middleware pipeline SHALL enforce per-IP rate limits backed by Dragonfly on `/api/auth/*`, `/api/*`, and `/media/*` routes, returning `429 Too Many Requests` with a `Retry-After` header when exceeded, and degrading fail-open with a warning log if Dragonfly is unreachable.

#### Scenario: Excessive login attempts are rate-limited

- **WHEN** a client exceeds the configured request threshold on `/api/auth/login` within the window
- **THEN** the server responds with `429` and a `Retry-After` header without invoking Better Auth

#### Scenario: Down cache does not block traffic

- **WHEN** Dragonfly is unreachable during a request to `/api/anime`
- **THEN** the rate-limit middleware logs a warning and allows the request to proceed

### Requirement: Credential endpoints resist brute force and credential stuffing

`/api/auth/login` and `/api/auth/register` SHALL enforce stricter per-IP and per-account (email) limits than the general API limiter, count failed attempts, apply temporary lockout/backoff after repeated failures, and log each lockout as a security event without storing credentials.

#### Scenario: Repeated failures against one account are throttled per account

- **WHEN** more than the configured number of failed logins accumulate for the same email within the window (regardless of source IP)
- **THEN** further attempts for that email respond `429` with `Retry-After` until the window elapses

### Requirement: Request bodies are bounded before parsing

Non-GET handlers SHALL reject request bodies whose declared `Content-Length` (or streamed size) exceeds the configured limit (default 1 MiB) with `413 Payload Too Large`, before `request.json()` materializes them.

#### Scenario: Oversized JSON body is rejected cheaply

- **WHEN** a client sends `POST /api/auth/login` with a 500 MiB JSON body
- **THEN** the server responds `413` without buffering the payload

### Requirement: URL-bearing inputs are restricted to same-origin paths

Any input rendered into a navigable attribute (`href`, `src`, `action`) SHALL be validated as a same-origin relative path (`^\/(?!\/)`) or an explicit allowlisted absolute scheme/host; values that fail validation SHALL render as inert text, never as a navigable attribute.

#### Scenario: Showcase control cannot render a javascript: link

- **WHEN** `/showcase?component=service-unavailable&retryHref=javascript:alert(1)` is requested
- **THEN** the rendered anchor does not carry a `javascript:` href

### Requirement: Asset and health routes skip database session resolution

The authentication middleware SHALL skip calling `resolveAuthActor` on `/media/*`, `/api/health*`, and `/showcase` even when session cookies are present, and SHALL cache resolved sessions in Dragonfly for a short TTL invalidated on logout.

#### Scenario: Authenticated user loads 20 poster images

- **WHEN** a browser with an active `session_token` cookie requests 20 `/media/anime/*` URLs
- **THEN** the middleware performs zero database queries for those `/media/*` requests
