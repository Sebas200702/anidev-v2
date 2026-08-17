# AniDev v2 — Roadmap

> Estado: vivo. Este documento define **qué** se construye y **en qué orden**.
> El **cómo** de cada feature vive en su change de OpenSpec (`openspec/changes/`),
> que es la fuente de verdad ejecutable. Este roadmap es la vista de producto;
> los specs son el contrato.

## Contexto

AniDev v2 es una reconstrucción desde cero de v1 (cerrada, solo referencia) con
mejor arquitectura y prácticas. La v1 define el **piso de paridad**; la meta es
igualarla por _slices verticales_ y luego expandir el universo.

**Principio rector:** _priorizar el descubrimiento claro de contenido_ (ver
`PRODUCT.md`). El orden de fases lo refleja: primero el catálogo y la búsqueda.

## Estado de partida (agosto 2026)

Cimientos sólidos; ~25 % de la superficie de v1.

| Dominio | Estado |
|---|---|
| **infra** | Health, error-handling, monitoring (Rustrak), resilience/degradación, cache multicapa (Dragonfly), response-schema validation en el wrapper. |
| **anime** | Read: lista/detalle/`full`/characters/staff. **Búsqueda avanzada**: filtros (season/score), sort whitelist, free-text indexado (`pg_trgm`), floor parental safe-only. Páginas `/anime/[malId]/[slug]`. |
| **search** | Historial por usuario (record best-effort + read/clear authed). |
| **music** | Read: lista + detalle. Sin player. |
| **media** | Optimización de imágenes (Sharp), proxy, resolución de assets. Maduro. |
| **auth** | Login/register/logout/session (Better Auth). |
| **user** | Read de perfil + writes de identidad (create/patch). |

**Archivados (OpenSpec):** migración provider stack (Turso→Postgres, Upstash→
Dragonfly, Sentry→Rustrak), `api-response-schema-in-wrapper`, unit folders,
`standardize-frontend-flow`, user writes, `advanced-anime-search`,
`e2e-testing-methodology` + `expand-test-coverage-and-fix-e2e-bugs`. Sus deltas
están sincronizados en `openspec/specs/`.

## Cómo se entrega cada feature

Cada capacidad se implementa como **slice vertical completo**, no por capas
horizontales:

```text
repository → service → mapper → cache → schema (Zod) → API → isla/página → showcase → tests
```

Reglas transversales en **todas** las fases:

- **OpenSpec obligatorio**: `SPECIFY → PLAN → TASKS → IMPLEMENT`. Nada se codea sin spec aprobado.
- **TDD** con Vitest: test que falla antes del fix.
- **Accesibilidad**: contraste ≥ 4.5:1, navegación por teclado, `focus-visible`, `prefers-reduced-motion`.
- **Diseño dark-only**, tokens de Tailwind v4, sin colores hardcodeados.
- **SEO** y performance por defecto (SSR + islas on-demand).
- **Gate de verificación**: `format → check → check:types → test → build`.

---

## Fases

### Fase 0 — Cerrar cimientos · _completada_

Desbloquea todo lo demás. No añade features de producto; estabiliza la base.

- [x] Terminar changes abiertos: provider stack, response-schema wrapper, unit folders, frontend-flow, user writes (todos archivados).
- [ ] SEO base: sitemaps segmentados (anime, música, géneros, estáticos) + `robots.txt`.
- [ ] Middleware transversal: rate-limiting, sesión, CSP + headers de seguridad.
- [ ] Patrón de UI documentado y `/showcase` operativo (living docs).

**Salida:** base estable + patrón de UI repetible antes de escalar.

---

### Fase 1 — Núcleo de descubrimiento 🎯 · _prioridad inmediata_

El corazón del producto. Convierte la v2 en un catálogo explorable de verdad.

- [x] **Búsqueda avanzada** — filtros: género, tipo, score (rango), estado, año, rating, temporada + `search_query`; orden configurable; paginación. **Estudio/productora y día de emisión quedan diferidos** hasta el backfill del Track D. _(Change archivado: `advanced-anime-search`.)_
- [ ] **Homepage** — héroe + carruseles SSR de contenido relevante.
- [ ] **Ficha de anime completa** — sinopsis, géneros, personajes, relacionados, banners (RPCs `get_related_anime` / `get_anime_banner`).
- [ ] **Taxonomía** — páginas por género y por estudio/productora.
- [x] **Control parental** — exclusión de ratings adultos embebida en las queries del catálogo (default seguro, fail-closed; variante `full` requiere opt-in, change pendiente).
- [x] **Historial de búsqueda** — persistido por usuario autenticado (read/clear en `/api/search-history`).

**Salida:** descubrimiento end-to-end; prerequisito de las recomendaciones IA.

---

### Fase 2 — Identidad y listas · _retención + base de personalización_

- [ ] **Perfil completo** — avatar (subida + recorte vía dominio media/Pinata), preferencias (color de énfasis, control parental), campos extendidos para IA (géneros/estudios favoritos, nivel de fanatismo, frecuencia, formato preferido).
- [ ] **OAuth** — flujos de proveedores además de email/password.
- [ ] **Listas de anime** — To Watch / Watching / Completed / Collection con add/remove **optimista + deshacer**.

**Salida:** cuenta con estado propio; datos que alimentan la IA.

---

### Fase 3 — Música y player · _joya de v1, dominio autocontenible_

- [ ] **Player persistente** — `transition:persist` + `client:idle`, store Zustand, superviviente a navegación.
- [ ] **Playlist** — add/remove con toast + undo, siguiente/anterior, shuffle, repeat, limpiar.
- [ ] **Cola "Up Next"** reordenable por drag & drop.
- [ ] **Versión/resolución**, modo audio/video, autoplay al terminar, player arrastrable minimizado.
- [ ] **Mejora sobre v1**: playlists **persistidas por usuario en BD** (no solo `sessionStorage`).
- [ ] **Descargas** — openings/endings en audio/video con versión/resolución vía `/api/download`.

**Salida:** paridad + superación del dominio más maduro de v1.

---

### Fase 4 — Recomendaciones IA · _depende de catálogo + perfil_

- [ ] **Motor Gemini** — system prompt de curador experto, function calling (`fetch_recommendations` → `mal_ids`).
- [ ] **Contextos** — búsqueda actual, viendo, mood, similar-a, estacional, maratón, quick watch.
- [ ] **Personalización** — perfil de usuario + contexto temporal + estrategia de curación.
- [ ] **Base + fallback** — Jikan/MAL como base y respaldo cuando Gemini devuelve vacío.
- [ ] **Utilidades IA** — resumen sin spoilers, keywords, JSON estructurado.
- [ ] **Mejora**: asistente conversacional en lenguaje natural.

**Salida:** descubrimiento personalizado, el diferenciador de la plataforma.

---

### Fase 5 — Watch / streaming ⚠️ · _bloqueado por datos, no por código_

En v1 `episode.video_url` está vacío: el streaming **no funciona end-to-end**.
El modelo de datos ya existe (`episode`, `episode_source`, `episode_subtitle`).

- [ ] **Spike de fuente de video** — decisión de legalidad/hosting/integración + backfill de episodios. **Bloqueante de todo lo demás en la fase.**
- [ ] **Video proxy** — con soporte de range requests.
- [ ] **Página watch** (`/watch/[slug]`) — navegación de episodios, seguimiento de progreso, selección de calidad y subtítulos.
- [ ] **Continuar viendo** — reanudación exacta de progreso entre dispositivos.

**Salida:** streaming real. Va tarde a propósito: es un problema de datos/decisión, no de arquitectura.

---

### Fase 6 — Contenido enriquecido

- [ ] **Personajes / artistas / seiyuu** — páginas dedicadas (`/character`, `/artist`, `/voice-actor`) + **backfill** de enlaces voice-actor (v1: ~4.2k de 217k).
- [ ] **Schedule** — calendario de estrenos/emisiones.
- [ ] **Colecciones** — `/collection/[slug]` con gestión personal.

**Salida:** fichas ricas y conexiones cruzadas música ↔ artista ↔ seiyuu.

---

### Fase 7 — Expansión del universo · _nuevas capacidades_

- [ ] **Social** — reseñas/comentarios por anime/episodio, ratings/reacciones, perfiles públicos compartibles, seguir usuarios, feed de actividad, foros/clubs por temporada/género.
- [ ] **Notificaciones** — nuevos episodios de la watch list (push/email), recordatorios de estreno ligados al schedule.
- [ ] **Gamificación** — logros/insignias (maratones, joyas ocultas), retos de visualización.
- [ ] **AniDev Wrapped** — estadísticas anuales personalizadas.
- [ ] **PWA / offline** — música descargada y listas.
- [ ] **i18n** — unificar UI (inglés) y prompts (español); múltiples idiomas.

**Salida:** comunidad y engagement; la v2 supera a v1 en ambición.

---

---

## Track D — Plataforma de Datos · _paralelo a las fases_

El catálogo de v2 es hoy un **volcado congelado (~2.25M filas, derivado de MAL)**
sin pipeline vivo: no se refresca, y faltan `studios`/`licensors`, `broadcast`,
trailers y `episode.video_url`. La ingesta se retoma desde el scraper existente
([`anime-scraper-v2`](https://github.com/Sebas200702/anime-scraper-v2)), cuya
arquitectura (cola de tareas en DB, rotación de proxies, multi-fuente, batch
upsert) es sólida pero falla por **bloqueos** y **tareas perdidas**.

**Fuentes:** Jikan v4 (metadata, characters, staff, episodios-metadata,
relaciones, **studios/producers/licensors**, **broadcast**, trailers) ·
AnimeThemes.moe (openings/endings con audio/video reales) · MAL CDN (imágenes) ·
Kitsu/TVDB (IDs cruzados). Video de episodios: sin fuente legal → muro de Fase 5.

**Principio:** la app **solo lee** Postgres; el pipeline **escribe** Postgres +
índice de búsqueda. La app nunca llama a las fuentes en request-time (salvo el
fallback de recomendaciones).

### D.0 — Dos modos de ejecución

El scraper original se diseñó para **llenar una DB vacía** (de ahí su agresividad).
Cambio de enfoque: ya hay datos con **incongruencias** del pipeline viejo. Se
separa en dos modos:

- [ ] **Modo A — Backfill + reconciliación** (one-off, entorno **aislado NO-prod**): reconstruye un dataset de catálogo **completo y consistente** hasta el punto de ejecución. Concurrencia alta permitida (no compite con los 8 GB de prod). Al terminar → promoción.
- [ ] **Modo B — Update incremental** (recurrente, **prod**, ligero): solo añade/actualiza lo **nuevo** (recently-updated de MAL, temporada nueva, entidades faltantes); no barre todo. Baja concurrencia (respeta D8).
- [ ] **Dashboard de control** (prod): configurar **cadencia** (diaria/semanal) y **alcance** (fuentes/task-types), persistido en DB, disparado por `pg_cron`.
- [ ] **Promoción A → prod = diff-upsert** por clave de identidad (`mal_id`): insert nuevos + update cambiados, en **transacción atómica** con orden FK-safe (padres→hijos), **validación referencial previa** y **rollback** ante fallo. Política explícita de filas obsoletas: solo se eliminan huérfanas **no referenciadas por datos de usuario**. Preserva tablas de usuario/auth/listas y sus FKs. Swap destructivo **descartado**: prod ya tiene datos de usuario que referencian el catálogo por `mal_id`. _(D1 mantiene el mecanismo decidido — diff-upsert; este protocolo es su detalle de implementación en Track D.)_

### D.1 — Endurecer el scraper (4 capas · aplica a ambos modos)

- [ ] **Fetcher resiliente**: clasificar respuesta (`ok / 429 / blocked / 404 / transient / invalid-body`); retry con backoff+jitter; respetar `Retry-After`; timeouts (`headersTimeout`/`bodyTimeout` + `AbortController`); detectar HTML/challenge antes de `JSON.parse`.
- [ ] **Proxies**: revivir proxies muertos con re-probe (que el pool no solo encoja); degradar en vez de `throw 'Not enough proxies'`; no penalizar al proxy por un 404 de la fuente.
- [ ] **Cola crash-safe**: claim con `FOR UPDATE SKIP LOCKED` + lease (`leased_until`) + reaper que re-encola leases expirados; usar `attempts` → `dead_letter` tras N; backoff vía `scheduledAt`; task-type re-encolable para refresh recurrente.
- [ ] **Rate-limit global**: token bucket por dominio/IP (no por-worker). **Ámbito por fuente primero**: usar por defecto el **menor límite efectivo de la fuente** (incl. los de Jikan/MAL que disparan 429); multiplicar por proxies-sanos **solo si la fuente confirma que el límite es por-IP/proxy** (no si es global o por-API-key). `maxWorkers` **alto en Modo A** (entorno aislado) pero de **unidades en Modo B** (VPS prod 4c/8GB); las 60-80 originales sin entorno propio eran co-causa de los fallos (CPU/RAM además de bloqueos).

### D.2 — Portar a Postgres + integrar

- [ ] Portar de Turso/SQLite a **Postgres** (dialecto Drizzle pg); **anidev-v2 es dueño único del esquema/migraciones**, el scraper no define DDL.
- [ ] Correr como **servicio separado** en el compose self-hosted, escribiendo a la Postgres compartida.
- [ ] Scheduling de refresh con **`pg_cron`** (barrido estacional + recently-updated).

### D.3 — Índice y cobertura

- [ ] **Índice de búsqueda (Postgres-native, ver D3)**: el BM25 de ParadeDB se auto-mantiene en cada write (sin sync externo); el pipeline solo mantiene la tabla/vista denormalizada `anime_search` y **genera embeddings pgvector** por anime (synopsis+géneros) como columna a llenar (habilita recs semánticas de Fase 4).
- [ ] **Métricas de cobertura**: extender `statsReporter` con block-rate, 429-rate, dead-letters y **% de columnas llenas por tabla** (los huecos como dashboard).

### Backfills mapeados a features

| Backfill | Desbloquea |
|---|---|
| studios/licensors split + broadcast | Filtros de **estudio** y **día** (Fase 1), Schedule (Fase 6) |
| voice-actor links (~4.2k de 217k en v1) | Fichas de seiyuu (Fase 6) |
| episode `video_url` | **Muro de Fase 5** — requiere decisión de fuente, no backfill |

**Dependencia dura:** Fase 1 (búsqueda) necesita D.3 (índice) para ser fresca, y
D.1 para que los filtros de estudio/día tengan datos.

---

## Frontend (islas · estado · caché)

Base: Astro 6 SSR (`output: 'server'`), `<ClientRouter/>` activo, **cero islas
aún** (greenfield). El change archivado `standardize-frontend-flow` fija zero-JS +
islas on-demand, one-way y presentational/container. D4+D5 añaden el resto.

**Árbol de estado (usa el nivel más bajo que resuelva):**
1. Sin JS (`.astro`) → 2. `<form>`+API → 3. `useState` local (una isla) →
4. **Nano Stores** (estado compartido entre islas) → 5. `transition:persist` +
nanostore (sobrevive navegación → **player**).

- **Nano Stores = primitivo único** de estado compartido; Zustand solo como
  escape-hatch justificado (máquina de estados interna del player).
- **La URL es el estado** en superficies de descubrimiento (búsqueda/filtros):
  query params = fuente de verdad; isla sincroniza URL↔store y refetch-ea.
- Persistencia local con `@nanostores/persistent`; playlists por-usuario en DB
  = hidratación vía API.

**Personalización vs caché (regla en una línea):** _la URL es el estado; el
shell es anónimo y cacheable; la personalización son islas client-side sobre
una API por-usuario sin caché._

- **Shell SSR anónimo cacheable** (`public, s-maxage, stale-while-revalidate`).
- **Control parental = variante de cache-key** (`safe` default / `full` authed
  opt-in) vía `Vary`/cookie coarse. Nunca cachear por user-id. Anónimo siempre
  `safe`; si la capa de caché **no garantiza aislamiento de variantes**, la
  variante `full` no se comparte (`private, no-store`).
- **Islas personalizadas** (watchlist, continuar viendo, color) → fetch a API
  `private, no-store` sobre el shell cacheado.
- Páginas irreduciblemente personales (perfil, listas) → `private, no-store`.
- Caché en VPS: reverse proxy del PaaS (o Cloudflare delante) + **Dragonfly**
  (fragmentos/datos) + `Cache-Control` de navegador.
- **Middleware**: resolución de sesión `pre` debe ser barata (cookie-check), sin
  golpear DB en páginas cacheables; sesión completa solo en APIs personalizadas.

## Testing y costos

**Pirámide de testing** (corre en **CI/GitHub Actions, no en el VPS** → no toca
los 8 GB de prod):

- **Unit** (Vitest, TDD) — base, loop rápido del gate. Ya existe.
- **Integración** — Vitest + **Postgres/ParadeDB real en service container**
  (imagen y versión **pinneadas**, bootstrap de extensiones + **healthcheck que
  falla si `pg_search`/`vector` no están disponibles**); rutas API end-to-end +
  **queries BM25** (no unit-testeables). De-risk de D3.
- **E2E** — **Playwright** (skill `webapp-testing`), **smoke acotado** de
  journeys clave (search→ficha, auth, watchlist, player).
- **a11y** — **axe-core** en Playwright + sobre `/showcase`. No negociable
  (a11y es principio de producto).
- Gate por capas: unit rápido local; integración/E2E/a11y = jobs CI separados.

**Modelo de costos** — descubrimiento/música/IA son baratos y acotados al VPS;
**el video es el único costo sin techo**:

- **IA (Fase 4)**: cache-first (Dragonfly) + **rate-limit duro** en endpoints de
  IA/búsqueda (abusables). Embeddings ~28k = pocos $ una vez.
- **Image proxy**: caché inmutable (ya); offload a CDN si escala.
- **Video (Fase 5)** ⚠️: egress = bomba. **Go/no-go obligatorio con estimación
  de egress**; storage+CDN externo (p. ej. Cloudflare R2 sin egress — verificar);
  puede acotarse a set curado o descartarse.
- Doctrina: **presupuesto de APIs externas** (Gemini/embeddings/Jikan) =
  cache-first + rate-limit, para que un pico/abuso no dispare costo ni ban.

## Docs (tres audiencias)

Hilo conductor: **generar, no mantener a mano**.

- **UI/componentes → `/showcase`** dinámico API-fed (ya decidido). **Storybook
  rechazado** (no renderiza `.astro`; `/showcase` con datos reales es superior).
- **Producto/dev/conceptual → Starlight** (Astro-native, self-host, búsqueda
  Pagefind offline). **Mintlify rechazado** (SaaS-first, choca con D8). Se
  despliega como **sitio estático separado** (otro servicio PaaS, ~0 RAM,
  desacoplado del runtime SSR de la app).
- **Referencia de API → generada**: Zod 4 (`z.toJSONSchema`) → OpenAPI → render
  en Starlight (`starlight-openapi`/Scalar); **JSDoc → referencia de código**.
  Regeneración en **CI** para que no se pudra.
- **OpenSpec = fuente de verdad interna**; Starlight deriva/enlaza la subserie
  human-facing, no duplica `AGENTS.md`/`PRODUCT.md`/specs.

## Infra (self-hosted, VPS único)

Todo corre en **un VPS: 4 núcleos / 8 GB RAM / 100 GB SSD** (sin Vercel ni
Supabase). Servicios ya desplegados: **Postgres** (`database`), **Dragonfly**
(cache), **Rustrak** (monitoring), **app** (Astro vía `@nurodev/astro-bun`),
`libredb-studio`. El scraper se añadirá como servicio más.

**La RAM es el recurso escaso** y condiciona toda ampliación:

- Postgres carga **ParadeDB (BM25)** + **pgvector (HNSW/IVFFlat)** además del set
  de trabajo normal → presupuestar `shared_buffers`/`work_mem`; preferir IVFFlat
  si HNSW no cabe.
- **Scraper**: concurrencia real de **unidades**, no las 60-80 del scraper
  original (co-causa de sus fallos). El rate-limit global lo respeta.
- **Embeddings**: API externa o batch offline; nada de modelos locales grandes.
- **Video (Fase 5)**: la media no cabe en el VPS → almacenamiento/CDN **externo**
  obligatorio si watch entra en scope.
- Reconciliar `@astrojs/vercel` (residual en deps) → adaptador Bun/Node.

## Decisiones de arquitectura (log)

Registro vivo de decisiones transversales. `OPEN` = pendiente de cerrar.

| # | Decisión | Estado |
|---|---|---|
| D1 | Scraper en **dos modos/entornos**: (A) **backfill+reconciliación** one-off en entorno aislado NO-prod (agresivo permitido; reconstruye dataset consistente) → **promoción a prod**; (B) **update incremental** en prod, ligero, **configurable desde dashboard** (cadencia+alcance) vía `pg_cron`. Servicio separado; v2 dueño del esquema; sin paquete compartido aún. **Promoción = diff-upsert** (prod tiene datos de usuario → swap destructivo descartado) | ✅ decidido |
| D2 | Cola de ingesta = **Postgres-nativo** (`FOR UPDATE SKIP LOCKED` + `pg_cron`); rate-bucket en memoria (single-instance) | ✅ decidido |
| D3 | Búsqueda = **Postgres-only por etapas**: `pg_trgm`/tsvector (MVP) → **ParadeDB `pg_search`** BM25 (relevancia/typo/facetas, Drizzle-native, índice auto-mantenido) → **pgvector** (recs semánticas + híbrido RRF, Bun-native). Un solo datastore, sin sync externo. **Confirmado: Postgres self-hosted en VPS → las 3 etapas disponibles** (ver D8 para presupuesto de RAM de los índices) | ✅ decidido |
| D4 | Estado entre islas (ver §Frontend): árbol de 5 niveles; **Nano Stores** primitivo único (Zustand escape-hatch); **URL = estado** en descubrimiento; `transition:persist` para el player | ✅ decidido |
| D5 | Personalización vs caché (ver §Frontend): **shell anónimo cacheable + islas personalizadas** sobre API `no-store`; control parental = variante de cache-key (`safe`/`full`), nunca por user-id; middleware `pre` barato | ✅ decidido |
| D6 | Docs (ver §Docs): **`/showcase`** (UI, Storybook rechazado) + **Starlight** sitio estático separado (Mintlify rechazado, SaaS) + **referencia API generada** desde Zod→OpenAPI y JSDoc, regenerada en CI | ✅ decidido |
| D7 | Testing y costos (ver §Testing y costos): pirámide unit→integración(ParadeDB en CI)→E2E(Playwright)→**a11y axe**, toda en CI (no en VPS); **presupuesto de APIs externas** cache-first+rate-limit; **Fase 5 video = go/no-go con estimación de egress** | ✅ decidido |
| D8 | **Presupuesto de recursos** (ver §Infra): todo en 1 VPS 4c/8GB/100GB. RAM = cuello. BM25/HNSW presupuestados (`shared_buffers`/`work_mem`; IVFFlat si HNSW no cabe); scraper de baja concurrencia (unidades); embeddings vía API/batch (no modelo local grande); media de video **fuera** del VPS | ✅ restricción fijada |

---

## Riesgos y dependencias clave

- **Fase 5 (video)** depende de una decisión de fuente/legalidad que no es
  técnica; abordarla como spike aislado antes de comprometer UI.
- **Fase 4 (IA)** depende de que Fase 1 (catálogo) y Fase 2 (perfil) estén
  completas para tener señal de personalización.
- **Backfills de datos** (voice-actor, episodios) son trabajo de datos paralelo
  al de features; conviene planearlos como tareas propias.

## Convenciones de este documento

- Marcar `[x]` una capacidad **solo** cuando su change de OpenSpec esté archivado.
- Un ítem del roadmap puede abarcar varios changes; enlazar el primer change
  seed cuando exista.
- El orden entre fases es firme; dentro de una fase puede ajustarse por
  dependencias.
