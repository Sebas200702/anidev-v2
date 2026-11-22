-- T4 helpers: AniList HTML → the plain-text synopsis format (paragraphs split by a blank
-- line, no tags, no entities) and the vocabulary maps to the values the app reads.
\ir fixtures.sql
\ir ../sql/01-log.sql
\ir ../sql/02-functions.sql

DO $$
BEGIN
  ASSERT pg_temp.strip_html(E'One<br><br>\nTwo') = E'One\n\nTwo', 'br + newline = paragraph';
  ASSERT pg_temp.strip_html('A<BR>B<br/>C</br>D') = E'A\n\nB\n\nC\n\nD', 'br variants';
  ASSERT pg_temp.strip_html(E'<i>Tom</i> &amp; <b>Jerry</b>\r\n\r\n(Source: X)')
    = E'Tom & Jerry\n\n(Source: X)', 'tags removed, CRLF normalised';
  ASSERT pg_temp.strip_html('&#12354;&#x41;&rsquo;&mdash;&hellip;&eacute;&nbsp;&lt;b&gt;')
    = 'あA’—…é <b>', 'numeric and named entities decoded, never re-parsed as tags';
  ASSERT pg_temp.strip_html('<a href=https://anilist.co/anime/1/>Link</a><!--link-->')
    = 'Link', 'links and comments removed';
  ASSERT pg_temp.strip_html('&#0;ok&#1114112;') = '&#0;ok&#1114112;',
    'invalid code points are left as they are';
  ASSERT pg_temp.strip_html(E' <br>\n ') IS NULL, 'blank result is NULL';
  ASSERT pg_temp.strip_html(' N/A ') IS NULL AND pg_temp.strip_html('n/a<br>') IS NULL,
    'the AniList N/A placeholder is no synopsis';
  ASSERT pg_temp.strip_html(NULL) IS NULL, 'NULL stays NULL';
  ASSERT pg_temp.ts_text('2005-10-02 00:00:00+00') = '2005-10-02 00:00:00+00',
    'timestamps log in UTC with offset';
END $$;

SET TIME ZONE 'America/Bogota';
DO $$
BEGIN
  ASSERT pg_temp.ts_text('2005-10-02 00:00:00+00') = '2005-10-02 00:00:00+00',
    'ts_text ignores the session time zone';
END $$;
RESET TIME ZONE;

-- Every mapping, one row per (kind, source, source value) → the app value.
DO $$
BEGIN
  ASSERT (SELECT array_agg(format('%s/%s/%s=%s', kind, source, source_value, app_value)
                           ORDER BY kind, source, source_value) FROM vocab)
    = ARRAY[
      'relation/anilist/ADAPTATION=Adaptation', 'relation/anilist/ALTERNATIVE=Alternative setting',
      'relation/anilist/CHARACTER=Character', 'relation/anilist/OTHER=Other',
      'relation/anilist/PARENT=Parent story', 'relation/anilist/PREQUEL=Prequel',
      'relation/anilist/SEQUEL=Sequel', 'relation/anilist/SIDE_STORY=Side story',
      'relation/anilist/SPIN_OFF=Spin-off', 'relation/anilist/SUMMARY=Summary',
      'season/anilist/FALL=fall', 'season/anilist/SPRING=spring',
      'season/anilist/SUMMER=summer', 'season/anilist/WINTER=winter',
      'season/offline/FALL=fall', 'season/offline/SPRING=spring',
      'season/offline/SUMMER=summer', 'season/offline/WINTER=winter',
      'status/anilist/FINISHED=Finished Airing',
      'status/anilist/NOT_YET_RELEASED=Not yet aired',
      'status/anilist/RELEASING=Currently Airing',
      'status/offline/FINISHED=Finished Airing', 'status/offline/ONGOING=Currently Airing',
      'status/offline/UPCOMING=Not yet aired',
      'type/anilist/MOVIE=Movie', 'type/anilist/MUSIC=Music', 'type/anilist/ONA=ONA',
      'type/anilist/OVA=OVA', 'type/anilist/SPECIAL=Special', 'type/anilist/TV=TV',
      'type/anilist/TV_SHORT=TV', 'type/offline/MOVIE=Movie', 'type/offline/ONA=ONA',
      'type/offline/OVA=OVA', 'type/offline/SPECIAL=Special', 'type/offline/TV=TV'],
    format('vocab: %s', (SELECT string_agg(source_value, ' ') FROM vocab));
  -- Every app value already exists in the stored vocabularies (public tables).
  ASSERT NOT EXISTS (SELECT 1 FROM vocab v WHERE v.kind = 'type'
    AND v.app_value NOT IN (SELECT type FROM public.anime WHERE type IS NOT NULL)),
    'type values match public.anime.type';
  ASSERT NOT EXISTS (SELECT 1 FROM vocab v WHERE v.kind = 'relation'
    AND v.app_value NOT IN (SELECT relation_type FROM public.anime_relation)),
    'relation values match public.anime_relation.relation_type';
END $$;
