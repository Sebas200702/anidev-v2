## Purpose

Defines the single visual vocabulary every AniDev surface draws from: a swappable
accent ramp, semantic surface/foreground/feedback tokens, the button variants, the
type scale, and the accessibility floor — so no component invents a color, a
radius, or a motion rule of its own.

## ADDED Requirements

### Requirement: Colors come from semantic tokens, never raw values

The design system SHALL expose named semantic tokens for surfaces, foregrounds,
borders, focus, feedback states, and editorial roles, and UI SHALL reference those
tokens. Raw color literals MUST NOT appear in component markup or styles.

#### Scenario: Component needs a background

- **WHEN** a component renders a raised panel, a border, or muted text
- **THEN** it references the corresponding semantic token (raised surface, border,
  muted foreground) rather than a hex value or a raw neutral step

#### Scenario: Feedback state needs a color

- **WHEN** a component signals success, a warning, or a destructive outcome
- **THEN** it uses the feedback token for that meaning, and the token is legible
  as text, border, and fill on the app's surfaces

### Requirement: The accent is swappable at runtime

The accent SHALL be defined once as an ordered ramp on the document root, and
every accent-derived token SHALL resolve through that ramp. Overriding the ramp on
the root SHALL re-theme the whole interface without touching component code.

#### Scenario: Accent ramp overridden

- **WHEN** the accent ramp variables are redefined on the document root
- **THEN** buttons, focus rings, editorial rules, and accent text all follow the
  new accent, and no component needs to be edited

#### Scenario: Token available to inline styles

- **WHEN** a value is needed outside a utility class (an inline style, a computed
  gradient)
- **THEN** the token is emitted on the root and readable as a CSS variable, even
  when no utility class in the build references it

### Requirement: Buttons ship as a closed set of variants

The design system SHALL provide a fixed set of button variants — primary,
secondary, tertiary, ghost, and destructive — each defining its rest, hover,
active, focus, and disabled appearance. Consumers SHALL pick a variant; they MUST
NOT compose a new button look ad hoc.

#### Scenario: Consumer renders a button

- **WHEN** any surface (a server-rendered component or a hydrated island) renders
  a button
- **THEN** it applies one of the named variants and gets identical geometry,
  spacing, and state behavior as every other button of that variant

#### Scenario: Disabled button

- **WHEN** a button is disabled
- **THEN** it is visibly de-emphasized and does not present an interactive cursor

### Requirement: Dark is the default theme, light is an override

The interface SHALL declare a dark color scheme by default, and a light theme
SHALL be expressible purely by overriding the semantic tokens — no component
markup may branch on theme.

#### Scenario: Page loads with no theme class

- **WHEN** a page renders without an explicit theme selection
- **THEN** it renders the dark palette and reports a dark color scheme to the
  browser so native controls match

#### Scenario: Light theme applied

- **WHEN** the light theme marker is applied to a container
- **THEN** the same components render with light-appropriate surfaces,
  foregrounds, borders, and feedback colors, with no markup change

### Requirement: Typography is a shared scale with two families

The design system SHALL expose one display/heading family and one body family as
tokens, plus a named type scale for titles, subtitles, and body sizes. Components
SHALL use the scale rather than one-off font sizes for shared text roles.

#### Scenario: Heading and body text

- **WHEN** a component renders a title and its supporting copy
- **THEN** the title uses the heading family and a scale step, and the copy uses
  the body family

#### Scenario: Fonts are available before first paint of text

- **WHEN** a page is delivered
- **THEN** both families are preloaded and swap-displayed, so text is never
  invisible while a font loads

### Requirement: Images reserve their space and reveal progressively

The shared image primitive SHALL accept explicit intrinsic dimensions or an
aspect ratio so no image contributes layout shift, and SHALL show a low-quality
placeholder that is removed once the full image has loaded.

#### Scenario: Image with a known aspect ratio

- **WHEN** an image is rendered with an aspect ratio or explicit width and height
- **THEN** its box is reserved before the bytes arrive and the surrounding layout
  does not move when it paints

#### Scenario: Placeholder hand-off

- **WHEN** the full-resolution image finishes loading
- **THEN** the blurred placeholder is faded out rather than left stacked
  underneath

#### Scenario: No distinct placeholder available

- **WHEN** the small and full image sources are the same
- **THEN** no placeholder layer is rendered at all

### Requirement: Accessibility floor is part of the system

The design system SHALL guarantee, for every token pair it sanctions for text, a
contrast ratio of at least 4.5:1 against its intended surface; SHALL provide a
visible focus indicator distinct from hover; and SHALL suppress non-essential
animation when the user asks for reduced motion.

#### Scenario: Keyboard focus

- **WHEN** a user reaches an interactive element with the keyboard
- **THEN** a focus indicator appears that is distinguishable from the hover state

#### Scenario: Reduced motion preference

- **WHEN** the user's system requests reduced motion
- **THEN** transitions, animations, and smooth scrolling are effectively disabled
  across the interface

#### Scenario: Accent used as small text

- **WHEN** the accent is used for small text on a dark surface and the intended
  stop does not reach 4.5:1
- **THEN** a lighter stop of the same ramp is used for the text while fills and
  rules keep the darker stop
