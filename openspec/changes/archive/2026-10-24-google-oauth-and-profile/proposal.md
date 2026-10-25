# Proposal: Google sign-in and profile onboarding (Fase 2, change 1 of 3)

## Problem

Today an account can only be created with email and password (Better Auth
1.6.33, 228 users, all `credential`). The roadmap's Fase 2 asks for social
sign-in. v1 offered Google, which made it the main way users signed up.

The profile also has its taste fields (`fanatic_level`, `frequency`,
`preferred_format`, favorite genres, studios and anime). They are readable
but there is no endpoint to write them. v1's onboarding step 3 collected them.

The v1 review (2026-10-24) also lists failures we must not repeat:
- two auth systems side by side;
- user rows written with a public key;
- a session token built from a magic-link OTP;
- no validation on profile writes.

Change 1 of 3. Avatar and banner uploads come in change 2, and the
MyAnimeList/AniList import comes in change 3.

## Scope

Backend only.

1. **Google provider in Better Auth.**
   - Enabled only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
     Both are optional in `env.ts`. Without them the routes answer
     `404 PROVIDER_NOT_CONFIGURED`.
   - Scopes `openid email profile`.
2. **Narrow routes.** No Better Auth catch-all, so the custom register route
   and its throttle cannot be bypassed:
   - `GET /api/auth/sign-in/google?callbackURL=/path` starts the flow. It
     sets the state cookie and returns `302` to Google. `callbackURL` must be
     a same-site relative path; anything else becomes `/`.
   - `GET /api/auth/callback/google` is the OAuth callback, delegated to
     `auth.handler`.
   - `GET /api/auth/link/google` (authenticated) links Google to the current
     account explicitly.
3. **Account takeover guard.** `disableImplicitLinking: true`. A Google
   sign-in whose email already belongs to a password account is not merged
   automatically. Email ownership is never verified today (no SMTP), so
   someone could register a victim's email first and later receive the
   victim's Google login. Instead:
   - the user gets the error `ACCOUNT_EXISTS_USE_PASSWORD`;
   - they can link Google from inside their session.
4. **Profile bootstrap.** When a user is first created by Google, a
   `profile` row is created from `given_name` / `family_name`. The avatar
   field is set to the Google picture URL; its host is already allowed by the
   CSP `img-src`.
5. **Onboarding signal.** `GET /api/auth/session` adds `profileStatus`:
   - `missing`: no profile row;
   - `incomplete`: no gender or birthday;
   - `complete`: everything set.
6. **Preferences write.** `PATCH /api/user/:userId/preferences` is
   owner-only. It writes `fanaticLevel`, `frequency`, `preferredFormat`, and
   `favoriteGenres` / `favoriteStudios` / `favoriteAnimes` as MAL id lists
   (max 50 each). Every id must exist in its catalog table. It returns the
   updated profile and invalidates the profile cache.

## Non-goals

- Avatar and banner upload (change 2), and MAL/AniList import (change 3).
- Other providers (Discord, GitHub, AniList OAuth), only if asked later.
- Email verification and password reset. They need an SMTP provider, as
  recorded in ROADMAP G.6.
- Accent color and the adult-content opt-in (`parentalVariant: full`). The
  first is a UI theme decision. The second needs catalog-wide wiring and its
  own change.
- Migrating the CSV preference columns to typed columns. The existing mapper
  already parses them, and changing the storage is a separate refactor.

## Breaking changes

None. All additions are opt-in and need the env vars.
