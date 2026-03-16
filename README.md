<div align="center">
	<img src="./public/favicon.svg" alt="AniDev logo" width="92" />

    # AniDev

    **Astro + TypeScript app for anime and music APIs, image optimization, and auth.**

</div>

AniDev v2 currently includes a server-rendered Astro app, domain-driven API modules (`anime`, `music`), Turso + Drizzle persistence, Upstash Redis caching, and Better Auth mounted on Astro API routes.

## Highlights

- Server-side Astro app (`@astrojs/node`, standalone mode)
- Domain-based architecture (`src/domains/*`) with repositories, services, mappers and schemas
- Typed request validation with Zod + shared API response shape
- Centralized error mapping (`400/401/403/404/500`) with Sentry integration points
- Better Auth with Drizzle adapter and SQLite-compatible schema
- Image proxy endpoint with optimization (`sharp`) and cached fallbacks

## Tech Stack

- **Runtime:** Node.js `>=22.12.0`
- **Framework:** Astro 6
- **Database:** Turso (LibSQL) + Drizzle ORM
- **Cache:** Upstash Redis
- **Auth:** Better Auth
- **Validation:** Zod
- **Logging / Monitoring:** Pino + Sentry
- **Styling:** Tailwind CSS v4

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create local env file

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

3. Fill required variables in `.env`

4. Run development server

```bash
npm run dev
```

App runs on `http://localhost:4321` by default.

> [!IMPORTANT]
> This project validates env vars at startup. Missing or invalid values in `.env` will fail fast.

## Environment Variables

Defined and validated in `src/config/env.ts`:

| Variable                   | Required | Description                                        |
| -------------------------- | -------- | -------------------------------------------------- |
| `NODE_ENV`                 | No       | `development`, `test`, or `production`             |
| `TURSO_DATABASE_URL`       | Yes      | Turso LibSQL database URL                          |
| `TURSO_AUTH_TOKEN`         | Yes      | Turso auth token                                   |
| `BETTER_AUTH_SECRET`       | Yes      | Better Auth secret (min 32 chars)                  |
| `BETTER_AUTH_URL`          | Yes      | App base URL used by Better Auth                   |
| `UPSTASH_REDIS_REST_URL`   | Yes      | Upstash Redis REST URL                             |
| `UPSTASH_REDIS_REST_TOKEN` | Yes      | Upstash Redis REST token                           |
| `SENTRY_DSN`               | No       | Sentry DSN                                         |
| `LOG_LEVEL`                | No       | `trace`, `debug`, `info`, `warn`, `error`, `fatal` |

## Scripts

| Command                 | Purpose                                |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Start local Astro dev server           |
| `npm run build`         | Build production output                |
| `npm run preview`       | Run built app locally                  |
| `npm run auth:generate` | Generate Better Auth schema/migrations |
| `npm run auth:migrate`  | Run Better Auth migrations             |
| `npm run db:generate`   | Generate Drizzle migrations            |
| `npm run db:migrate`    | Apply Drizzle migrations               |
| `npm run format`        | Format project with Prettier           |

## Better Auth

- Config file: `src/core/auth/better-auth.ts`
- Astro handler mount: `src/pages/api/auth/[...all].ts`
- Auth routes are exposed under: `/api/auth/*`

Quick health check:

```http
GET /api/auth/ok
```

Expected response:

```json
{ "status": "ok" }
```

> [!NOTE]
> Better Auth CLI commands are already wired with `--config src/core/auth/better-auth.ts`.

## API Endpoints

### Anime

- `GET /api/anime/:malId`
- `GET /api/anime/:malId/full`
- `GET /api/anime/:malId/characters`
- `GET /api/anime/:malId/staff`

### Music

- `GET /api/music/:id`

### Media Proxy

- `GET /api/proxy?url=<image-url>&w=<width>&q=<quality>&fm=<webp|avif>`

### Auth

- `ALL /api/auth/*`

## Project Structure

```text
src/
├── config/      # app config + env parsing
├── core/        # auth, db, cache, errors, http middleware, logging, utils
├── domains/     # business modules (anime, music, auth, search, etc.)
├── pages/       # Astro pages + API routes
├── services/    # cross-domain services (eg image proxy)
├── styles/      # global styles
└── ui/          # layouts and UI components
```

## Current UI Routes

- `/` (base page)
- `/anime/:malId` (redirects to slug route)
- `/anime/:malId/:slug` (anime details page)

## Notes

> [!TIP]
> The API layer uses a common validation/error pipeline (`withZodValidation` + `mapErrorToHttp`) to keep responses consistent.

> [!NOTE]
> Image optimization uses caching and graceful fallback to `public/placeholder.webp` when source fetch fails.
