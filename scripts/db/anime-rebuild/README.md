# Anime rebuild: relations + field fill + source majority

Adds the missing AniList relation edges, fills empty anime fields and corrects stored values
that both AniList and the anime-offline-database contradict. Plan and design:
`odd/tasks/catalog-rebuild.md` (T4, S2 + S6, Log L2).

**Local database only.** `run.sh` refuses any host other than `localhost`, `127.0.0.1` or
`[::1]`; production is applied manually by the maintainer.

## Commands

```bash
bash scripts/db/anime-rebuild/run.sh test      # fixtures in a throwaway schema
bash scripts/db/anime-rebuild/run.sh audit     # dry run: counts + 5 examples, writes nothing
bash scripts/db/anime-rebuild/run.sh apply     # ONE transaction, refused while applied
bash scripts/db/anime-rebuild/run.sh rollback  # ONE transaction, exact undo
```

Logs live in the `anime_rebuild` schema (`applied`, `field_updates`, `inserted_relations`).
The database URL comes from `LOCAL_DATABASE_URL`, then `DATABASE_URL`, then `POSTGRES_*`.

## Sources

The raw tables staged by `scripts/db/cast-relink/run.sh stage`:

| Table | Content |
|---|---|
| `cast_relink.anilist_raw` | Kaggle AniList CSV, columns by position (`c02` id, `c03` idMal, `c09` format, `c10` status, `c11` description, `c12`-`c14` start date, `c18` season, `c19` seasonYear, `c21` episodes, `c53` relations) |
| `cast_relink.offline_db_raw` | anime-offline-database JSONL (first line is a header) |

A source value counts for a MAL id only when every entry with that MAL id agrees (several
AniList entries can share one `idMal`). Offline-db `episodes: 0` means unknown.

## Vocabulary

Source values are mapped to the values the app stores and reads (`ANIME_STATUSES` in
`src/domains/anime/constants.ts`, the stored `anime.type` / `anime.season` /
`anime_relation.relation_type` values). Unlisted values are reported and skipped.

| Field | AniList → app | offline-db → app |
|---|---|---|
| type | TV, TV_SHORT → `TV`; MOVIE → `Movie`; SPECIAL → `Special`; OVA; ONA; MUSIC → `Music` | TV; MOVIE; SPECIAL; OVA; ONA (UNKNOWN skipped) |
| status | FINISHED → `Finished Airing`; RELEASING → `Currently Airing`; NOT_YET_RELEASED → `Not yet aired` (CANCELLED, HIATUS skipped) | FINISHED; ONGOING; UPCOMING (UNKNOWN skipped) |
| season | WINTER/SPRING/SUMMER/FALL → lowercase | same (UNDEFINED skipped) |
| relation | SEQUEL → `Sequel`, PREQUEL → `Prequel`, PARENT → `Parent story`, SIDE_STORY → `Side story`, CHARACTER → `Character`, OTHER → `Other`, SPIN_OFF → `Spin-off`, SUMMARY → `Summary`, ADAPTATION → `Adaptation`, ALTERNATIVE → `Alternative setting` | untyped: report only |

The relation values are the MAL-cased ones; AniList ALTERNATIVE edges match stored
`Alternative setting` rows, so that is its value.

## Actions

1. **Relations** — an AniList edge between two anime is inserted when both anime exist,
   it is not a self edge and the exact `(anime, related, type)` row is missing. AniList
   ids reach MAL through AniList's `idMal`, then the offline-db sources. Edges to manga,
   unmapped types and unknown anime are skipped. Existing relations are never deleted.
   Offline-db `relatedAnime` has no type: pairs with no stored or planned relation are
   reported only.
2. **Fill** — an empty (`NULL`, or blank synopsis) `synopsis`, `episodes`, `year`,
   `season`, `type` or `aired_from` takes the AniList value, else the offline-db one.
   Synopsis: AniList description with HTML stripped to the stored format (plain text,
   paragraphs split by one blank line, entities decoded; `N/A` counts as none). `year` is
   AniList `seasonYear`, else the start year. `aired_from` needs a full AniList start date
   (00:00 UTC). Offline-db episodes fill only from a finished entry.
3. **Majority** — for `episodes`, `year`, `season`, `type`, `status`: when AniList and the
   offline-db hold the same value and it differs from the stored one, it is replaced.
   Excluded (reported): `episodes`/`status` of anime stored as airing or not yet aired,
   `episodes` when either source is not finished, and a stored `Music` type (the offline-db
   has no MUSIC type, so it cannot outvote it).

## rollback and guards

Every change is logged with its previous value. `rollback` restores the logged values,
deletes the inserted relations and empties the logs; if a changed value differs from what
the apply wrote, it aborts and changes nothing. `apply` is refused while an apply is in
place, and only writes a value still equal to the one the plan read.
