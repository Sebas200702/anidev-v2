## MODIFIED Requirements

### Requirement: Rate limiting protects auth and public API endpoints

The middleware pipeline SHALL enforce per-IP rate limits backed by Dragonfly on `/api/auth/*`, `/api/*`, and `/media/*` routes, returning `429 Too Many Requests` with a `Retry-After` header when exceeded, and degrading fail-open with a warning log if Dragonfly is unreachable. The client IP SHALL resolve from `cf-connecting-ip` first — the authoritative visitor IP behind Cloudflare — then the first `x-forwarded-for` entry, then `x-real-ip`, defaulting to `127.0.0.1`. Media requests SHALL use a bucket of 300 requests per minute so image-heavy pages stay within the budget.

#### Scenario: Excessive login attempts are rate-limited

- **WHEN** a client exceeds the configured request threshold on `/api/auth/login` within the window
- **THEN** the server responds with `429` and a `Retry-After` header without invoking Better Auth

#### Scenario: Down cache does not block traffic

- **WHEN** Dragonfly is unreachable during a request to `/api/anime`
- **THEN** the rate-limit middleware logs a warning and allows the request to proceed

#### Scenario: Image-heavy browsing does not trip the media bucket

- **WHEN** a visitor loads dense anime pages issuing a few hundred `/media` requests within a minute from a single IP
- **THEN** the responses are served normally — the media bucket is 300 requests per minute, keyed on the visitor IP from `cf-connecting-ip`
