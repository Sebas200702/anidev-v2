-- Session helpers (pg_temp: nothing persistent): HTML → synopsis text, UTC timestamp text,
-- and the vocabulary map from source values to the values the app reads.

-- AniList description → the stored synopsis format: plain text, paragraphs separated by
-- one blank line, no tags, entities decoded. Blank results and the AniList 'N/A'
-- placeholder are NULL.
CREATE OR REPLACE FUNCTION pg_temp.strip_html(raw text) RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  s text := raw;
  entity record;
  m text[];
  code integer;
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  s := regexp_replace(s, '</?(br|p)\s*/?>', E'\n', 'gi');
  s := regexp_replace(s, '<!--.*?-->|<[^>]*>', '', 'g');
  FOR m IN SELECT DISTINCT regexp_matches(s, '&#(x?)([0-9a-fA-F]{1,7});', 'gi') LOOP
    code := CASE WHEN m[1] = '' THEN m[2]::integer
                 ELSE ('x' || lpad(m[2], 8, '0'))::bit(32)::integer END;
    IF code BETWEEN 1 AND 1114111 AND code NOT BETWEEN 55296 AND 57343 THEN
      s := replace(s, '&#' || m[1] || m[2] || ';', chr(code));
    END IF;
  END LOOP;
  -- &amp; last, so '&amp;lt;' decodes to the text '&lt;', not to '<'.
  FOR entity IN SELECT * FROM (VALUES
    ('&rsquo;', '’'), ('&lsquo;', '‘'), ('&rdquo;', '”'), ('&ldquo;', '“'),
    ('&mdash;', '—'), ('&ndash;', '–'), ('&hellip;', '…'), ('&nbsp;', ' '),
    ('&eacute;', 'é'), ('&Eacute;', 'É'), ('&egrave;', 'è'), ('&aacute;', 'á'),
    ('&acirc;', 'â'), ('&auml;', 'ä'), ('&iuml;', 'ï'), ('&ntilde;', 'ñ'),
    ('&Ouml;', 'Ö'), ('&uuml;', 'ü'), ('&szlig;', 'ß'), ('&deg;', '°'), ('&bull;', '•'),
    ('&dagger;', '†'), ('&times;', '×'), ('&mu;', 'μ'), ('&micro;', 'µ'),
    ('&rarr;', '→'), ('&quot;', '"'), ('&apos;', ''''), ('&lt;', '<'), ('&gt;', '>'),
    ('&amp;', '&')) AS e (name, value)
  LOOP
    s := replace(s, entity.name, entity.value);
  END LOOP;
  s := replace(s, E'\r', '');
  s := regexp_replace(s, '[ \t]*\n\s*', E'\n\n', 'g');
  s := btrim(s, E' \t\n');
  RETURN CASE WHEN s = '' OR upper(s) = 'N/A' THEN NULL ELSE s END;
END $$;

-- CSV number text ('12', '12.0', 'nan', '') → integer, or NULL when it is not a number.
CREATE OR REPLACE FUNCTION pg_temp.num(value text) RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN value ~ '^\s*-?\d+(\.\d+)?\s*$' THEN floor(value::numeric)::integer END
$$;

-- AniList start date → timestamptz at 00:00 UTC (the stored format); NULL when partial
-- or not a real date.
CREATE OR REPLACE FUNCTION pg_temp.start_date(y integer, m integer, d integer)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN make_timestamptz(y, m, d, 0, 0, 0, 'UTC');
EXCEPTION WHEN datetime_field_overflow OR invalid_parameter_value THEN
  RETURN NULL;
END $$;

-- aired_from as logged text: UTC with an explicit offset, independent of the session zone.
CREATE OR REPLACE FUNCTION pg_temp.ts_text(value timestamptz) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT to_char(value AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') || '+00'
$$;

-- Source value → app value. Values not listed are unmapped (reported, never written):
-- AniList CANCELLED/HIATUS, SOURCE/COMPILATION/CONTAINS; offline UNKNOWN/UNDEFINED.
-- AniList ALTERNATIVE → 'Alternative setting': the stored MAL-cased value its edges match.
DROP TABLE IF EXISTS vocab;
CREATE TEMP TABLE vocab (
  kind text NOT NULL, source text NOT NULL, source_value text NOT NULL,
  app_value text NOT NULL, PRIMARY KEY (kind, source, source_value)
);
INSERT INTO vocab
SELECT 'type', 'anilist', k, v FROM (VALUES ('TV', 'TV'), ('TV_SHORT', 'TV'),
  ('MOVIE', 'Movie'), ('SPECIAL', 'Special'), ('OVA', 'OVA'), ('ONA', 'ONA'),
  ('MUSIC', 'Music')) t (k, v)
UNION ALL SELECT 'type', 'offline', k, v FROM (VALUES ('TV', 'TV'), ('MOVIE', 'Movie'),
  ('SPECIAL', 'Special'), ('OVA', 'OVA'), ('ONA', 'ONA')) t (k, v)
UNION ALL SELECT 'status', 'anilist', k, v FROM (VALUES ('FINISHED', 'Finished Airing'),
  ('RELEASING', 'Currently Airing'), ('NOT_YET_RELEASED', 'Not yet aired')) t (k, v)
UNION ALL SELECT 'status', 'offline', k, v FROM (VALUES ('FINISHED', 'Finished Airing'),
  ('ONGOING', 'Currently Airing'), ('UPCOMING', 'Not yet aired')) t (k, v)
UNION ALL SELECT 'season', src, k, lower(k)
  FROM unnest(ARRAY['anilist', 'offline']) src,
       unnest(ARRAY['WINTER', 'SPRING', 'SUMMER', 'FALL']) k
UNION ALL SELECT 'relation', 'anilist', k, v FROM (VALUES ('SEQUEL', 'Sequel'),
  ('PREQUEL', 'Prequel'), ('PARENT', 'Parent story'), ('SIDE_STORY', 'Side story'),
  ('CHARACTER', 'Character'), ('OTHER', 'Other'), ('SPIN_OFF', 'Spin-off'),
  ('SUMMARY', 'Summary'), ('ADAPTATION', 'Adaptation'),
  ('ALTERNATIVE', 'Alternative setting')) t (k, v);
