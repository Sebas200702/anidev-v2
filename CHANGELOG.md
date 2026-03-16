# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Introduced layered architecture under `src/config`, `src/core`, `src/domains`, `src/services`, and `src/ui`.
- Added Better Auth server setup with Drizzle adapter and catch-all route `src/pages/api/auth/[...all].ts`.
- Added Turso/Drizzle schemas for auth, anime, music, and related entities.
- Added Redis cache client plus domain cache helpers for anime and music.
- Added anime and music domain modules (repositories, services, mappers, schemas, and types).
- Added API endpoints for anime details/full/staff/characters, music details, and image proxy optimization.
- Added new UI shell and pages (`src/ui/layouts/base.astro`, media component, `/anime/[malId]/[slug]` route).
- Added project env/template and assets: `.env.example`, `public/og-image.png`, `public/placeholder.webp`, and `public/favicon.png`.
- Added local automation metadata for Copilot skills/agents under `.agents` and `.github/agents`.

### Changed
- Updated Astro runtime to Node standalone server mode with React + Tailwind Vite plugin and `@` alias resolution.
- Updated TypeScript and tooling configuration (`tsconfig.json`, Prettier, lockfile, and `package.json` scripts).
- Updated landing page and metadata wiring to use shared base layout and centralized config values.
- Updated favicon resources and public branding assets.

### Removed
- Removed Astro starter assets/components: `src/assets/*`, `src/components/Welcome.astro`, and `src/layouts/Layout.astro`.

### Fixed
- Corrected Better Auth configuration to use `baseURL` and explicit Drizzle auth schema mapping (`user`, `session`, `account`, `verification`).

### Documentation
- Updated README to reflect the current architecture, setup flow, environment variables, and API routes.
- Initialized and populated this changelog.

## [0.0.1] - 2026-03-12

### Added
- Initial project scaffold from Astro.
