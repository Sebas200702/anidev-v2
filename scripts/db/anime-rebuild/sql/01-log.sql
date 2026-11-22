-- Log tables of the rebuild, in the run schema (anime_rebuild). 07-rollback.sql reads them
-- to restore the exact previous state and empties them.

-- One row while an apply is in place (the double-apply guard).
CREATE TABLE IF NOT EXISTS applied (applied_at timestamptz NOT NULL);

-- anime values the apply replaced. Values are text: integers as digits, aired_from as
-- 'YYYY-MM-DD HH24:MI:SS+00' (UTC); the rollback casts them back to the column type.
-- action: 'fill' (the stored value was empty) or 'majority' (both sources disagreed with it).
CREATE TABLE IF NOT EXISTS field_updates (
  anime_id integer NOT NULL, field text NOT NULL, action text NOT NULL,
  previous_value text, new_value text NOT NULL, PRIMARY KEY (anime_id, field)
);

-- anime_relation rows the apply inserted (AniList edges); anilist_type is the source type.
CREATE TABLE IF NOT EXISTS inserted_relations (
  anime_id integer NOT NULL, relation_type text NOT NULL, related_anime_id integer NOT NULL,
  anilist_type text NOT NULL, PRIMARY KEY (anime_id, related_anime_id, relation_type)
);
