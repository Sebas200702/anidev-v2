# Tasks — profile avatar and banner

> TDD-first; one commit per task. Backend only. Fetch `@aws-sdk/client-s3`
> and sharp docs (Context7) before using their APIs.

## 1. Infrastructure

- [x] 1.1 Env:
      - `S3_*`, all or none, plus `isStorageEnabled()` (tests first);
      - document them in `.env.example` and `.env.local.example`.
      - add `minio` and `minio-init` to `docker-compose.yml`, behind the
        `storage` profile.
        **Compose and env docs done ahead of the rest of the change** (`env.ts`
        and `isStorageEnabled()` still pending) — compose + `docker/minio/Dockerfile`
        + env docs land with this proposal, since the storage
        decision needed a backend that actually runs. The image is built
        from the pinned CE tags — `minio/minio` no longer exists on Docker
        Hub — and `minio-init` runs alias set + `mb` + `anonymous set` in a
        single container session.
- [x] 1.2 `bun add @aws-sdk/client-s3`. Then `@lib/storage`:
      - lazy client;
      - `putObject`, `deleteObject`, `publicUrl`.

      Unit tests with the client mocked, plus an integration spec against
      MinIO (put, public GET, delete).
- [x] 1.3 Error codes `STORAGE_NOT_CONFIGURED` (404) and
      `UNSUPPORTED_MEDIA_TYPE` (415), with mapping tests. Env-driven CSP
      `img-src` origin, with a policy test.
- [ ] 1.4 Migration: `profile.banner`, `avatar_key`, `banner_key` (local
      `db:generate` / `db:migrate`). Read DTO gains `banner`, with mapper
      tests.

## 2. Images

- [ ] 2.1 `processProfileImage` (pure sharp):
      - format detection (415 for SVG, text and others);
      - EXIF rotate;
      - crop bounds (400);
      - cover resize to 512² / 1920×534 WebP;
      - metadata stripped.

      Tests with generated fixtures.
- [ ] 2.2 `withImageUpload` wrapper:
      - Content-Length and size caps (413);
      - multipart `file` plus crop schema (400 / 415).

      Tests.

## 3. Services and routes

- [ ] 3.1 `profileImageService`:
      - upload (put, update, invalidate, delete old; rollback delete on a
        failed update);
      - gallery pick (character / anime validation);
      - reset.

      Unit tests with mocked storage and repositories.
- [ ] 3.2 Routes:
      - `PUT /api/user/:userId/avatar` and `/banner` (upload);
      - `PUT …/avatar/character` and `…/banner/anime` (gallery);
      - `DELETE …/avatar` and `…/banner`.

      Owner checks. Route tests (200, 400, 401, 403, 404, 413, 415).
- [ ] 3.3 Upload rate-limit bucket (10/min/IP), with tests. Identity schema
      avatar allowlist, with tests.

## 4. Verification, release & archive

- [ ] 4.1 CI: build the MinIO image (`docker/minio`) and run the bucket init
      in the `e2e` job — there is no pullable upstream image, so the job
      builds it (Go module cache makes the second run cheap). E2E:
      - upload avatar with crop (fetch the public URL: 200, `image/webp`);
      - replace (old object 404);
      - SVG → 415;
      - other user → 403;
      - character pick;
      - reset.
- [ ] 4.2 Full gate, AGENTS.md (env, storage, routes), ROADMAP (Fase 2),
      release minor, PR with the production storage checklist (R2 **and**
      self-hosted MinIO: endpoints, `S3_FORCE_PATH_STYLE`, public bucket
      access, reverse proxy, backups), merge, push tag, archive.
