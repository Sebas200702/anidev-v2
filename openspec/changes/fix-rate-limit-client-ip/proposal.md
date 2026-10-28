# Fix: rate limit breaks image-heavy browsing

## Why

Browsing two or three pages fires `429 RATE_LIMITED` on `/media` and breaks
every image on screen. Two defects:

1. **Wrong limiter key.** `getClientIp` preferred `x-forwarded-for[0]`, which
   behind Cloudflare → Traefik carries a *Cloudflare edge IP* — shared by
   unrelated visitors and rotating per connection. Proof: a clean burst of
   120 requests in 2 s (window expired first) produced **zero 429s**; a
   stable per-visitor key with limit 60 would have tripped ~60 of them.
   Buckets were neither fair (shared across visitors on one edge) nor
   deterministic (a browser on one connection accumulates on one edge).
2. **Media limit too low.** `MEDIA_RATE_LIMIT = 60` counts every `<img>`
   request *before* the response cache; a single dense page issues 20–40.

## What Changes

- `getClientIp` resolves `cf-connecting-ip` first (authoritative visitor IP
  behind Cloudflare), then first `x-forwarded-for` entry, then `x-real-ip`,
  defaulting to `127.0.0.1`.
- `MEDIA_RATE_LIMIT` raised 60 → 300/min (≈7 dense pages per minute; still
  bounds hotlinking abuse at 5 req/s per IP).
- Delta updates the `security-middleware` rate-limiting requirement.

## Impact

- `src/middleware/rate-limit/service.ts` (constants + IP resolution)
- `src/middleware/__tests__/rate-limit.test.ts`
- `openspec/specs/infrastructure/security-middleware/spec.md`
