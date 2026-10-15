## Purpose

Defines what the browser receives: a zero-framework-JS app shell, baseline client JavaScript measured against a per-route budget, and single-`h1` document semantics on every page.

## ADDED Requirements

### Requirement: The app shell requires no hydrated framework island

The shared shell (header, footer, quick actions) MUST work without hydrating a framework runtime; interactive shell affordances use inline vanilla scripts (following the existing component `script.ts` pattern) instead of `client:*` React islands.

#### Scenario: A page without islands ships zero framework JS

- **WHEN** a visitor loads a page that declares no `client:*` island
- **THEN** the delivered JavaScript contains no React/ReactDOM runtime chunks

### Requirement: Baseline client JavaScript stays within a measured budget

The client JavaScript shipped on every route (shell + monitoring + router) MUST be tracked as a budget in the repository and verified in CI; the budget is only raised deliberately with a recorded justification, and any single dependency added to the global surface is measured before and after.

#### Scenario: Budget report accompanies UI changes

- **WHEN** a change alters global scripts (shell, layout, monitoring bootstrap)
- **THEN** the change records before/after gzip sizes for the affected chunks and CI surfaces the current totals

#### Scenario: Monitoring SDK cost is accounted for

- **WHEN** the browser monitoring SDK is injected on every page
- **THEN** its gzip size is part of the recorded budget and its loading strategy (defer, lazy init, or conditional on DSN) is documented

### Requirement: Every document has exactly one h1

Each rendered page MUST contain exactly one `h1`: the page's own title. The shell brand mark MUST NOT be a heading (`h1`–`h6`) so it cannot duplicate the page title on every route.

#### Scenario: Showcase page has a single h1

- **WHEN** a browser loads `/showcase`
- **THEN** the document contains exactly one `h1` element (the page title), and the header brand renders as non-heading text

#### Scenario: Home page still exposes a real h1

- **WHEN** a browser loads `/`
- **THEN** the document contains exactly one `h1` describing the home content
