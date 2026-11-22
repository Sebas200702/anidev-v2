-- One rollback-refusal case for 04-rollback.test.sql: runs :statement (a reference to a
-- created character from outside the batch), expects 05-rollback.sql to refuse and write
-- nothing, then runs :undo. Not a test file on its own (run.sh runs *.test.sql only).
:statement;
\echo '(expected: one manga-cast-relink rollback error below)'
\set ON_ERROR_STOP 0
\ir ../sql/05-rollback.sql
\set ON_ERROR_STOP 1
SELECT set_config('manga_cast_relink.rollback', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('manga_cast_relink.rollback')
    LIKE 'manga-cast-relink: created character % is referenced by rows outside the batch',
    current_setting('manga_cast_relink.rollback');
  ASSERT (SELECT count(*) FROM removed_links) = 9
    AND (SELECT count(*) FROM created_characters) = 3, 'a refused rollback keeps the log';
  ASSERT same_rows('character', 'applied_character'), 'a refused rollback deletes nothing';
END $$;
:undo;
