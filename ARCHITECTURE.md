# AniDev v2 — Arquitectura Evolutiva y Plan Técnico Detallado

> **Propósito:** Documento de referencia arquitectónica de `anidev-v2` derivado
> de la auditoría de código del repositorio y la comparativa técnica profunda
> frente a [`Snozxyx/Tatakai`](https://github.com/Snozxyx/Tatakai). Define la
> arquitectura objetivo, los contratos TypeScript, la evolución del esquema
> PostgreSQL (Drizzle ORM), el motor de reproducción resiliente, las salas
> sincronizadas **Watch2Gether**, el motor híbrido de recomendaciones y la hoja
> de ruta vinculada a los changes ejecutables en `openspec/changes/`.

---

## 1. Visión arquitectónica y principios rectores

`anidev-v2` es una plataforma full-stack de descubrimiento y streaming de anime y
música construida sobre **Astro 6 SSR (`output: 'server'`, `@nurodev/astro-bun`)
+ React 19 Islands + TypeScript 6 + Drizzle ORM (PostgreSQL 16) + Dragonfly
(Redis-compatible) + Better Auth + Tailwind CSS v4 + Zod 4 + Rustrak (Sentry)**.

Todo el sistema opera dentro del presupuesto físico de **1 VPS self-hosted (4
vCPU / 8 GB RAM / 100 GB SSD)** (`ROADMAP.md` §D8), guiado por siete reglas
arquitectónicas:

1. **Tipado estricto y validación en la frontera:** Todo endpoint valida entrada
   y salida con Zod 4 (`withZodValidation` + `withErrorHandling(..., { responseSchema })`).
2. **Slices verticales cohesivos (`src/domains/*`) y *unit folders*:** Cada
   unidad funcional encapsula su `service.ts`, `repository.ts`, `mapper.ts`,
   `cache.ts`, `types.ts` e `index.ts` con un límite de **$\le 150$ líneas por
   archivo**.
3. **Dirección única de dependencias:** `src/pages/` $\to$ `src/domains/*` $\to$
   `src/lib/*` & `src/shared/*`. Ni `src/shared/` ni `src/lib/` pueden importar
   jamás de un dominio (`@anime`, `@media`, `@music`, `@user`, `@search`,
   `@watch`).
4. **Zero-JS por defecto + Islands bajo demanda:** Las páginas y componentes
   presentacionales son `.astro` SSR; las React Islands se hidratan únicamente
   para interacciones con estado complejo en cliente (Toolbar, Search/Filter bar,
   Persistent Music Player, Episode Video Player y Watch2Gether Theater).
5. **Eficiencia de memoria en el VPS de 8 GB:**
   - **Dragonfly (`512 MB`)** almacena exclusivamente JSON estructurado,
     instantáneas `:stale`, sesiones efímeras (`60 s`), contadores de
     *rate-limiting* y estado en tiempo real de salas **Watch2Gether**
     (`watch:room:{id}:clock` + Pub/Sub).
   - **Los binarios** (imágenes optimizadas con Sharp y streams de audio/vídeo)
     nunca se guardan en base64 en Dragonfly ni se cargan completos en un
     `Buffer` de RAM: las imágenes usan caché en disco local acotado (LRU) +
     `Cache-Control: immutable`, y el audio/vídeo se transmite mediante
     `ReadableStream` con soporte HTTP `Range` (`206 Partial Content`).
6. **Lectura local en PostgreSQL vs. ingesta desacoplada (Track D):** Las rutas
   del catálogo leen exclusivamente de PostgreSQL + Dragonfly; el scraper
   actualiza PostgreSQL en segundo plano.
7. **Spec-Driven Development (OpenSpec) + TDD:** Ningún cambio entra a código
   sin su especificación aprobada en `openspec/changes/` y pruebas en Vitest +
   Playwright.

---

## 2. Mapa de componentes de la arquitectura objetivo

```text
+---------------------------------------------------------------------------------------------------+
|                                     NAVEGADOR / CLIENTE WEB                                       |
|                                                                                                   |
|  +------------------------------+  +-------------------------------+  +------------------------+  |
|  |   Shell & Páginas SSR        |  |   React Islands (On-Demand)   |  |  Persistencia Local    |  |
|  |   (.astro, Zero-JS)          |  |                               |  |                        |  |
|  |  - / (Home Hero + Rails)     |  | - <Toolbar />                 |  | - Nano Stores          |  |
|  |  - /anime/[malId]/[slug]     |  | - <SearchFilterBar /> (URL)   |  | - @nanostores/persist  |  |
|  |  - /watch/[malId]/[ep]       |  | - <WatchlistButton /> (Optim) |  | - localStorage mirror  |  |
|  |  - /watch-rooms/[roomId]     |  | - <PersistentMusicPlayer />   |  |   + sendBeacon flush   |  |
|  |  - /schedule, /showcase      |  |   (transition:persist)        |  +------------------------+  |
|  |  - <ClientRouter />          |  | - <EpisodeVideoPlayer />      |               |              |
|  +------------------------------+  | - <WatchRoomTheater />        |               |              |
|                 |                  +-------------------------------+               |              |
+-----------------|----------------------------------|-------------------------------|--------------+
                  | SSR HTML + Cache-Control         | JSON Envelope / Range / SSE   |
                  v                                  v                               v
+---------------------------------------------------------------------------------------------------+
|                        SERVIDOR ASTRO 6 SSR (Bun Runtime — @nurodev/astro-bun)                    |
|                                                                                                   |
|  [ Middleware Pipeline (src/middleware/) ]                                                        |
|   1. requestIdMiddleware (x-request-id) -> 2. securityHeadersMiddleware (CSP, nosniff, DENY)      |
|   3. rateLimitMiddleware (Dragonfly token-bucket) -> 4. authMiddleware (skip /media & /health,    |
|      cache session 60s in Dragonfly)                                                              |
|                                                                                                   |
|  [ Capa HTTP & Contratos (src/shared/http/ & src/pages/api/) ]                                    |
|   withZodValidation(reqSchema) -> withErrorHandling(handler, { resSchema }) -> mapErrorToHttp     |
|                                                                                                   |
|  [ Dominios Verticales Cohesivos (src/domains/) ]                                                 |
|  +------------+ +------------+ +------------+ +------------+ +----------------+ +--------------+  |
|  |   anime    | |   music    | |   media    | |    user    | |     search     | |    watch     |  |
|  | (Catálogo, | | (Temas,    | | (Sharp Disk| | (Perfil    | | (Historial,    | | (Episodios,  |  |
|  |  Sinónimos,| |  Versiones,| |  LRU Cache | |  Público/  | |  BM25/Trgm,    | |  Playback,   |  |
|  |  Taxonomía,| |  Playlists,| |  + Stream  | |  Privado,  | |  Recomendador  | |  Progreso,   |  |
|  |  Schedule) | |  Player)   | |  Range 206)| |  Listas)   | |  Híbrido 2-Tier| |  AniSkip,    |  |
|  +------------+ +------------+ +------------+ +------------+ +----------------+ |  Watch2Gether|  |
|         |              |             |              |                |          +--------------+  |
|  [ Infraestructura Compartida (src/lib/) ]                                             |          |
|   - db/client.ts (Drizzle + pg.Pool max:20)  - cache/ (Dragonfly: JSON + Stale + Pub/Sub)         |
|   - auth/ (Better Auth + OAuth)              - monitoring/ (Pino + Rustrak/Sentry)                |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Diseño de los subsistemas clave (adaptados de Tatakai a AniDev v2)

### 3.1. Motor de reproducción resiliente (`PlaybackCoordinator` + `HlsController`)

Basado en el estudio de `src/core/player/{PlaybackCoordinator,SourceAdapterRegistry,HlsAdapter,stream-resolver}.ts` de Tatakai y adaptado a la arquitectura web de AniDev v2 (`openspec/changes/resilient-playback-and-aniskip/`):

1. **Arrendamiento por generación (`PlaybackLease`):**
   - Cada llamada a `coordinator.begin(source, initialPosition)` hace `flush()` del progreso previo, aborta el `AbortController` anterior e incrementa `++this.generation`.
   - **Continuidad automática en cambios de servidor/calidad/modo:** Si el nuevo `source` pertenece al mismo episodio (`episodeId`) o tema musical (`musicId`), conserva `this.position` como `startTime` para que el usuario cambie entre `720p` $\leftrightarrow$ `1080p`, `Server A` $\leftrightarrow$ `Server B` o `Audio` $\leftrightarrow$ `Video` sin perder el segundo exacto.
   - **Throttling de progreso:** Emite actualizaciones al sink de persistencia como máximo cada `5000 ms` durante reproducción continua, y de forma inmediata en `pause`, `completed` o `dispose()`.
2. **Cola serializada de adaptadores (`SourceAdapterRegistry`):**
   - Encadena `currentAdapter.unload()` $\to$ `nextAdapter.load()` en una promesa `this.pending`, verificando `signal.aborted || generation !== this.generation` en cada paso asíncrono para impedir que dos instancias de `hls.js` compitan por el mismo `<video>`.
3. **Sondeo rápido en paralelo (*Fast-Probe* de `1500 ms`) y failover escalonado:**
   - Antes de montar `hls.js` cuando existen múltiples fuentes candidatas, lanza sondas `fetch` en paralelo con `AbortSignal.timeout(1500)` y selecciona la primera que responde `200`/`206` (`firstFulfilled`).
   - En `HlsController`: `startLevel: 0` (arranque rápido del primer fotograma), `abrEwmaDefaultEstimate: 4_000_000`, `MAX_NETWORK_RETRIES = 2`, `MAX_MEDIA_RETRIES = 2` (con `hls.swapAudioCodec?.()` en el segundo intento y reseteo de contadores al recibir `FRAG_BUFFERED`). Al agotar los reintentos de una URL, salta automáticamente al siguiente candidato (`advanceCandidate()`).

### 3.2. Sincronización de progreso en 3 capas (`watch_progress` + `isNewerOrBetter`)

Especificado en `openspec/changes/relational-lists-and-watch-progress/`:

1. **Tres capas de almacenamiento:**
   - **Capa 1 (`localStorage` síncrono):** Escrito en cada tick del coordinador; sobrevive cierres abruptos de pestaña.
   - **Capa 2 (`navigator.sendBeacon` en `visibilitychange`/`pagehide`):** Envía el último punto de reproducción al servidor cuando el usuario cierra o minimiza la pestaña.
   - **Capa 3 (PostgreSQL `watch_progress`):** Tabla relacional con PK compuesta `(user_id, episode_id)`.
2. **Resolución determinista de conflictos (`isNewerOrBetter`):**
   - Ventana de tolerancia `NEWEST_WINS_TOLERANCE_MS = 1000`. Si dos escrituras tienen marcas de tiempo a menos de 1 segundo de distancia, gana la que tenga **mayor `progress_seconds`**, impidiendo que una carga recién abierta en otro dispositivo (`progress_seconds = 0`) sobrescriba el progreso real.
3. **Completado estilo Netflix ($\ge 90\%$) y colapso por serie:**
   - Cuando `durationSeconds > 0 && progressSeconds / durationSeconds >= 0.90`, el episodio se marca automáticamente como `completed = true`.
   - El carrusel *Continue Watching* filtra `completed = false`, ordena por `watched_at DESC` y devuelve **una única tarjeta por `anime_id`** correspondiente al episodio tocado más recientemente.

### 3.3. Watch2Gether — Salas sincronizadas en tiempo real (`watch-rooms`)

Especificado en `openspec/changes/watch2gether-synchronized-rooms/`:

1. **Arquitectura híbrida PostgreSQL + Dragonfly Pub/Sub (optimizada para 8 GB RAM):**
   - A diferencia de Tatakai (que escribe cada segundo de reproducción en PostgreSQL y dispara invalidaciones globales por Supabase Realtime), AniDev v2 separa:
     - **Estado duradero en PostgreSQL:** `watch_room`, `watch_room_participant`, `watch_room_queue`, `watch_room_message`, `watch_room_poll` y `watch_room_poll_vote`. La columna `password_hash` jamás se incluye en `PUBLIC_WATCH_ROOM_COLUMNS`.
     - **Reloj de reproducción en vivo y eventos en Dragonfly:** El hash `watch:room:{roomId}:clock` almacena `{ isPlaying, positionSeconds, updatedAtMs, animeId, episodeId, musicId, category }` y el canal Pub/Sub `watch:room:{roomId}:events` difunde instantáneamente cambios de estado, mensajes de chat, reacciones y votos a los clientes conectados por **Server-Sent Events (`GET /api/watch-rooms/:roomId/events`)**.
2. **Algoritmo de corrección de deriva en 3 niveles (`computeDriftCorrection`):**
   - Cada participante calcula `liveHostTime = clock.positionSeconds + (clock.isPlaying ? (nowMs - clock.updatedAtMs) / 1000 : 0)` y la deriva $\Delta t = \text{liveHostTime} - \text{participantTime}$:
     - **Deriva grande ($|\Delta t| > 2.5\text{ s}$):** *Hard seek* inmediato a `liveHostTime` y `playbackRate = 1.0`.
     - **Deriva media ($0.35\text{ s} < |\Delta t| \le 2.5\text{ s}$):** Ajuste proporcional suave de `playbackRate` ($\pm 0.08$, acotado a `[0.92, 1.08]`) para alcanzar o esperar al host sin cortes de audio ni saltos bruscos de imagen.
     - **Deriva pequeña ($|\Delta t| \le 0.35\text{ s}$):** Sincronizado (`playbackRate = 1.0`).
3. **Ciclo de vida de la sala y resiliencia:**
   - Soporta tanto salas de **Anime** (`scope: 'anime'`) como Listening Parties de **Música OP/ED** (`scope: 'music'`).
   - Heartbeat de participantes cada `25 s`; si el host abandona la sala, el rol `is_host` se transfiere automáticamente al participante activo más antiguo; las salas sin actividad durante más de `5 min` se cierran automáticamente (`is_active = false`).

### 3.4. Motor híbrido de recomendaciones en 2 niveles (`hybrid-taste-and-ai-recommendations`)

Especificado en `openspec/changes/hybrid-taste-and-ai-recommendations/`:

1. **Nivel 1 — Determinista + `pgvector` en PostgreSQL (<50 ms, coste $0):**
   - Calcula el score de engagement (`0–100`) por anime del historial combinando 5 señales:
     $$\text{engagement} = \text{round}\Big((0.30 \cdot \text{breadth} + 0.25 \cdot \text{completion} + 0.20 \cdot e^{-\text{days}/28} + 0.15 \cdot \text{consistency} + 0.10 \cdot \text{progress}) \times 100\Big)$$
   - Aplica `dedupeFranchiseSignals` sobre el grafo `anime_relation` (`Sequel`/`Prequel`) para colapsar múltiples temporadas de una misma franquicia en una única semilla.
   - Recupera y puntúa candidatos en PostgreSQL mediante similitud vectorial (`pgvector`) + afinidad de géneros/estudios, excluyendo todo `mal_id` ya visto o listado y aplicando el floor parental (`safe`/`full`).
2. **Nivel 2 — Curador Contextual con Google Gemini (`fetch_recommendations`):**
   - Para modos semánticos (*mood*, *maratón*, *quick watch*, *asistente*), envía los 40 mejores candidatos del Nivel 1 + el `UserTasteProfile` a Gemini con validación Zod, caché en Dragonfly (`TTL: 6 h`), rate-limit por usuario y **fallback automático al Nivel 1** si Gemini falla o excede el timeout (`6 s`).

---

## 4. Evolución del esquema PostgreSQL (Drizzle ORM)

Resumen de las tablas nuevas y evolucionadas planificadas en los changes de OpenSpec:

| Tabla (`src/lib/db/schemas/`) | Tipo de cambio | Clave primaria / Índices clave | Propósito |
|---|---|---|---|
| `profile` | Modificada (`T-05`) | PK `id`, `UNIQUE(user_id)` | Garantizar 1 perfil por cuenta de usuario en BD. |
| `episode_source` | Evolucionada (`T-11`) | PK `id`, `UNIQUE(episode_id, src)`, `INDEX(episode_id, priority)` | Añadir `provider`, `server_name`, `format`, `quality`, `audio`, `headers` (JSONB) y `priority`. |
| `episode_subtitle` | Evolucionada (`T-11`) | PK `id`, `UNIQUE(episode_id, language, src)` | Añadir `label`, `format` (`vtt`/`ass`/`srt`) e `is_default`. |
| `user_anime_list` | Nueva (`T-10`) | PK `(user_id, anime_id)`, `INDEX(user_id, status, updated_at DESC)` | Listas relacionales por estado (`watching`, `completed`, `plan_to_watch`, `on_hold`, `dropped`), `is_favorite` y `score`. |
| `watch_progress` | Nueva (`T-10`) | PK `(user_id, episode_id)`, `INDEX(user_id, watched_at DESC)` | Progreso por segundo (`progress_seconds`, `duration_seconds`, `completed`, `watched_at`) para *Continue Watching*. |
| `watch_room` | Nueva (`Watch2Gether`) | PK `id`, `INDEX(is_active, access_type, created_at DESC)` | Salas sincronizadas (`public`, `invite`, `password` con `password_hash` server-only) para anime y música. |
| `watch_room_participant` | Nueva (`Watch2Gether`) | PK `id`, `UNIQUE(room_id, user_id)` | Participantes activos en la sala, rol `is_host`, estado `is_ready` y `last_seen_at`. |
| `watch_room_queue` | Nueva (`Watch2Gether`) | PK `id`, `INDEX(room_id, position ASC)` | Cola compartida de episodios o temas musicales en la sala. |
| `watch_room_message` | Nueva (`Watch2Gether`) | PK `id`, `INDEX(room_id, created_at DESC)` | Historial de chat, mensajes de sistema y reacciones en la sala. |
| `watch_room_poll` & `watch_room_poll_vote` | Nuevas (`Watch2Gether`) | PK `id`, `UNIQUE(poll_id, user_id)` | Encuestas en vivo dentro de la sala Watch2Gether. |

---

## 5. Secuencia de ejecución por etapas (OpenSpec Changes)

| Orden | Change en `openspec/changes/` | Etapa / Prioridad | Tareas incluidas |
|---|---|---|---|
| **1** | `platform-audit-and-stabilization` | **Etapas 0–2 (`P1` / `P2`)** — auditoría 2026-10-14 | Consolida `T-01`…`T-09` (privacidad en `/api/user/:userId` [reproducida en vivo], claves `buildRawMetaKey` + single JSON, streaming `Range` `206` + SSRF/timeout, sobre de error uniforme + degradación 503 en `index.astro`, índices B-tree/GIN + `pg.Pool` `max: 20` + FKs `CASCADE`, `resolveMediaAssets` fuera de `@shared` + regla en `biome.json`, caché de imágenes Sharp en disco acotado + `immutable`, middleware de headers/rate-limit/`x-request-id`/bypass de sesión, `Promise.all` + `anime_title_synonym` + envs de `ci.yml`) y añade los hallazgos nuevos: XSS de `/showcase`, rate-limit de credenciales, contrato de perfil tolerante a `NULL` + sin caché envenenada, `await` faltantes en 4 repositorios, carrusel set-based + batch, transacción de historial, observabilidad (access logs + redacción + runbooks), shell sin islas React + presupuesto de bundle, `bun audit` en CI, y cierre de changes mergeados. |
| **2** | `relational-lists-and-watch-progress` | **Etapa 3A (`P2`)** | `T-10`: Tablas `user_anime_list` y `watch_progress`, endpoints `/api/user/lists` y `/api/user/watch-progress`, reconciliación `isNewerOrBetter` (tolerancia 1 s), completado al $\ge 90\%$, colapso por anime en *Continue Watching* y sincronización cliente con `localStorage` + `navigator.sendBeacon`. |
| **3** | `resilient-playback-and-aniskip` | **Etapa 3B (`P2`)** | `T-11` y `T-12`: Evolución de `episode_source`/`episode_subtitle`, `PlaybackCoordinator` (leases por generación + continuidad de segundo exacto), `SourceAdapterRegistry`, `HlsController` (*fast-probe* paralelo de 1.5 s + retries acotados + `swapAudioCodec`) e integración de **AniSkip** cruzada con el catálogo musical OP/ED. |
| **4** | `watch2gether-synchronized-rooms` | **Etapa 3C (`P2`)** | Salas sincronizadas **Watch2Gether** para anime y música: tablas `watch_room*`, reloj en tiempo real y Pub/Sub en Dragonfly + SSE, algoritmo `computeDriftCorrection` en 3 niveles, cola compartida, chat, reacciones, encuestas y UI de teatro. |
| **5** | `hybrid-taste-and-ai-recommendations` | **Etapa 4 (`P2` / `P3`)** | `T-13`: Motor híbrido en 2 niveles: Nivel 1 (`UserTasteProfile` de 5 factores + deduplicación de franquicias + `pgvector` en PostgreSQL) y Nivel 2 (curador contextual con Gemini cacheado en Dragonfly con rate-limit y fallback automático al Nivel 1). |
