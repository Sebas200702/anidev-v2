# Cast relink

Re-resolves the UPPERCASE-role `anime_character` links (AniList import) whose MAL id was
assigned by a global name lookup. Plan and evidence: `odd/tasks/cast-relink.md`.

**Local database only.** `run.sh` refuses any host other than `localhost`,
`127.0.0.1` or `[::1]`; production is applied manually by the maintainer.

## Sources (downloaded outside the repo, treated as untrusted data)

| Source | File |
|---|---|
| AniList Kaggle dataset (`calebmwelsh/anilist-anime-dataset`) | `anilist_anime_data_complete.csv` |
| anime-offline-database (`justsahil/anime-dataset`) | `anime-offline-database.jsonl` |

The CSV holds only the first AniList page of each cast (25 characters), so a character
missing from a 25-character cast is not proof that the link is wrong.

## Commands

```bash
bash scripts/db/cast-relink/run.sh test     # fixtures in a throwaway cast_relink_test schema
bash scripts/db/cast-relink/run.sh stage --anilist-csv PATH --offline-db PATH
bash scripts/db/cast-relink/run.sh audit    # dry run: rebuilds cast_relink.audit + summary
```

`stage` writes only to the `cast_relink` schema: `anilist_cast` (cast per MAL anime id),
`anilist_cast_source` (cast size and source) and `anime_anilist_map` (MAL → AniList).

`audit` (dry run) reads `public.anime_character` / `public."character"` and rebuilds only
`cast_relink.audit`: one row per distinct UPPERCASE-role pair with `roles`, `decision`,
`reason`, `anilist_character_id`, `target_character_id` and `creates_character`, then prints
counts by decision/reason and the rows of anime 57810.

| Decision | Reason | Meaning |
|---|---|---|
| `dedupe` | `jikan-same-pair` | the Jikan cast (Title-case role) already holds the pair |
| `keep` | `synthetic-in-anilist-cast` | synthetic id whose AniList character is in that anime's cast |
| `repoint` | `synthetic-to-jikan` | synthetic id → same-name Jikan-cast character of the anime |
| `repoint` | `real-to-jikan` | unconfirmed MAL id → same-name Jikan-cast character |
| `repoint` | `real-to-synthetic` | unconfirmed MAL id → `1e9 + AniList id` (`creates_character` when missing) |
| `quarantine` | `ambiguous` | more than one AniList or Jikan candidate |
| `quarantine` | `no-anilist-match` | complete cast (< 25) without the character |
| `pending-api` | `cast-truncated` / `cast-empty` / `cast-missing` | cast cut at 25, empty in the CSV, or anime absent from the CSV (T3) |

The database URL comes from `LOCAL_DATABASE_URL`, then `DATABASE_URL`, then `POSTGRES_*`.
