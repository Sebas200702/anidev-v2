# frontend/error-pages Specification

## Purpose

Provides a friendly, shared "service unavailable" presentational surface so SSR pages render an accessible retry view instead of a flat server error when a dependency outage prevents serving data.

## Requirements

### Requirement: SSR pages render a service-unavailable view on infrastructure errors
Page routes (SSR) SHALL render a friendly service-unavailable view when serving the page fails due to an infrastructure error, instead of exposing a raw server error.

#### Scenario: Anime detail page with database down
- **WHEN** an SSR page like `/anime/[id]` fails to load data because the database is down
- **THEN** the page renders a service-unavailable view with a clear title, explanation, and a retry action

#### Scenario: Infrastructure error is caught before it reaches the framework
- **WHEN** a page's data fetch throws an infrastructure error
- **THEN** the error is handled inside the page and the service-unavailable view is rendered with an error status

### Requirement: Service-unavailable view is presentational
The service-unavailable view SHALL be a presentational component that receives data via props, does zero data-fetching, and is shared across pages.

#### Scenario: Component receives props only
- **WHEN** the view is rendered
- **THEN** it receives its title, message, and retry target as props and performs no data fetching itself

#### Scenario: Reused across pages
- **WHEN** multiple SSR pages face an infrastructure outage
- **THEN** they reuse the same shared presentational component rather than duplicating markup

### Requirement: Non-infrastructure outcomes keep their behavior
Domain not-found outcomes and validation failures SHALL keep their existing behavior (redirect to 404, error envelope), unaffected by the service-unavailable view.

#### Scenario: Not-found still redirects
- **WHEN** an SSR page resolves to a not-found domain outcome
- **THEN** the page keeps redirecting or rendering the 404 result as before

### Requirement: Service-unavailable view meets accessibility and interaction defaults
The service-unavailable view SHALL be reachable and operable without JavaScript, using semantic HTML and a real retry link.

#### Scenario: Retry works without client JS
- **WHEN** a user activates the retry action on the view
- **THEN** the retry is a regular link (no client script required) targeting the failing page