# Tasks — Google sign-in and profile onboarding

> TDD-first; one commit per task. Backend only. Fetch Better Auth docs
> (Context7) before touching auth APIs.

## 1. Configuration

- [ ] 1.1 Env:
      - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, optional, both or
        neither (tests first);
      - `isGoogleEnabled()`;
      - document both in `.env.example` and `.env.local.example`.
- [ ] 1.2 `ErrorCodes`: `PROVIDER_NOT_CONFIGURED` (404) and
      `ACCOUNT_EXISTS_USE_PASSWORD` (409), with mapping tests.
- [ ] 1.3 `server.ts`:
      - conditional `socialProviders.google` with `mapProfileToUser`;
      - `accountLinking` with `disableImplicitLinking`;
      - profile bootstrap hook.

      Unit-test the bootstrap mapper (names, fallbacks, avatar) as a pure
      function.

## 2. Routes

- [ ] 2.1 `sanitizeCallbackURL` pure util plus tests (relative, `//`, `/\`,
      absolute, other origin).
- [ ] 2.2 `GET /api/auth/sign-in/google`, `GET /api/auth/callback/google`
      (including the conflict → `error=ACCOUNT_EXISTS_USE_PASSWORD`
      redirect) and `GET /api/auth/link/google`. Add the public routes.
      Route tests with mocked `auth.api` / `auth.handler`.
- [ ] 2.3 `profileStatus` in `GET /api/auth/session` (tests for `missing`,
      `incomplete` and `complete`).

## 3. Preferences

- [ ] 3.1 `preferencesUpdateSchema` plus tests.
- [ ] 3.2 Catalog id existence repository (genres, producers, anime). Unit
      tests plus an integration spec.
- [ ] 3.3 `userService.updatePreferences`:
      - owner policy;
      - id check;
      - CSV write;
      - cache invalidation.

      Unit tests.
- [ ] 3.4 `PATCH /api/user/:userId/preferences` route plus tests (200, 400,
      401, 403).

## 4. Verification, release & archive

- [ ] 4.1 E2E:
      - Google routes answer `404` without env;
      - `profileStatus` for a seeded password user;
      - preferences owner update and the `403` for another user.
- [ ] 4.2 Manual Google checklist with test credentials, recorded in the PR:
      - new user;
      - existing-email conflict;
      - explicit link;
      - `callbackURL` guard.
- [ ] 4.3 Full gate, AGENTS.md (env vars, public routes), ROADMAP (Fase 2),
      release minor, PR, merge, push tag, archive.
