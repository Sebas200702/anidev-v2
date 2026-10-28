# Tasks

## 1. Diagnose
- [x] 1.1 Reproduce 429 against production `/media` and prove the limiter key rotates (burst after window expiry → 0×429)

## 2. Test-first
- [x] 2.1 Failing test: `getClientIp` prefers `cf-connecting-ip` over `x-forwarded-for`
- [x] 2.2 Failing test: media bucket limit is 300/min

## 3. Implement
- [x] 3.1 Reorder `getClientIp` header precedence
- [x] 3.2 Raise `MEDIA_RATE_LIMIT` 60 → 300

## 4. Verify & ship
- [ ] 4.1 Verification gate green locally (format → check → check:types → test → build)
- [ ] 4.2 PR to master, CI green (gate + e2e), merge
- [ ] 4.3 Redeploy app on Dokploy and confirm no 429 while browsing image-heavy pages
