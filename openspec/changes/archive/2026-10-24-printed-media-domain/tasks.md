# Tasks: dominio de obra impresa y reparto completo

## 1. Esquema (hecho en la migración `0010`)

- [x] `manga` + `manga_title_synonym` + `manga_external_ids` + `manga_media`
- [x] `manga_genre` / `manga_theme` / `manga_demographic`
- [x] `manga_staff` / `manga_character` / `manga_producer` / `manga_relation`
- [x] `anime_external_link` / `manga_external_link`
- [x] Columnas de `character` (anilist_id, género, nacimiento, tipo de sangre,
      altura, peso, edad, favoritos) y `staff` (anilist_id, género, nacimiento,
      favoritos)
- [x] Columnas de `music` (álbum, duración, fecha, letra, fuente)
- [x] Espejo del esquema en el scraper (`bun run schema:mirror`) + migración local

## 2. Ingesta (scraper)

- [x] `anilist:enumerate` — recorrido del espacio de ids (`id_in`) y catálogo
      de obras impresas
- [x] `malManga` — ficha completa de las 70.958 obras
- [x] `malCharacters` — reparto completo por anime
- [x] `malPerson` — nombre, bio, alias y retrato de personas
- [x] `anilistMedia` — pase profundo (reparto con voz, créditos, relaciones)
- [x] `musicMeta` — metadatos de las tiendas (Spotify oEmbed + iTunes)
- [x] Correr las cinco fuentes y promover el resultado (scraper, fuera de
      este repo: 70.860 obras promovidas, 0 personajes con nombre provisional)

## 3. API

- [x] `GET /api/manga` — lista con filtros (tipo, género, estado, año, score),
      paginación y orden por whitelist
- [x] `GET /api/manga/:malId` — detalle: taxonomía, reparto con voz, staff con
      rol, editorial, relaciones y enlaces externos
- [x] `GET /api/manga/:malId/full` — variante con objetos anidados
- [x] Índice de sinónimos de manga en `pg_trgm` y cobertura en `/api/search`
      con `type=anime|manga`
- [x] Control parental: el filtro `safe` excluye también las obras adultas

## 4. Calidad

- [x] Tests de integración con Postgres real: lista, detalle, 404 y paginación
- [x] Test de la promoción: los personajes con nombre provisional no llegan a
      la app
- [x] Verificación de cobertura: obras con portada, sinopsis, taxonomía y
      reparto (test de integración + medición sobre la base: 70.327 con
      portada, 53.867 con sinopsis, 70.206 con taxonomía, 17.351 con reparto
      de 70.860)
