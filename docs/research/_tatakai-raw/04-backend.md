# 04-backend

Tatakai's backend and data layer are built around Supabase, utilizing Edge Functions for an API proxy (`TatakaiAPI`), PostgreSQL for data storage with Row Level Security (RLS), and a Cloudflare Worker for streaming media. The system employs caching, rate limiting, and comprehensive security measures including CSP and security headers. Telemetry and observability are handled through PostHog, Sentry, and Datadog. 

## TatakaiAPI (Edge Functions)
The `TatakaiAPI` is implemented as Supabase Edge Functions, primarily located in `supabase/functions/tatakai-api/` . It acts as a proxy, cache, and authentication layer for various external APIs like AniList and MyAnimeList .

### API Clients
The frontend interacts with the `TatakaiAPI` through client-side modules such as `src/lib/api/api-client.ts`  and `src/lib/mapping/client.ts` . The `TATAKAI_API_URL` is resolved using `resolveApiV3Base()` to determine the correct backend endpoint . For cross-origin requests, specific headers like `Accept: application/json` are used, while non-safelisted headers are avoided to prevent CORS preflight issues .

### Caching and Data-Fetching Strategy
The `TatakaiAPI` employs a Redis-backed caching mechanism for GET requests, with a configurable Time-To-Live (TTL) per route . The `cacheMiddleware` in `supabase/functions/tatakai-api/_shared/middleware.ts` checks for cached responses before forwarding requests to upstream APIs . Client-side, `src/lib/mapping/client.ts` also implements a short-lived in-memory cache to reduce latency for frequently accessed mapping endpoints . This client-side cache is bounded and sweeps expired entries .

### Edge Worker
A Cloudflare Worker located in `cloudflare-worker/` serves as a streaming proxy for media assets . It handles cross-origin streaming for video segments, HLS playlists, and subtitles, forwarding client `Range:` headers and rewriting HLS playlist URIs to route back through the worker . The worker includes security controls like a password gate and an SSRF guard (`isBlockedHost()`) to prevent abuse .

### Security Headers/CSP
Tatakai enforces strict Content Security Policy (CSP) directives and HTTP security headers . These are defined in `src/lib/securityHeaders.ts` , mirrored in `vercel.json` for Vercel deployments , and implemented in `scripts/ptero-start.mjs` for self-hosted environments . The CSP restricts resource loading, allowing specific domains for scripts, styles, images, and connections . Other security headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Strict-Transport-Security` .

### Rate Limiting
Rate limiting is implemented in the `TatakaiAPI` via `rateLimitMiddleware` in `supabase/functions/tatakai-api/_shared/middleware.ts` . It uses a sliding window approach, per-user and per-route, with counts stored in Redis . Sensitive endpoints, such as the home server's `/api/home/auth/login`, also have dedicated tight rate-limiting buckets .

### Telemetry/Observability
Tatakai integrates several tools for telemetry and observability:
*   **Client Error Logging**: The `logClientError()` utility in `src/lib/errorLogger.ts` handles unhandled errors, generates unique error IDs, extracts user context, and can persist errors to the `admin_logs` Supabase table or forward them to Discord webhooks .
*   **PostHog Telemetry**: `src/lib/posthog.ts` provides privacy-focused product analytics, enforcing checks for Do-Not-Track and Global Privacy Control, and using a bounded in-memory queue for events .
*   **Sentry Error Tracking**: `src/lib/sentry.ts` initializes Sentry for both client and server environments, capturing exceptions with environment-specific configurations .
*   **Datadog Integration**: Datadog APM and Real User Monitoring (RUM) endpoints are whitelisted in the CSP for infrastructure and performance telemetry .
*   **Dev Console**: For native mobile environments, `src/components/debug/DevConsole.tsx` provides an in-app terminal console overlay that intercepts and filters console logs .

## Supabase Schema/RLS Approach
Tatakai uses Supabase for its data layer, which includes PostgreSQL, Auth, Realtime, and Storage .

### Schema
Key tables in the Supabase schema include `profiles`, `media_lists`, `media_entries`, `watch_progress`, `downloads`, and `extensions` . Migrations are managed through versioned SQL files in `supabase/migrations/` .

### Row Level Security (RLS)
RLS is enforced on all tables to protect data, with policies defined in the migrations . A critical security audit finding (DB-1) highlighted that Supabase's default settings grant `anon` and `authenticated` `ALL` privileges on new tables without RLS, making them writable by anyone with the public anon key . This was addressed by explicitly enabling RLS and defining policies, such as public read access for `app_config` but admin-only writes, and revoking client privileges for backend-owned tables . The `scripts/check-security-baseline.mjs` script includes a check (`DB-2`) to ensure every new table has an RLS decision .

## Notes
The prompt mentions "API clients" which could also refer to external API clients like Jikan or AniList. However, the provided context focuses on how Tatakai's internal API clients interact with its own backend services. The `src/lib/api/api-client.ts` file primarily deals with internal API calls and transformations, while `src/lib/mapping/client.ts` specifically handles calls to the `TatakaiAPI`'s mapping endpoints. 

Wiki pages you might want to explore:
- [Edge Worker, Security Headers & Telemetry (Snozxyx/Tatakai)](/wiki/Snozxyx/Tatakai#6.4)
- [Security Model & Hardening (Snozxyx/Tatakai)](/wiki/Snozxyx/Tatakai#6.5)

View this search on DeepWiki: https://deepwiki.com/search/describe-in-technical-detail-t_fc03a35e-fd63-46ad-bcdc-13d31e607bb4

