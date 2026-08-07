## 1. Tipado y errores (domains)

- [x] 1.1 `user-mapper.ts`: añadir radix `10` a los 4 `Number.parseInt`; cambiar `birthday!` por `birthday ?? undefined`; actualizar JSDoc.
- [x] 1.2 `music-media-repository.ts`: reemplazar `row[srcKey]!` por map-off-null + type-guard `MusicMediaAsset`; mantener retorno `MediaAsset[]`.
- [x] 1.3 `fetch-raw-media-service.ts`: tipar `let media: MediaAsset` (import type añadido).
- [x] 1.4 `optimize-util.ts`: añadir `EmptyImageError`; reemplazar `throw new Error('Empty buffer')`; exportar desde barrel; TDD test del path de buffer vacío.

## 2. Hints de tipo (Astro/TS)

- [x] 2.1 Añadir anotación de retorno explícita a los 4 métodos (character-staff-repository, anime-service, anime-full-service, anime-characters-service) e importar sus tipos.
- [x] 2.2 `login-schema.ts`: reemplazar `z.string().email()` por `z.email()` (2 sitios) y actualizar JSDoc.
- [x] 2.3 `tsconfig.json`: añadir `coverage` y `node_modules` a `exclude`.

## 3. HTTP y tests

- [x] 3.1 `with-validation.ts`: `body: unknown | null` → `body: unknown`.
- [x] 3.2 `sentry.test.ts`: mockear `@sentry/react` para eliminar el timeout de carga en frío.

## 4. CI / CD / Docker

- [x] 4.1 `ci.yml`: `--ignore-scripts` en `bun install`.
- [x] 4.2 `Dockerfile`: `--ignore-scripts` en `bun install`.
- [x] 4.3 `deploy.yml`: fijar `actions/checkout`, `setup-buildx-action`, `login-action`, `build-push-action` a SHAs completos.

## 5. Verificación

- [x] 5.1 Recorrer el gate completo: `format → check → check:types → test → build` en verde.