# Alert rules (Rustrak/Sentry) — v1

> 4xx captures at `warning` stay out of alerts by design (bot/scraper noise).
> Every rule below fires on `error` only. First response for all: open the
> incident, grab a `requestId` from the access line, follow
> `docs/runbooks/incident-triage.md`.

| # | Signal | Threshold | Window | First response |
|---|--------|-----------|--------|----------------|
| 1 | 5xx rate (`INFRA_*`, `UNKNOWN_ERROR`) | > 1% of responses | 5 min | Check `/api/health/readiness`; recent deploy? Roll back per `release-rollback.md` |
| 2 | Consecutive readiness failures | 3 failed probes | 1 min | DB/Dragonfly down? `docker compose ps`; restart service, check pool saturation |
| 3 | Auth lockout surge (`Auth lockout engaged`) | > 20 lockouts | 10 min | Credential-stuffing wave: keep lockouts, consider lowering `AUTH_RATE_LIMIT` temporarily |
| 4 | Optimized disk cache usage | > 80% of 512 MiB budget | 15 min | Normal growth or abuse: inspect `/media` access lines for hot keys; raise budget only with evidence |

Sentry/Rustrak configuration: create one alert per row with the threshold +
window above; notify the on-call channel. Review thresholds quarterly or after
any traffic step-change.
