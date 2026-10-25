# Design: Google sign-in and profile onboarding

## 1. Findings (evidence-first)

- **Better Auth setup.**
  - Better Auth 1.6.33 runs with `emailAndPassword` only.
  - `src/lib/auth/server.ts` sets no `socialProviders` and no `account`
    options.
  - Auth is reached only through custom routes (`/api/auth/login`,
    `register`, `logout`, `session`); there is no catch-all handler.
  - `register` is throttled per IP and email (`credential-throttle`).
- **Data (local clone of prod).** 228 users with 228 `credential` accounts
  and no social account. 37 profiles, all with empty preference fields.
- **Profile table.** `profile.name` / `last_name` are `NOT NULL`; `gender`,
  `birthday` and `avatar` are nullable. Preferences are CSV text columns
  parsed by `mapUser` into `number[]`.
  - `preferencesSchema` already exists in
    `src/domains/user/schemas/user-preferences-schema.ts`, but nothing writes
    it.
- **Existing building blocks.**
  - `requireAuthSession` for auth.
  - Owner policies in `src/domains/user/policies/user-profile`.
  - The `withZodValidation` / `withErrorHandling` wrappers.
  - The profile cache in `@user/cache/user-profile`.
- **CSP.** The CSP `img-src` already allows `https://lh3.googleusercontent.com/`.
- **Better Auth 1.6 (Context7, v1.6.23 docs).**
  - `socialProviders.google` accepts `mapProfileToUser`.
  - `account.accountLinking.disableImplicitLinking` blocks same-email OAuth
    merges.
  - `auth.api.signInSocial(..., { asResponse: true })` returns the redirect
    and sets the state cookie.
  - `auth.handler(request)` serves the callback path under the
    `/api/auth` base path.
- **v1 lessons.** Google sessions did a `listUsers()` scan and used a
  magic-link OTP as the token. Profile writes had no validation and were
  done with a public key.

## 2. Decisions

1. **Conditional provider.** `env.ts` gains optional `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET` (Zod refine: both or neither).
   - `server.ts` spreads `socialProviders.google` only when both are present.
   - A small `isGoogleEnabled()` in `@auth/config` drives the
     `PROVIDER_NOT_CONFIGURED` 404.
   - `.env.example` / `.env.local.example` document them; their redirect URI
     is `${APP_BASE_URL}/api/auth/callback/google`.
2. **No catch-all.** Three explicit routes:
   - `sign-in/google.ts` calls `auth.api.signInSocial` with `asResponse` and
     passes the result through.
   - `callback/google.ts` runs `auth.handler(context.request)`.
   - `link/google.ts` calls `auth.api.linkSocialAccount` with the request
     headers and `asResponse`, after `requireAuthSession`.

   `/api/auth/sign-in/google` and `/api/auth/callback/google` join
   `publicRoutes`. The link route stays private.
3. **Redirect guard.** `sanitizeCallbackURL(raw)` is a pure function. It
   accepts only values that start with a single `/`, not `//` or `/\`, and
   that parse to the same origin as `APP_BASE_URL`; anything else becomes
   `/`. Better Auth also checks `trustedOrigins`, which stays at the default
   base URL.
4. **Linking policy.** `account.accountLinking = { enabled: true,
   disableImplicitLinking: true, trustedProviders: [] }`.
   - Implicit linking is the takeover vector, because email ownership is
     never verified.
   - Better Auth reports the conflict on the callback redirect. It is mapped
     to `error=ACCOUNT_EXISTS_USE_PASSWORD` on the `callbackURL` (the error
     code goes into `ErrorCodes` for the API surfaces).
5. **Profile bootstrap.** `databaseHooks.account.create.after` runs when
   `providerId === 'google'` and the user has no profile yet. It creates
   `{ name: given_name || user.name, lastName: family_name || '', avatar:
   user.image }`.
   - Google's names come through `mapProfileToUser` into the hook context.
     If they are absent it falls back to splitting `user.name`.
   - Hook failures are logged and swallowed. Sign-in must not fail because
     of the profile, and `profileStatus: missing` lets the client recover.
6. **`profileStatus`** is computed in the session route from the profile
   row, which the session service already loads through the user
   repository. No extra query is needed when the profile is cached.
7. **Preferences write.**
   - New `preferencesUpdateSchema`: a strict, non-empty partial of the fields
     in the spec.
   - Enums: `fanaticLevel low|medium|high`, `frequency
     daily|weekly|monthly`, `preferredFormat tv|movie|ova|ona|special|music`.
   - Id arrays: `z.array(int positive).max(50)`, deduped.
   - Service steps: owner policy, then id existence check (one
     `SELECT … WHERE mal_id = ANY(...)` per non-empty list), then CSV
     serialization, update, and profile cache invalidation.
   - Unknown ids raise `ValidationError` with
     `details: { unknownIds: { genres, studios, animes } }`.
8. **Tests.**
   - Unit: env refine, `sanitizeCallbackURL`, profile bootstrap mapping,
     preferences schema, service and route (owner, 403, 400, cache
     invalidation).
   - Route tests mock `auth.api`.
   - E2E covers what runs without real Google: `404` when the provider is
     not configured (the CI default), the preferences flow, and
     `profileStatus` for a password user. The real Google round trip is
     verified manually with test credentials and is documented in the PR.

## 3. Risks

- **The callback cannot be E2E-tested in CI** without Google. This is
  mitigated by unit tests around our own code and a manual checklist
  (consent, new user, existing-email conflict, explicit link).
- **Better Auth's error query param naming** differs between versions. We
  read the documented 1.6 value and map it to our code. A mapper unit test
  pins the expected input.
- **Google avatar URLs can expire or change.** Change 2 replaces them with
  stored uploads or catalog picks.
