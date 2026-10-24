# Design: dominio de obra impresa y reparto completo

## Decisiones

### D1. `manga` indexada por id de MAL (y `type` como discriminante)

Manga, novela, one-shot, doujin, manhwa y manhua comparten tabla con la
columna `type`. Razón: el usuario importa su lista de MAL, el id de MAL es la
clave natural que ya usa `anime`, y las APIs de MAL (`/v2/manga/{id}`) y de
AniList (`format`) no distinguen tipos. Un catálogo con clave AniList
obligaría a mapear de vuelta en cada consulta.

### D2. Entidades compartidas con el dominio anime

`genre`, `theme`, `demographic`, `staff`, `character` y `producer` son las
mismas tablas para anime y para obra impresa; solo las junctions se duplican
(`manga_staff`, `manga_character`, …). Esto habilita el cruce "mismo autor"
entre un manga y un anime, que es de lo que trata Fase 6 ("fichas ricas y
conexiones cruzadas").

### D3. Las junctions de taxonomía referencian la taxonomía de MAL

`manga_genre.genre_id` apunta a `genre.mal_id` (el id de MAL del género), no a
un id propio: es la misma clave que usa `anime_genre` y la que publica MAL.
La fuente (`malManga`) inserta los géneros/temas que falten en la tabla
`genre` antes de escribir la junction, porque un manga puede traer un género
que ningún anime usó.

### D4. El reparto se guarda con el rol de MAL y el rol fino de AniList

`anime_character.role` guarda el rol de MAL (`Main`/`Supporting`), que es lo
que la app ya consume. El pase profundo de AniList añade el rol fino
(`MAIN`/`SUPPORTING`/`BACKGROUND`) y la voz, pero **no** se cuela en la misma
columna: se aplica al vínculo ya existente (mismo id de personaje) para no
duplicar filas con roles distintos.

### D5. El cruce AniList ↔ MAL es por nombre normalizado

AniList no publica el id de MAL de sus personajes ni de su staff (solo el de
los medios). El cruce se hace por nombre normalizado (sin acentos, sin
puntuación), con el índice nombre → id en memoria del repositorio. Cuando el
nombre no casa, el vínculo se descarta: es preferible un reparto con un hueco
a un vínculo equivocado.

### D6. `anime_external_link` y `manga_external_link` en vez de una tabla polimórfica

El proyecto no admite tablas polimórficas sin FK (ver AGENTS.md): cada enlace
mantiene su FK real y se borra en cascada con su obra.

## Contrato de escritura (scraper)

El scraper (`anime-scraper-v2`) es el dueño de la ingesta; anidev-v2 es el
dueño del DDL y el scraper lo refleja (`bun run schema:mirror`).

| Origen | Qué escribe |
|---|---|
| `anilist:enumerate` | `manga` (datos básicos), `manga_external_ids.anilist_id`, `anime_external_ids.anilist_id` |
| `malManga` | ficha completa de la obra, sinónimos, taxonomía, editorial, relaciones, enlaces, portada |
| `malCharacters` | `anime_character` (reparto completo) |
| `malPerson` | nombre, biografía, alias y retrato de staff **y** personajes |
| `anilistMedia` | rol fino, voz (`character_voice_actor`), créditos, relaciones y enlaces externos |
| `musicMeta` | álbum, duración, fecha y portada de la canción |

## Riesgos

- **Duplicados de `ON CONFLICT`**: una misma obra puede aparecer con dos ids
  de AniList; el upsert deduplica por clave antes de escribir.
- **Fechas imposibles**: AniList publica fechas como `2016-06-31`; el script
  las valida antes de escribir (Postgres las rechaza).
- **Placeholders**: los personajes creados por `malCharacters` llevan un nombre
  provisional (`Personaje <id>`) hasta que `malPerson` lo sustituye; la
  promoción a la app **filtra** los que siguen así.
