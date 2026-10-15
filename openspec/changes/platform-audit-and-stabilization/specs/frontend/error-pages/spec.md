## Purpose

Extends the SSR error-page contract so the home page (`/`) catches `InfraError` and renders `<ServiceUnavailable />` with status `503` instead of throwing an unhandled 500.

## MODIFIED Requirements

### Requirement: SSR pages render a service-unavailable view on infrastructure errors

Every SSR page route that fetches domain data—including `/` and `/anime/[malId]/[slug]`—SHALL catch `InfraError`, set `Astro.response.status = 503`, and render the shared `<ServiceUnavailable />` presentational component instead of exposing a raw 500 server error.

#### Scenario: Anime detail page with database down

- **WHEN** an SSR page like `/anime/[id]` fails to load data because the database is down
- **THEN** the page renders a service-unavailable view with a clear title, explanation, and a retry action

#### Scenario: Infrastructure error is caught before it reaches the framework

- **WHEN** a page's data fetch throws an infrastructure error
- **THEN** the error is handled inside the page and the service-unavailable view is rendered with an error status

#### Scenario: Home page with database down and cold cache

- **WHEN** `GET /` fails to load featured slides or the top-rated anime list because PostgreSQL is down and no stale cache exists
- **THEN** the home page responds with HTTP `503` and renders `<ServiceUnavailable />` with a retry link to `/`
