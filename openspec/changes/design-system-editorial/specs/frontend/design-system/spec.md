## MODIFIED Requirements

### Requirement: Buttons ship as a closed set of variants

The design system SHALL provide a fixed set of button variants — primary,
secondary, tertiary, ghost, and destructive — each defining its rest, hover,
active, focus, and disabled appearance, plus a small set of situational extras
(terminal, rule, manifesto) for one-off editorial moments. All variants SHALL
share one geometry: a 2px border, the editorial radius, and uppercase mono text
with wide tracking. Consumers SHALL pick a variant; they MUST NOT compose a new
button look ad hoc.

#### Scenario: Consumer renders a button

- **WHEN** any surface (a server-rendered component or a hydrated island) renders
  a button
- **THEN** it applies one of the named variants and gets identical geometry,
  spacing, and state behavior as every other button of that variant

#### Scenario: Disabled button

- **WHEN** a button is disabled
- **THEN** it is visibly de-emphasized, does not present an interactive cursor,
  and shows no offset shadow

#### Scenario: Button text contrast

- **WHEN** a filled variant renders its label
- **THEN** the label meets 4.5:1 against the fill at rest and on hover; the
  primary variant never places text on the base accent stop

### Requirement: Typography is a shared scale with two families

The design system SHALL expose one display/heading/label family (a monospace)
and one body family as tokens, plus a named type scale for titles, subtitles,
and body sizes. Components SHALL use the scale rather than one-off font sizes
for shared text roles. The monospace family SHALL be used in uppercase for
display, headings and labels; running text SHALL use the body family.

#### Scenario: Heading and body text

- **WHEN** a component renders a title and its supporting copy
- **THEN** the title uses the display family and a scale step, and the copy uses
  the body family

#### Scenario: Fonts never hide text

- **WHEN** a page is delivered
- **THEN** the body family is preloaded and both families use swap display, so
  text is never invisible while a font loads

## ADDED Requirements

### Requirement: Accent text uses the ink role

The design system SHALL expose an `editorial-ink` role for accent-colored text
and SHALL resolve it to a stop that reaches 4.5:1 on the active theme's surface.
Components MUST NOT use the `editorial-accent` role as a text color; that role
is for fills, hairlines and focus marks.

#### Scenario: Accent label on dark

- **WHEN** a kicker or accent line is rendered on the dark surface
- **THEN** it uses `editorial-ink`, a lighter stop of the accent ramp, and
  measures at least 4.5:1

#### Scenario: Accent in the light theme

- **WHEN** the light theme marker is applied
- **THEN** `editorial-accent` and `editorial-ink` both resolve to a dark stop of
  the ramp, so text on a filled accent and accent text on the light surface both
  meet 4.5:1

### Requirement: Editorial structure uses shared utilities

The design system SHALL provide global utilities for its structural motifs — a
mono micro-label (plate label), a hairline kicker, bottom corner registration
marks, and a vertical rail label — so that surfaces compose them instead of
re-declaring the same classes.

#### Scenario: Numbered plate label

- **WHEN** a surface needs a figure or plate caption
- **THEN** it applies the plate-label utility and gets mono 11px uppercase text
  in the subtle foreground

#### Scenario: Motif on catalog artwork

- **WHEN** a motif would sit on top of poster or banner artwork
- **THEN** it is placed beside or around the artwork, never over it

### Requirement: Hard offset marks actions and landing surfaces

The design system SHALL define a hard offset shadow in the accent (and a deep
red for destructive actions) and SHALL restrict it to buttons and landing
surfaces. Catalog cards MUST keep tonal depth.

#### Scenario: Catalog card

- **WHEN** a catalog card renders at rest
- **THEN** it has no offset shadow and communicates depth through its tonal
  surface and border

#### Scenario: Primary action hover

- **WHEN** a primary button is hovered
- **THEN** its offset grows from the small to the large step

### Requirement: The design system is documented on a public page

The application SHALL serve a `/design-system` route that renders every token
family — type, color, buttons, surfaces and rules — straight from the shipped
tokens. The route SHALL be reachable without a session and SHALL be marked
`noindex`.

#### Scenario: Anonymous reviewer

- **WHEN** an unauthenticated visitor opens `/design-system`
- **THEN** the page renders and no login redirect occurs

#### Scenario: Search engines

- **WHEN** a crawler requests `/design-system`
- **THEN** the page carries a `noindex` directive
