-- One drift case for 04-rollback.test.sql (not a test file itself): runs :d0_stmt, checks
-- the rollback aborts and changes nothing, then runs :d0_undo.
:d0_stmt;
CREATE TEMP TABLE edited_anime AS TABLE anime;
CREATE TEMP TABLE edited_anime_relation AS TABLE anime_relation;
\echo '(expected: one anime-rebuild rollback error below)'
\set ON_ERROR_STOP 0
\ir ../sql/07-rollback.sql
\set ON_ERROR_STOP 1
SELECT set_config('anime_rebuild.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('anime_rebuild.guard')
    LIKE 'anime-rebuild: anime values changed since apply%',
    current_setting('anime_rebuild.guard');
  ASSERT same_rows('anime', 'edited_anime')
    AND same_rows('anime_relation', 'edited_anime_relation')
    AND (SELECT count(*) FROM field_updates) = 15
    AND (SELECT count(*) FROM inserted_relations) = 3, 'an aborted rollback changes nothing';
END $$;
DROP TABLE edited_anime, edited_anime_relation;
:d0_undo;
