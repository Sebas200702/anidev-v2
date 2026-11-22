-- apply: acts on audit + audit_add (rebuild them first with 03-audit.sql) in ONE
-- transaction. Every change is logged (01-staging.sql) so 05-rollback.sql restores the
-- exact previous state. pending pairs are untouched. Refused while a batch is logged.
SELECT EXISTS (SELECT 1 FROM removed_links) OR EXISTS (SELECT 1 FROM inserted_links)
  OR EXISTS (SELECT 1 FROM created_characters) OR EXISTS (SELECT 1 FROM created_media)
  AS has_batch \gset
\if :has_batch
DO $$ BEGIN
  RAISE EXCEPTION 'manga-cast-relink: a batch is already applied; run rollback first';
END $$;
\else
BEGIN;

-- Links to write: repoint targets and additions, with the AniList role (the repoint
-- falls back to its first local role when AniList gave none).
CREATE TEMP TABLE wanted ON COMMIT DROP AS
SELECT a.manga_id, a.target_character_id AS character_id, a.anilist_character_id,
  a.creates_character, coalesce(k.role, a.roles[1]) AS role, 'repoint' AS source
FROM audit a
LEFT JOIN manga_cast k ON k.manga_id = a.manga_id
  AND k.anilist_character_id = a.anilist_character_id
WHERE a.decision = 'repoint'
UNION
SELECT manga_id, target_character_id, anilist_character_id, creates_character, role, 'add'
FROM audit_add WHERE role IS NOT NULL;

-- Missing synthetic targets: one "character" per target from the first manga's cast entry,
-- plus its character_external AniList id.
WITH created AS (
  INSERT INTO "character" (mal_id, name, name_kanji)
  SELECT DISTINCT ON (w.character_id) w.character_id,
    coalesce(k.name_full, k.name_native, format('AniList %s', k.anilist_character_id)),
    k.name_native
  FROM wanted w
  JOIN manga_cast k ON k.manga_id = w.manga_id
    AND k.anilist_character_id = w.anilist_character_id
  WHERE w.creates_character
  ORDER BY w.character_id, w.manga_id
  ON CONFLICT (mal_id) DO NOTHING
  RETURNING mal_id
)
INSERT INTO created_characters (mal_id, anilist_id)
SELECT mal_id, mal_id - 1000000000 FROM created;

INSERT INTO character_external (character_id, mal_id, anilist_id, created_at, updated_at)
SELECT mal_id, NULL, anilist_id, now(), now() FROM created_characters;

-- Their AniList poster: priority 30 ranks after the MAL posters (20/25); size NULL.
WITH media AS (
  INSERT INTO character_media (character_id, media_type, src, size, source, priority)
  SELECT DISTINCT ON (c.mal_id) c.mal_id, 'poster', k.image_url, NULL, 'anilist', 30
  FROM created_characters c
  JOIN manga_cast k ON k.anilist_character_id = c.anilist_id
  WHERE btrim(coalesce(k.image_url, '')) <> ''
    AND k.image_url !~ '/default\.(jpg|png)$'  -- AniList placeholder, not a portrait
  ORDER BY c.mal_id, k.manga_id
  ON CONFLICT DO NOTHING
  RETURNING id, character_id
)
INSERT INTO created_media SELECT * FROM media;

-- quarantine and repoint: every row of the pair leaves manga_character.
WITH removed AS (
  DELETE FROM manga_character mc
  USING audit a
  WHERE mc.manga_id = a.manga_id AND mc.character_id = a.character_id
    AND a.decision IN ('quarantine', 'repoint')
  RETURNING mc.manga_id, mc.character_id, mc.role, a.decision, a.reason
)
INSERT INTO removed_links SELECT * FROM removed;

-- keep: rows differing only by role case collapse to the UPPERCASE (AniList) role, or to
-- the first role when none is UPPERCASE.
WITH removed AS (
  DELETE FROM manga_character mc
  USING audit a
  WHERE mc.manga_id = a.manga_id AND mc.character_id = a.character_id
    AND a.decision = 'keep'
    AND EXISTS (
      SELECT 1 FROM manga_character o
      WHERE (o.manga_id, o.character_id) = (mc.manga_id, mc.character_id)
        AND upper(o.role) = upper(mc.role) AND o.role <> mc.role
        AND (o.role = upper(o.role)
          OR (mc.role <> upper(mc.role) AND o.role COLLATE "C" < mc.role COLLATE "C"))
    )
  RETURNING mc.manga_id, mc.character_id, mc.role, 'keep', 'case-duplicate'
)
INSERT INTO removed_links SELECT * FROM removed;

-- One link per (manga, target), repoint before add; skipped when the manga already
-- links the target under any role.
CREATE TEMP TABLE chosen ON COMMIT DROP AS
SELECT DISTINCT ON (w.manga_id, w.character_id) w.manga_id, w.character_id, w.role,
  w.source
FROM wanted w
WHERE NOT EXISTS (
  SELECT 1 FROM manga_character t
  WHERE t.manga_id = w.manga_id AND t.character_id = w.character_id
)
ORDER BY w.manga_id, w.character_id, w.source DESC, w.role;

WITH inserted AS (
  INSERT INTO manga_character (manga_id, character_id, role)
  SELECT manga_id, character_id, role FROM chosen
  ON CONFLICT DO NOTHING
  RETURNING manga_id, character_id, role
)
INSERT INTO inserted_links (manga_id, character_id, role, source)
SELECT i.manga_id, i.character_id, i.role, c.source
FROM inserted i JOIN chosen c USING (manga_id, character_id);

COMMIT;
\endif
