## Purpose

Provides the featured-anime slides that open the home page: the most popular
titles that actually have the artwork a hero slide needs, served as one cached
payload over a public endpoint and rendered without requiring client JavaScript.

## ADDED Requirements

### Requirement: Only anime with complete hero artwork are featured

A slide SHALL be offered only for anime that have **both** a banner image and a
clear logo. Anime missing either asset MUST NOT appear, and the absence of any
eligible anime SHALL be a valid, empty result — never an error.

#### Scenario: Anime has banner and clear logo

- **WHEN** the featured slides are built and an anime has both required assets
- **THEN** that anime is eligible for a slide

#### Scenario: Anime has only one of the two assets

- **WHEN** an anime has a banner but no clear logo (or the reverse)
- **THEN** it is excluded from the featured slides

#### Scenario: No anime is eligible

- **WHEN** no anime in the catalog has both required assets
- **THEN** the featured slides resolve to an empty collection and consumers render
  without a hero instead of failing

### Requirement: Slides are ordered by popularity and bounded in count

Eligible anime SHALL be ordered most-popular-first and the result SHALL be capped
at a fixed slide count defined as a shared constant.

#### Scenario: More eligible anime than slots

- **WHEN** more anime are eligible than the configured slide count
- **THEN** only the most popular ones are returned, in popularity order

### Requirement: A slide carries everything needed to render it

Each slide SHALL expose the anime's identifier, title, banner URL, clear-logo URL,
synopsis, genres (each with a name and a link to browse that genre), score, year,
and season. Missing artwork SHALL be represented as an empty URL rather than a
broken one, and absent numeric values SHALL fall back to a defined default so the
payload always validates.

#### Scenario: Slide with complete data

- **WHEN** a slide is built for an anime with a synopsis, score, year, and genres
- **THEN** all of those fields are present, and the artwork URLs point at the
  application's own media pipeline rather than at an upstream host

#### Scenario: Slide with missing optional data

- **WHEN** an anime has no synopsis, no score, or no year
- **THEN** the slide carries an empty description and defaulted numerics instead of
  null values, and still validates

#### Scenario: Genre link

- **WHEN** a slide's genres are rendered
- **THEN** each genre links to a discovery view filtered by that genre

### Requirement: The same asset from several providers resolves deterministically

When an anime has the same artwork type from more than one upstream provider, the
slide SHALL pick one by a fixed source preference order, falling back to the first
available asset when no preferred source matches.

#### Scenario: Multiple banners available

- **WHEN** an anime has banners from several providers
- **THEN** the highest-preference provider's banner is chosen, and the choice is
  stable across requests

#### Scenario: Only an unranked provider available

- **WHEN** none of the anime's assets come from a preferred provider
- **THEN** one of the available assets of that type is still used

### Requirement: The featured payload is cached as one entry

The featured slides SHALL be served through a read-through cache under a single
global key with a medium time-to-live. There SHALL be no per-user variant.

#### Scenario: Cache hit

- **WHEN** the featured slides are requested and a cached payload exists
- **THEN** the cached payload is returned without querying the database

#### Scenario: Cache miss

- **WHEN** no cached payload exists
- **THEN** the slides are computed, stored under the shared key, and returned

### Requirement: Featured slides are available over a public endpoint

The system SHALL expose a public read endpoint returning the featured slides in
the standard response envelope, requiring no session, with its request and
response both schema-validated.

#### Scenario: Anonymous request succeeds

- **WHEN** an unauthenticated client requests the featured slides endpoint
- **THEN** it receives `200` with the slides in the standard envelope

#### Scenario: Dependency failure

- **WHEN** the database or the cache fails while serving the endpoint
- **THEN** the client receives the standard error envelope with the corresponding
  infrastructure error code, not a raw stack trace

### Requirement: The home page supplies the slides; the carousel only renders them

The featured carousel SHALL be a presentational component that receives its slides
as props. The home page route SHALL be the only place that loads them, and it
SHALL load the featured slides and the rest of its content concurrently.

#### Scenario: Home page composes its data

- **WHEN** the home page is served
- **THEN** it loads the featured slides and its other sections in parallel and
  passes each result down as props

#### Scenario: No slides available

- **WHEN** the featured slides resolve to an empty collection
- **THEN** the home page omits the carousel entirely and still renders its
  remaining sections

### Requirement: The carousel works before and without client JavaScript

Every slide SHALL be server-rendered, with the first slide visible on paint. Client
JavaScript SHALL only change which slide is shown; it MUST NOT be required to see
a slide.

#### Scenario: JavaScript disabled

- **WHEN** a user loads the home page with client scripting unavailable
- **THEN** the first slide is fully visible and its links and content are usable

#### Scenario: Manual navigation

- **WHEN** a user activates the next/previous controls or a slide indicator
- **THEN** the requested slide becomes visible, the indicators reflect the new
  position, and the inactive slides are hidden from assistive technology

### Requirement: Autoplay respects motion preferences and disposes itself

The carousel SHALL advance on its own only when more than one slide exists and the
user has not requested reduced motion. Manual navigation SHALL restart the
interval, and leaving the page SHALL release the interval and its listeners.

#### Scenario: Reduced motion requested

- **WHEN** the user's system requests reduced motion
- **THEN** the carousel does not auto-advance and remains fully navigable by hand

#### Scenario: Single slide

- **WHEN** only one slide exists
- **THEN** no autoplay interval is started

#### Scenario: Navigating away from the home page

- **WHEN** the user navigates to another page in the app
- **THEN** the carousel's interval and event listeners are released, so no timer
  from the previous page keeps running
