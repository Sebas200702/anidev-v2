# Cast relink — fix wrong `anime_character` links

Re-resolve the UPPERCASE-role cast links (AniList import) whose MAL id was assigned by
global name lookup, without losing correct links. Local DB only; production is applied
by the maintainer. Phase 1 of a wider DB recomposition (phase 2: rest of the catalog).

## Specs

- **S1** — "ajustar las relaciones sin perder las que estan correctas". A link confirmed
  by the Jikan cast already in the DB (Title-case role) is kept; an UPPERCASE duplicate
  of it is removed (dedupe).
- **S2** — Example to fix: `http://localhost:4321/api/search?type=characters&q=shoushimin`
  — "estas imagenes no corresponden con sus personajes": `/media/character/34972/poster/small`
  `/media/character/105389/poster/small` `/media/character/106681/poster/small`
  `/media/character/153569/poster/small` `/media/character/164968/poster/small`
  `/media/character/219623/poster/small`. After the fix none of these characters is
  linked to Shoushimin Series (57810) unless MAL/AniList confirms it.
- **S3** — "jikan esta muerto": no live Jikan calls. Sources: the Jikan cast already in
  the DB, the AniList Kaggle CSV (`calebmwelsh/anilist-anime-dataset`), the
  anime-offline-database (`justsahil/anime-dataset`) for MAL→AniList anime ids, and the
  AniList GraphQL API only for animes missing from the CSV or with a cast truncated at 25.
- **S4** — Agreed rules (L6): synthetic ids are `1000000000 + AniList character id`; a
  synthetic link whose AniList id is in that anime's AniList cast is kept. An UPPERCASE
  link with a real MAL id not confirmed by Jikan is never trusted: it is re-pointed to
  the Jikan-cast character of the same anime with the same normalized name (setting its
  `anilist_id`), else to the synthetic AniList character (created with `name.native` and
  its AniList image when missing). Links with no support in any source go to quarantine.
  Name matching is only ever scoped to the cast of the same anime.
- **S5** — Dry run first: an audit table (pair, bucket, decision, reason) is produced and
  shown to the user before any write. Writes run in one transaction, removed rows are
  copied to a quarantine table, and a rollback script restores them.

## Tasks

- **T1** (S3,S4) — Load sources into staging (`cast_relink` schema): AniList CSV cast, offline-db mapping; SQL name normalizer. Route: inline. Commit: —
- **T2** (S1,S2,S4,S5) — Classify into `cast_relink.audit` (dry run) + summary report; user checkpoint. Route: inline. Commit: —
- **T3** (S3) — AniList API fallback for missing/truncated casts → same staging. Route: inline. Commit: —
- **T4** (S1,S4,S5) — Apply transaction + quarantine + rollback script. Route: inline. Commit: —
- **T5** (S2,S5) — Verify (Shoushimin, Narrator, no Main/MAIN pairs), docs, independent verify (Risk item 1). Route: inline + gentle-ai-verify. Commit: —

## Log

- **L1** — User: "Vamos a hacer una auditoria de la media y los datos que corresponda con cada uno de los elementos probe con este anime  http://localhost:4321/api/search?type=characters&q=shoushimin y estas imagenes no corresponden con sus personajes y asi como estos seguro hay mas http://localhost:4321/media/character/34972/poster/small http://localhost:4321/media/character/105389/poster/small /media/character/106681/poster/small /media/character/153569/poster/small /media/character/164968/poster/small /media/character/219623/poster/small"
- **L2** — Finding: images match their MAL character; the links are wrong. 220,525 UPPERCASE-role links, 115,833 without a Jikan counterpart; 13,517 animes affected. Writer lives in `anime-scraper-v2` (not this repo).
- **L3** — User: "vamos a identificar una estrategia par poder ajustar las relaciones sin perder las que estan correctas"
- **L4** — User: "jikan esta muerto"
- **L5** — Sample validation (140 links vs MAL character pages / AniList API): bucket 1 20/20 correct; 2a 3/20; 2b-real 1/20; 2b-syn 18/20; 3a 0/20; 3b 19/20; 3c 0/20. AniList CSV covers 12,764/13,517 affected animes (1,939 casts truncated at 25); synthetic id = 1e9 + AniList id confirmed 33/33. Name match inside the AniList cast does not validate the MAL id (42/42 wrong).
- **L6** — User approved the strategy ("si"). offline-db maps 638 of 753 missing animes to AniList ids (none present in the CSV → API fallback).
- **L7** — User: "vamos primero con los personages y luego con la recomposicion del resto de la db"
