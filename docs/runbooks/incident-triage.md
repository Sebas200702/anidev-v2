# Runbook: incident triage via requestId

Every response carries `x-request-id` (generated when the client sends none),
and every access line logs `{ requestId, method, route, status, durationMs,
actor }`. Route error lines carry the same `requestId`.

## Steps

1. Take the `requestId` from the alert, the report, or the response header.
2. `grep '<requestId>'` across app logs: the access line shows route, status,
   duration, and actor class (`user` vs `anonymous`).
3. The matching `Error in API route` line shows `status` + stable `code`
   (`DB_ERROR`, `RATE_LIMITED`, …) without payloads — map it in
   `src/shared/errors/map-error-to-http.ts`.
4. Full throwables (with cause chain) are in Rustrak/Sentry, filterable by
   level: `error` (5xx, paging per `docs/alerts.md`) vs `warning` (4xx noise).
5. Suspected abuse: check `Auth lockout engaged` / `Rate limiter degraded`
   lines and the `429` rate in access lines.

## Severity guide

- Single-user 4xx: no page, fix in the normal flow.
- 5xx rate or readiness failures: page per `docs/alerts.md`, consider
  rollback via `release-rollback.md`.
