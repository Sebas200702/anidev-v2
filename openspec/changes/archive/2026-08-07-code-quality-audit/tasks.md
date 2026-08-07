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

## 6. Convenciones de código (auditoría AGENTS.md)

- [x] 6.1 `optimize-util.ts` excede las 150 líneas tras añadir `EmptyImageError`: extraer `ImageFormat`, `ImageSource`, `OptimizeOptions` a `optimize-util-types.ts` hermano; mantener imports estables (re-export + barrel).

## 7. Arrow-only en todo el proyecto

- [x] 7.1 Convertir todas las declaraciones `function` de `src/` a arrow-const (33 archivos, ~52 funciones). Genéricos sin coma extra (`.ts`, no `.tsx`); parentizar el tipo de retorno-función en `withErrorHandling`; sin problemas de hoisting. Gate completo en verde.

## 8. SRP y arquitectura (auditoría AGENTS.md, fase 2)

- [x] 8.1 Imports: reemplazar la forma `@/domains/*` por el alias `@domains/*` (4 sitios en `music`) y `@/config/env` → `@config/env`; activar `noRestrictedImports` en `biome.json` para bloquear `@/shared|@/domains|@/lib`. Gate verde. (Los 6 `@/config` de carpeta se dejan: alias `@/*` válido, sin forma dedicada bare en tsconfig.)
- [x] 8.2 Cross-domain: los services de `anime` no importan repositorios de `media`/`music` directamente. Nuevos services públicos `get-anime-media-service` (media) y `anime-music-service` (music), exportados por barrel; `anime-service`/`anime-full-service` los consumen. Gate verde.
- [x] 8.3 SRP de tipos: movidos los `type`/`interface` inline de mappers/services/repositories/cache/http a un `-types.ts` hermano (~34 archivos nuevos), re-exportando desde el origen los que eran `export` para mantener imports/barrels estables. Object shapes → `interface`; uniones/mapped/función/`z.infer`/`typeof` → `type`. `api-envelope.ts` renombrado a `api-envelope-types.ts`. Excepciones respetadas y verificadas (`z.infer<typeof localSchema>` en `login-schema`/`api-schema`; `typeof` runtime en `auth/server`, `codes.ts`).
- [x] 8.4 Gate completo (`format → check → check:types → test → build`) en verde tras la fase 2.

## 9. Alias por dominio (fase 3)

- [x] 9.1 Crear un alias dedicado por dominio (`@anime`, `@auth`, `@media`, `@music`, `@user` → `src/domains/*`) en `tsconfig.json`, `astro.config.mjs` y `vitest.config.ts`; eliminar el alias genérico `@domains`.
- [x] 9.2 Migrar los 280 imports `@domains/<dominio>/*` al alias por dominio `@<dominio>/*` en todo `src/` (solo formas con comilla; JSDoc intacto).
- [x] 9.3 Añadir `@domains/*` a `noRestrictedImports` (Biome) para forzar el alias por dominio; actualizar la lista de alias en `AGENTS.md`.
- [x] 9.4 Gate completo en verde (límite vigente confirmado: 150 líneas/archivo, 80 columnas).