## Purpose

Defines the persistent frame every page renders inside — masthead, content area,
footer, the app's scroll container, and the one floating quick-actions surface —
so navigation, branding, and page-level chrome behave identically on every route.

## ADDED Requirements

### Requirement: Every page renders inside a three-region shell

The application SHALL render a shell composed of a masthead region, a content
region, and a footer region, in that order. Page content SHALL occupy the content
region only; pages MUST NOT render their own masthead or footer.

#### Scenario: Any route is opened

- **WHEN** a user opens any application page
- **THEN** the masthead and footer are present, and the page's own markup is
  rendered between them

#### Scenario: Shell reserves no navigation rail

- **WHEN** the shell is laid out at any viewport width
- **THEN** no side rail column is reserved; primary navigation lives in the
  masthead

### Requirement: Masthead carries brand, navigation, and session actions

The masthead SHALL present the brand identity linking to the home page, the
primary navigation, and the session actions (search, sign in, sign up). It SHALL
remain reachable while the content scrolls.

#### Scenario: Scrolling a long page

- **WHEN** a user scrolls a page whose content exceeds the viewport
- **THEN** the masthead stays available at the top of the viewport

#### Scenario: Narrow viewport

- **WHEN** the viewport is too narrow for the full navigation row
- **THEN** the masthead drops the wide-only rows and keeps the brand and the
  session actions, and every remaining control keeps a touch-sized hit target

#### Scenario: Navigation is real links

- **WHEN** a user activates a navigation entry, with or without client JavaScript
- **THEN** the browser navigates, because each entry is an anchor to its route

### Requirement: Footer carries secondary links and attribution

The footer SHALL present the brand line, the secondary section links, the social
destinations, and the service attribution/disclaimer, all as real links.

#### Scenario: Secondary navigation

- **WHEN** a user activates a footer link
- **THEN** the browser navigates to that route without requiring client JavaScript

#### Scenario: External destinations are labelled

- **WHEN** a social destination is rendered as an icon only
- **THEN** it exposes an accessible name so assistive technology can announce it

### Requirement: The shell owns the scroll container

The shell SHALL provide the application's vertical scroll container and SHALL NOT
allow horizontal overflow of the viewport.

#### Scenario: Wide content inside a page

- **WHEN** a page contains an element wider than the viewport
- **THEN** the page does not scroll horizontally; the overflow is contained

#### Scenario: Scroll-to-top action

- **WHEN** a user triggers scroll-to-top
- **THEN** the shell's scroll container returns to the top, with the window as a
  fallback target

### Requirement: The toolbar is the shell's only hydrated island

The shell SHALL hydrate exactly one interactive island — the floating toolbar —
and only because its behavior (expand/collapse plus dismiss-on-outside-click)
cannot be expressed with markup or a form. All other shell chrome SHALL ship zero
client JavaScript.

#### Scenario: Toolbar expanded and dismissed

- **WHEN** a user opens the toolbar and then clicks anywhere outside it
- **THEN** the toolbar collapses

#### Scenario: Toolbar state is announced

- **WHEN** the toolbar's trigger is rendered
- **THEN** it exposes its expanded state and an accessible label that reflects
  whether activating it opens or closes the menu

#### Scenario: Island matches the design system

- **WHEN** the island renders its buttons
- **THEN** they use the same shared button variants as server-rendered buttons, so
  the hydrated surface is visually indistinguishable

### Requirement: Client-side navigation preserves the shell

The shell SHALL survive in-app navigation: view transitions replace the content
region without tearing down or duplicating the masthead, footer, or the toolbar
island's behavior.

#### Scenario: Navigating between two pages

- **WHEN** a user navigates from one page to another within the app
- **THEN** the shell persists, and any page-level script from the previous page is
  disposed before the new page's script initializes — no duplicated timers or
  listeners accumulate
