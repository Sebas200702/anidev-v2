-- Builds the fill plan in TEMP tables (no persistent write). Needs the psql variables
-- cast_table (anime cast, cast_relink.anilist_cast) and manga_table (manga cast,
-- manga_cast_relink.manga_cast); a table or schema that does not exist is not read.
-- Characters reach AniList through character_external.anilist_id.
SELECT to_regclass(:'cast_table') IS NOT NULL AS has_cast,
  to_regclass(:'manga_table') IS NOT NULL AS has_manga \gset

DROP TABLE IF EXISTS fill_source, source_native, source_image, kanji_plan, poster_plan;

-- origin 1 = anime cast, 2 = manga cast; source_key = the anime / manga id.
CREATE TEMP TABLE fill_source (
  anilist_id integer NOT NULL, name_native text, image_url text,
  origin smallint NOT NULL, source_key integer NOT NULL
);
\if :has_cast
INSERT INTO fill_source
SELECT anilist_character_id, name_native, image_url, 1, anime_id FROM :cast_table;
\endif
\if :has_manga
INSERT INTO fill_source
SELECT anilist_character_id, name_native, image_url, 2, manga_id FROM :manga_table;
\endif

-- Distinct non-empty (trimmed) natives per AniList id; more than one is a conflict.
CREATE TEMP TABLE source_native AS
SELECT anilist_id, array_agg(DISTINCT native ORDER BY native) AS natives
FROM (SELECT anilist_id, btrim(name_native) AS native FROM fill_source) s
WHERE native <> ''
GROUP BY anilist_id;

-- One portrait per AniList id: anime cast first, then the lowest anime / manga id.
CREATE TEMP TABLE source_image AS
SELECT DISTINCT ON (anilist_id) anilist_id, image_url
FROM fill_source
WHERE btrim(coalesce(image_url, '')) <> ''
  AND image_url !~ '/default\.(jpg|png)$'  -- AniList placeholder, not a portrait
ORDER BY anilist_id, origin, source_key, image_url;

-- Placeholder kanji (NULL or equal to the romaji name) with an AniList native:
-- 'fill' (one native that differs), 'conflict' (several natives), 'same' (no change).
CREATE TEMP TABLE kanji_plan AS
SELECT c.mal_id AS character_id, e.anilist_id, c.name_kanji AS previous_kanji, n.natives,
  CASE
    WHEN cardinality(n.natives) > 1 THEN 'conflict'
    WHEN n.natives[1] IS NOT DISTINCT FROM c.name_kanji THEN 'same'
    ELSE 'fill'
  END AS decision
FROM "character" c
JOIN character_external e ON e.character_id = c.mal_id
JOIN source_native n ON n.anilist_id = e.anilist_id
WHERE c.name_kanji IS NULL OR c.name_kanji = c.name;

-- Characters without any poster row that have an AniList portrait.
CREATE TEMP TABLE poster_plan AS
SELECT e.character_id, i.image_url
FROM character_external e
JOIN source_image i ON i.anilist_id = e.anilist_id
WHERE NOT EXISTS (SELECT 1 FROM character_media m
                  WHERE m.character_id = e.character_id AND m.media_type = 'poster');
