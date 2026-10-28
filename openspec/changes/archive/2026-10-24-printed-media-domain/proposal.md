# Proposal: dominio de obra impresa (manga/novela) y reparto completo

## Problem

El catálogo tiene 30.565 anime y **cero** manga, y el reparto por anime está
cortado: la ficha HTML de MAL solo lista los diez primeros personajes, así
que 13.927 animes no tienen ninguno y ninguno tiene más de diez (medido: 115.455
personajes en 16.638 animes). El roadmap pide fichas de personajes, seiyuus y
artistas (Fase 6) y un catálogo de "anime **y manga**" (PRODUCT.md), pero el
esquema solo tiene dos dominios: `anime` y `music`.

La ventana para extraerlo es ahora: el pool de proxies es lo que hace posible
recorrer el catálogo entero de las fuentes sin quedar bloqueado por cuota, y
las fuentes van a endurecerse (AniList limita por IP, MAL devuelve 400 en sus
endpoints de lista, VGMdb ya está detrás de Cloudflare).

## Scope

- **Esquema** (migración `0010`): `manga` (raíz, indexada por id de MAL),
  `manga_title_synonym`, `manga_external_ids`, `manga_media`,
  `manga_external_link`, `anime_external_link` y las junctions
  `manga_genre` / `manga_theme` / `manga_demographic` / `manga_staff` /
  `manga_character` / `manga_producer` / `manga_relation`.
  Las entidades (género, tema, demográfica, staff, personaje, editorial) son
  **compartidas** con el dominio anime: un autor de manga y la misma persona
  que voicea un anime son la misma fila.
- **Enriquecimiento de `character` y `staff`**: `anilist_id`, género, fecha de
  nacimiento, tipo de sangre, altura, peso, edad y favoritos; para `music`:
  álbum, duración, fecha de publicación, letra y fuente.
- **Datos**: 70.958 obras impresas (57.867 manga, 6.991 novelas, 6.000
  one-shots) con sinopsis, capítulos, serialización, editorial, relaciones,
  enlaces y portada; reparto completo por anime con rol fino y voz.
- **API**: `/api/manga` (lista con filtros) y `/api/manga/:malId` (detalle con
  taxonomía, reparto, staff, relaciones y enlaces), siguiendo el contrato de
  `withZodValidation` y el sobre de `createErrorResponse`.
- **Búsqueda**: el índice de sinónimos pasa a cubrir también las obras
  impresas, y `/api/search` admite `type=anime|manga`.

## Non-goals

- **Páginas de manga**: este change entrega datos y API; las páginas SSR del
  dominio salen en su propio change (mismo patrón que `/anime/[malId]/[slug]`).
- **Listas de lectura de manga por usuario**: `user_anime_list` es de anime;
  la lista de manga del usuario es otro change.
- **Importar manga de Kitsu/AniList sin id de MAL**: 70.542 obras de AniList no
  tienen id de MAL y el catálogo está indexado por id de MAL.
- **Recommendations de manga**: el motor de Fase 4 trabaja sobre `anime`.

## Breaking changes

None. Todo es aditivo: tablas nuevas, columnas nuevas nullable y rutas nuevas.
