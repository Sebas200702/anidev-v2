# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added domain-driven application structure under `src/core`, `src/domains`, `src/services`, and `src/ui`.
- Added Better Auth integration with Drizzle adapter and Astro catch-all auth route in `src/pages/api/auth/[...all].ts`.
- Added anime API endpoints for details, full payload, staff, and characters under `src/pages/api/anime/[malId]/*`.
- Added music API endpoint in `src/pages/api/music/[id].ts`.
- Added image proxy endpoint and optimization service with Sharp fallback and cache support.
- Added Turso/Drizzle schema set for auth, anime, character, staff, producer, episode, music, and relationship tables.
- Added Redis cache client, generic `withCache` helper, and domain caches for anime and music.
- Added shared HTTP validation/response pipeline with Zod middleware and typed API response schemas.
- Added centralized error model and HTTP error mapping with Pino logging and Sentry integration hooks.
- Added anime detail route and UI primitives, including media and base layout components.
- Added `.env.example`, formatting/editor support files, and new public assets (`og-image.png`, `placeholder.webp`, `favicon.png`).

### Changed
- Changed Astro runtime setup to server output with Node standalone adapter, React integration, Tailwind Vite plugin, and `@` alias resolution.
- Changed TypeScript configuration for React JSX and path aliases.
- Changed `package.json` scripts to include Better Auth CLI generation/migration plus DB migration workflow.
- Changed root page composition to use shared layout and metadata config.
- Changed README to reflect current architecture, setup process, environment variables, and API endpoints.
- Changed favicon assets and related public metadata resources.

### Removed
- Removed Astro starter files and assets: `src/assets/astro.svg`, `src/assets/background.svg`, `src/components/Welcome.astro`, and `src/layouts/Layout.astro`.

### Fixed
- Fixed Better Auth server configuration to use `baseURL` and explicit Drizzle schema mapping (`user`, `session`, `account`, `verification`).

## [0.0.1] - 2026-03-12

### Added
- Initial project scaffold from Astro.
