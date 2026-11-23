-- Included by 03-audit.sql and 04-apply.sql inside their transaction. Reads only; builds
-- temp tables. Title-case manga_character rows are the MAL cast (scraper), UPPERCASE rows
-- the AniList import; synthetic ids are 1e9 + AniList character id. :relink_schema holds
-- manga_cast (AniList manga casts) and norm_name (scripts/db/manga-cast-relink).
--   b_pair (kind B): a real MAL character R (Title-case row) and a synthetic S (UPPERCASE
--     row) of the same manga whose AniList entry X = S - 1e9 holds norm_name(R.name).
--     Rule of character-external/sql/02-cast-ids.sql: in each manga of R, the only
--     manga_cast entry with R's key is a candidate; R ≡ X when all candidates agree.
--     status 'merge' or why the pair is left alone: 'ambiguous' (R has no single
--     candidate, or another one), 'shared-anilist' (several R derive X), 'no-external'
--     (R has no character_external row), 'anilist-disagrees' (R holds another AniList
--     id), 'anilist-taken' (a third character holds X).
--   a_row (kind A): UPPERCASE rows whose (manga, character) — after the merge — also has
--     a Title-case row; the merge itself drops a moved row whose key R already holds.
--   a_anime_row (kind A, anime_character): only UPPERCASE rows the merge moves from S to
--     R whose (anime, R) has a Title-case row after the merge.

CREATE TEMP TABLE title_pair ON COMMIT DROP AS
SELECT DISTINCT mc.manga_id, mc.character_id,
  :"relink_schema".norm_name(c.name) AS name_key
FROM manga_character mc JOIN "character" c ON c.mal_id = mc.character_id
WHERE mc.role <> upper(mc.role) AND mc.character_id < 1000000000;

CREATE TEMP TABLE name_match ON COMMIT DROP AS
SELECT t.character_id, t.manga_id, x.anilist_character_id AS anilist_id
FROM title_pair t
JOIN :"relink_schema".manga_cast x
  ON x.manga_id = t.manga_id AND t.name_key = ANY (x.name_keys)
WHERE t.name_key IS NOT NULL;

CREATE TEMP TABLE candidate ON COMMIT DROP AS
SELECT character_id AS real_id, min(anilist_id) AS anilist_id
FROM (
  SELECT character_id, manga_id, min(anilist_id) AS anilist_id FROM name_match
  GROUP BY 1, 2 HAVING count(*) = 1
) per_manga
GROUP BY 1
HAVING count(DISTINCT anilist_id) = 1;

CREATE TEMP TABLE b_pair ON COMMIT DROP AS
WITH dup AS (
  SELECT DISTINCT m.character_id AS real_id, s.character_id AS synthetic_id
  FROM name_match m
  JOIN manga_character s ON s.manga_id = m.manga_id
    AND s.character_id = 1000000000 + m.anilist_id AND s.role = upper(s.role)
), claims AS (SELECT anilist_id, count(*) AS reals FROM candidate GROUP BY 1)
SELECT d.real_id, d.synthetic_id, d.synthetic_id - 1000000000 AS anilist_id,
  CASE
    WHEN k.anilist_id IS DISTINCT FROM d.synthetic_id - 1000000000 THEN 'ambiguous'
    WHEN cl.reals > 1 THEN 'shared-anilist'
    WHEN e.character_id IS NULL THEN 'no-external'
    WHEN e.anilist_id <> k.anilist_id THEN 'anilist-disagrees'
    WHEN EXISTS (
      SELECT 1 FROM character_external o
      WHERE o.anilist_id = k.anilist_id AND o.character_id NOT IN (d.real_id, d.synthetic_id)
    ) THEN 'anilist-taken'
    ELSE 'merge'
  END AS status
FROM dup d
LEFT JOIN candidate k ON k.real_id = d.real_id
LEFT JOIN claims cl ON cl.anilist_id = k.anilist_id
LEFT JOIN character_external e ON e.character_id = d.real_id;

CREATE TEMP TABLE a_row ON COMMIT DROP AS
SELECT u.manga_id, u.character_id, u.role,
  coalesce(p.real_id, u.character_id) AS target_id, p.real_id IS NOT NULL AS via_merge
FROM manga_character u
LEFT JOIN b_pair p ON p.synthetic_id = u.character_id AND p.status = 'merge'
WHERE u.role = upper(u.role)
  AND EXISTS (
    SELECT 1 FROM manga_character t
    WHERE t.manga_id = u.manga_id AND t.character_id = coalesce(p.real_id, u.character_id)
      AND t.role <> upper(t.role)
  )
  AND NOT (p.real_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM manga_character d
    WHERE (d.manga_id, d.character_id, d.role) = (u.manga_id, p.real_id, u.role)
  ));

CREATE TEMP TABLE a_anime_row ON COMMIT DROP AS
WITH moving AS (
  SELECT a.anime_id, p.real_id AS character_id, a.role
  FROM anime_character a JOIN b_pair p ON p.synthetic_id = a.character_id
    AND p.status = 'merge'
  WHERE NOT EXISTS (SELECT 1 FROM anime_character d
    WHERE (d.anime_id, d.character_id, d.role) = (a.anime_id, p.real_id, a.role))
)
SELECT DISTINCT u.anime_id, u.character_id, u.role
FROM moving u
WHERE u.role = upper(u.role) AND (
  EXISTS (SELECT 1 FROM anime_character t
    WHERE (t.anime_id, t.character_id) = (u.anime_id, u.character_id)
      AND t.role <> upper(t.role))
  OR EXISTS (SELECT 1 FROM moving t
    WHERE (t.anime_id, t.character_id) = (u.anime_id, u.character_id)
      AND t.role <> upper(t.role)));
