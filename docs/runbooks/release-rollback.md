# Runbook: release rollback

## Rule

Releases are cut automatically on merge to `master` (`deploy.yml`): every
releasable merge gets a `vX.Y.Z` tag, a GitHub Release and the image tag
`:vX.Y.Z`. Roll back by redeploying the previous image tag — never by
reverting migrations.

## Roll back a deploy

```bash
# Tags are :vX.Y.Z, :latest, :<sha> (see deploy.yml)
docker pull <user>/anidev-v2:<previous-version>
# point the runtime at <previous-version> and restart
```

## Migrations

Migrations in this repo are **additive-only** (indexes, new tables/columns,
unique indexes after a duplicate pre-check). Rolling back the image never
requires rolling back the schema: old code runs fine against additive
changes. Destructive DDL is out of scope for agents — the maintainer performs
it manually outside this repo.

## After rollback

1. Confirm `/api/health/readiness` is 200.
2. Watch the 5xx-rate alert (15 min).
3. File a follow-up: root-cause + re-release plan.
