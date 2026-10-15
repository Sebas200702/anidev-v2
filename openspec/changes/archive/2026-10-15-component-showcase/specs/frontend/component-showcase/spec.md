## Purpose

Provides the living-documentation surface for the UI: a playground where every
presentational component is rendered in isolation against real domain data and can
be driven prop by prop, so its appearance, states, and props contract can be
explored without hunting for a production page that happens to use it.

## ADDED Requirements

### Requirement: Every presentational component is registered and reachable

The showcase SHALL present an index of every registered presentational component,
grouped by its owner (shared or a domain), with each entry linking to that
component's own playground. Registering a component SHALL be the only step needed
to add it — the index and the route MUST NOT require a per-component branch.

#### Scenario: Index lists the catalog

- **WHEN** a developer opens the showcase index
- **THEN** every registered component appears under its owning group, with its name
  and a link to its playground

#### Scenario: A new component is registered

- **WHEN** a component is added to the registry
- **THEN** it appears on the index and its playground renders, with no change to
  the route itself

#### Scenario: Unknown component requested

- **WHEN** a playground is requested for a slug that is not registered
- **THEN** the showcase responds with a not-found outcome rather than a blank or
  broken page

### Requirement: A component playground renders one component with editable props

A playground SHALL render only the requested component, together with a control for
every prop the entry declares, the component's owner and title, and the resolved
props it was rendered with. Other registered components MUST NOT be rendered on
that view.

#### Scenario: Playground opened

- **WHEN** a developer opens a component's playground
- **THEN** only that component is rendered, with one labelled control per declared
  prop and the resolved props visible alongside it

#### Scenario: A control is changed

- **WHEN** a developer changes any control
- **THEN** the component is re-rendered with the new value applied, and every other
  prop keeps its current value

#### Scenario: Control types match the prop

- **WHEN** a prop is a boolean, a bounded set of values, a number, a color, or a
  structured value
- **THEN** its control is respectively a toggle, a select of the allowed values, a
  number field, a color field, or a text field accepting the structured value

### Requirement: Prop state is carried in the URL

The full prop state of a playground SHALL be encoded in the page's URL, so any
combination is reproducible by opening that URL, is shareable, and is navigable
with browser history.

#### Scenario: Sharing a state

- **WHEN** a developer copies the URL of a playground they have adjusted and opens
  it again
- **THEN** the component renders with exactly the same props

#### Scenario: Browser history

- **WHEN** a developer changes several controls and then goes back
- **THEN** the playground returns to the previous prop state

#### Scenario: Invalid or unknown values in the URL

- **WHEN** the URL carries a value that does not parse for its control, or a
  parameter that matches no declared control
- **THEN** the playground falls back to that prop's default and still renders,
  rather than erroring

### Requirement: The controls work without client JavaScript

The playground's controls SHALL be a form that submits by navigation, so every
prop can be changed with JavaScript disabled. Client script MAY only make the
same change feel immediate.

#### Scenario: JavaScript disabled

- **WHEN** a developer with client scripting unavailable changes a control and
  submits the form
- **THEN** the component re-renders with the new props

#### Scenario: JavaScript available

- **WHEN** client script is available and a control changes
- **THEN** the re-render is triggered without a full page reload, and the resulting
  props are identical to what the form submission would have produced

### Requirement: Presets load a named prop combination

Each entry SHALL be able to declare named prop combinations, and the playground
SHALL offer them as links that load into the controls and remain editable
afterwards.

#### Scenario: Preset selected

- **WHEN** a developer activates a preset
- **THEN** the component renders with that combination and the controls reflect it

#### Scenario: Preset then edited

- **WHEN** a developer changes a control after loading a preset
- **THEN** only that prop changes; the rest of the preset stays applied

### Requirement: Base props come from real services, with fixtures as the fallback

A playground's base props SHALL be loaded by the route from the same domain
service a production page would use, selected by an optional record identifier.
Control values SHALL be applied on top of that record. A fixture SHALL be used
only when the service yields no usable record, and the view SHALL state which of
the two it is showing.

#### Scenario: Service returns a record

- **WHEN** a playground is opened and its service returns data
- **THEN** the component renders with that live record as its base props, and the
  view indicates the data is live

#### Scenario: Record identifier supplied

- **WHEN** a record identifier is supplied
- **THEN** the base props come from that record; if it matches nothing, the
  playground falls back to the service default and then to the fixture, without
  erroring

#### Scenario: Overriding a live record

- **WHEN** a control sets a value for a prop that the loaded record also provides
- **THEN** the control's value wins, so any state can be forced on real data

#### Scenario: Dependency outage

- **WHEN** loading the base props fails because a dependency is down
- **THEN** the playground still renders from the fixture and says so, instead of
  failing the page

#### Scenario: Components never load their own data

- **WHEN** any playground is rendered
- **THEN** the data was fetched by the route and passed as props; no component
  reaches a service or a fixture itself

### Requirement: The showcase is reachable without a session and excluded from search

The showcase SHALL be reachable in every environment without authentication, and
SHALL instruct search engines not to index it or follow its links.

#### Scenario: Anonymous visitor

- **WHEN** an unauthenticated visitor opens the showcase in any environment
- **THEN** the page renders rather than redirecting to a login

#### Scenario: Crawler

- **WHEN** a search engine requests the showcase or one of its playgrounds
- **THEN** the response instructs it not to index the page and not to follow its
  links, and the page is absent from the sitemap

### Requirement: The showcase obeys the rules it documents

The showcase SHALL render inside the application shell and meet the same UI
constraints as production pages: design-system tokens only for color, no client
framework, an accessible document structure, and exactly one instance of each
document landmark.

#### Scenario: Showcase page delivered

- **WHEN** the showcase is delivered
- **THEN** it renders inside the shell, uses only tokens for color, and ships no
  client-framework runtime

#### Scenario: Controls are accessible

- **WHEN** the controls are rendered
- **THEN** each has a programmatically associated label, is reachable and operable
  by keyboard, and shows a visible focus indicator

#### Scenario: Demoing a component the shell already renders

- **WHEN** the component under demo is part of the shell itself
- **THEN** the playground does not render a second instance that would duplicate a
  document landmark; it documents the props contract and points at the page's own
  chrome as the live instance
