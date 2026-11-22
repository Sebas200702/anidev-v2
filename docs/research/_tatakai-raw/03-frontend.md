# 03-frontend

Tatakai's frontend is a React 19 + TypeScript SPA built with Vite, TanStack Query, Zustand, and Tailwind CSS . It is designed to run in browsers and can be embedded in Electron/Capacitor for desktop/mobile applications .

## Content Discovery Pages

Tatakai features various content discovery pages, including a home page, carousels, search, and taxonomy-based views .

### Home Page
The TV home page, implemented in `src/pages/tv/TVHomePage.tsx`, displays a cinematic hero section, various content rails (carousels), and a discovery grid .
Content rails, such as "Your Next Watch" and "Trending This Season," are rendered using the `TVRail` component . These rails display `TVContentCard` components for individual media items .

### Carousels (Rails)
Carousels are referred to as "rails" in the TV mode . The `TVRail` component takes a `title` and an array of `TVCard` items, rendering them horizontally . Each item in a rail is a `TVContentCard`, which can display metadata, progress, and rank .

### Search
The search functionality is available through a dedicated search page . In TV mode, a search page (`@/pages/tv/TVSearchPage`) is lazy-loaded .

### Taxonomy
Media detail pages for anime, manga, and novels (`/anime/:id`, `/manga/:id`, `/novel/:id`) serve as taxonomy entry points, providing detailed information about specific titles .

## UI System and Theming

Tatakai's UI system is built upon `shadcn/ui`, which uses Radix UI primitives and Tailwind CSS .

### Design System
The design system extends `shadcn/ui` with custom components located in `src/components/ui/` . Key component categories include Media Display (`MediaCard`, `MediaGrid`), Player (`VideoPlayer`), Reader (`MangaViewer`), Community (`PostCard`), Extensions (`ExtensionCard`), and Layout (`AppShell`, `Header`, `Sidebar`) .

### Theming
The theming system uses CSS variables defined in `src/styles/theme.css` and managed by `ThemeProvider.tsx` . Themes are switched by updating `document.documentElement` classes and applying custom CSS variables via `applyThemeVariables` . The `useThemeStore` Zustand store manages the active theme .

## Accessibility Approach

Tatakai incorporates several accessibility features:
*   **Reduced Motion**: Animations respect `prefers-reduced-motion` by providing `reduce-motion` variants and setting animation/transition durations to `0.01ms` .
*   **Keyboard Navigation**: In TV mode, spatial navigation is installed to allow navigation using D-Pad controls  . Focus is managed and restored using `data-tv-key` attributes .
*   **Semantic HTML**: UI components likely leverage Radix UI primitives, which are designed with accessibility in mind.

## Component Architecture

The frontend follows a component-based architecture with a clear project structure .

### Project Structure
*   `src/main.tsx`: App entry point, providers, router .
*   `src/App.tsx`: Root layout, routes, error boundaries .
*   `src/core/`: Domain layer shared across features, including API clients, content types, database, extensions, hooks, and types .
*   `src/features/`: Self-contained feature modules like `anime`, `manga`, `search`, and `settings` .
*   `src/components/`: Shared UI components, including `ui` (shadcn/ui primitives), `media`, `player`, `reader`, and `layout` .

### Context Providers
A hierarchy of context providers wraps the application routes in `src/App.tsx` . Key providers include `QueryClientProvider`, `ThemeProvider`, `AuthProvider`, `ExtensionProvider`, `SettingsProvider`, and `I18nProvider` .

## State Management

Tatakai uses a dual state management approach:

### TanStack Query (Server State)
Used for managing server-side data, with configuration in `src/lib/queryClient.ts` . It handles data fetching, caching, and synchronization . Examples include `useMediaList`, `useEpisodeSources`, and `useRecommendations` .

### Zustand (Client State)
Used for managing global client-side state . Stores are typically located in `src/core/hooks/` or feature-specific directories . Notable stores include `useAuthStore`, `useSettingsStore`, `usePlayerStore`, `useReaderStore`, and `useThemeStore` . These stores often use `persist` for local storage .

## Notable UX Patterns

### TV Mode
Tatakai features a dedicated "TV mode" designed for large screens and remote control navigation .
*   **Layout**: The `TVLayout` component (`src/layouts/TVLayout.tsx`) provides the shell for TV mode, including a navigation rail and content area .
*   **Spatial Navigation**: Implemented using `installSpatialNavigation` to enable D-Pad navigation  .
*   **Focus Management**: Focus is remembered and restored when navigating between pages using `data-tv-key` attributes and a `MutationObserver` .
*   **Theming**: TV mode has its own appearance settings, including themes like "Atmosphere" and "Refined," defined in `src/layouts/tv-atmosphere.css` and `src/layouts/tv-refined.css` .
*   **Cinematic Hero**: The TV home page features a `TVCinematicHero` component for prominent display of featured content .

## Notes

The provided context primarily focuses on the TV mode implementation for content discovery. While general frontend architecture is described, specific details on non-TV mode content discovery pages (e.g., web-specific carousels or taxonomy views) are less explicit. The `docs/architecture/frontend.md` provides a high-level overview of routing for various content types, but the detailed implementation of discovery outside of TV mode is not extensively covered in the provided snippets.

View this search on DeepWiki: https://deepwiki.com/search/describe-in-technical-detail-t_a8c99e5d-2d53-4270-b6a4-b99ef7612b5b

