-- Included by 02-backfill.sql inside its transaction. Builds real_claim: the AniList id
-- each real character (mal_id < 1e9) claims, and its source, before the shared check.
--   cast: for each Jikan-cast link (anime_character role not UPPERCASE) of R, the only
--   :cast_schema.anilist_cast entry X of that anime with norm_name(R.name) in its
--   name_keys is a candidate (R, X); R ≡ X when all of R's candidates agree on one X.
--   character.anilist_id, when set, wins; a disagreeing cast id is logged
--   'cast-disagrees' and not claimed.

CREATE TEMP TABLE cast_candidate ON COMMIT DROP AS
WITH jikan AS (
  SELECT DISTINCT l.anime_id, l.character_id, k.name_key
  FROM anime_character l
  JOIN (
    SELECT mal_id, :"cast_schema".norm_name(name) AS name_key FROM "character"
    WHERE mal_id < 1000000000
  ) k ON k.mal_id = l.character_id
  WHERE l.role <> upper(l.role) AND k.name_key IS NOT NULL
), per_anime AS (
  SELECT j.character_id, j.anime_id, min(x.anilist_character_id) AS anilist_id
  FROM jikan j
  JOIN :"cast_schema".anilist_cast x
    ON x.anime_id = j.anime_id AND j.name_key = ANY (x.name_keys)
  GROUP BY 1, 2
  HAVING count(*) = 1
)
SELECT character_id, min(anilist_id) AS anilist_id FROM per_anime
GROUP BY 1
HAVING count(DISTINCT anilist_id) = 1;

INSERT INTO conflicts (character_id, anilist_id, reason)
SELECT c.mal_id, k.anilist_id, 'cast-disagrees'
FROM "character" c JOIN cast_candidate k ON k.character_id = c.mal_id
WHERE c.anilist_id <> k.anilist_id;

CREATE TEMP TABLE real_claim ON COMMIT DROP AS
SELECT c.mal_id AS character_id, coalesce(c.anilist_id, k.anilist_id) AS anilist_id,
  CASE WHEN c.anilist_id IS NOT NULL THEN 'character' ELSE 'cast' END AS source
FROM "character" c LEFT JOIN cast_candidate k ON k.character_id = c.mal_id
WHERE c.mal_id < 1000000000 AND (c.anilist_id IS NOT NULL OR k.anilist_id IS NOT NULL);
