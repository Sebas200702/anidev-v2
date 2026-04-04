<div align="center">
  <img src="./public/favicon.svg" alt="AniDev logo" width="92" />

# AniDev

**Astro + TypeScript platform for anime and music APIs, image optimization, and authentication.**

</div>

AniDev  is a modern, server-rendered Astro application designed for high-performance anime and music data APIs, with robust authentication, image proxying, and a clean, domain-driven architecture. Built for extensibility and reliability, it leverages Turso (LibSQL), Drizzle ORM, Upstash Redis, and Better Auth for a seamless developer and user experience.

---

## Features

- **Server-side Astro 6** with standalone Node.js output
- **Domain-driven modules** for anime, music, auth, and more (`src/domains/*`)
- **Typed API validation** using Zod and shared response schemas
- **Centralized error handling** with Sentry integration
- **Better Auth**: secure, extensible authentication (Drizzle adapter, SQLite schema)
- **Image proxy endpoint** with `sharp` optimization and Redis caching
- **Clean, modular codebase** for easy extension and maintenance

---

## Tech Stack

- **Runtime:** Node.js `>=22.12.0`
- **Framework:** Astro 6
- **Database:** Turso (LibSQL) + Drizzle ORM
- **Cache:** Upstash Redis
- **Auth:** Better Auth
- **Validation:** Zod
- **Logging/Monitoring:** Pino, Sentry
- **Styling:** Tailwind CSS v4

---

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Copy and configure environment variables**

   ```bash
   # macOS / Linux
   cp .env.example .env

   # Windows PowerShell
   Copy-Item .env.example .env
   ```

   Edit `.env` and fill in all required variables.

3. **Run the development server**

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:4321](http://localhost:4321).

> [!IMPORTANT]
> Environment variables are validated at startup. Missing or invalid values will cause the app to fail fast.

---

## Environment Variables

All variables are defined and validated in [`src/config/env.ts`](src/config/env.ts):

| Variable                   | Required | Description                                        |
| -------------------------- | -------- | -------------------------------------------------- |
| `NODE_ENV`                 | No       | `development`, `test`, or `production`             |
| `TURSO_DATABASE_URL`       | Yes      | Turso LibSQL database URL                          |
| `TURSO_AUTH_TOKEN`         | Yes      | Turso auth token                                   |
| `BETTER_AUTH_SECRET`       | Yes      | Better Auth secret (min 32 chars)                  |
| `APP_BASE_URL`             | No       | Public app base URL (fallback: `BETTER_AUTH_URL`) |
| `BETTER_AUTH_URL`          | Yes      | Base URL used by Better Auth callbacks             |
| `UPSTASH_REDIS_REST_URL`   | Yes      | Upstash Redis REST URL                             |
| `UPSTASH_REDIS_REST_TOKEN` | Yes      | Upstash Redis REST token                           |
| `SENTRY_DSN`               | No       | Sentry DSN                                         |
| `LOG_LEVEL`                | No       | `trace`, `debug`, `info`, `warn`, `error`, `fatal` |

---

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

---

## Authentication (Better Auth)

- **Config:** [`src/core/auth/better-auth.ts`](src/core/auth/better-auth.ts)
- **Astro handler:** [`src/pages/api/auth/[...all].ts`](src/pages/api/auth/[...all].ts)
- **API routes:** `/api/auth/*`

Health check:

```http
GET /api/auth/ok
```

Expected response:

```json
{ "status": "ok" }
```

> [!NOTE]
> Better Auth CLI commands are preconfigured with the correct config path.

---

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

---

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

---

## UI Routes

- `/` — base page
- `/anime/:malId` — redirects to slug route
- `/anime/:malId/:slug` — anime details page

---

## Notes

> [!TIP]
> The API layer uses a common validation/error pipeline (`withZodValidation` + `mapErrorToHttp`) for consistent responses.

> [!NOTE]
> Image optimization is cached and falls back to `public/placeholder.webp` if the source fetch fails.
