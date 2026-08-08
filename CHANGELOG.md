# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.2.0](https://github.com/Sebas200702/anidev-v2/compare/v0.1.3...v0.2.0) (2026-08-08)


### Features

* **api:** Add public health check endpoint with info logging ([7a81bf2](https://github.com/Sebas200702/anidev-v2/commit/7a81bf29898502613f5c54a5797f6f21385daef7))

### [0.1.3](https://github.com/Sebas200702/anidev-v2/compare/v0.1.2...v0.1.3) (2026-08-07)


### Bug Fixes

* **db:** Break circular import between auth-schema and auth-relations ([735e0fc](https://github.com/Sebas200702/anidev-v2/commit/735e0fc41671b821a3aaf9a8ee43862d782dbbbc))

### [0.1.2](https://github.com/Sebas200702/anidev-v2/compare/v0.1.1...v0.1.2) (2026-08-07)


### Bug Fixes

* **ci:** Pass ASTRO_ADAPTER=bun build-arg to Docker workflows ([6619c8b](https://github.com/Sebas200702/anidev-v2/commit/6619c8b7bde21b8c780b7860d7664c16faf04684))

### [0.1.1](https://github.com/Sebas200702/anidev-v2/compare/v0.1.0...v0.1.1) (2026-08-07)


### Bug Fixes

* **anime:** Annotate explicit return types on cached queries ([181a7cb](https://github.com/Sebas200702/anidev-v2/commit/181a7cbaf863a7b268be76275ddbe4db3ad294a4))
* **auth:** Use Zod 4 top-level z.email validator ([6d86427](https://github.com/Sebas200702/anidev-v2/commit/6d864273cf728bef3f8b567ed91b82562b712e51))
* **media:** Add typed EmptyImageError for empty buffers ([e7c3379](https://github.com/Sebas200702/anidev-v2/commit/e7c33791f8b73e0ded8e7fe1bdefed38e489a553))
* **media:** Drop non-null assertion in music media mapping ([594004d](https://github.com/Sebas200702/anidev-v2/commit/594004da80a979ad6ae38f1ed3f1f4f721d89867))
* **media:** Type the resolved media variable explicitly ([7aba7f3](https://github.com/Sebas200702/anidev-v2/commit/7aba7f3e477bbebecf96a625fcc53bf919f7230e))
* **user:** Parse favorite/watch list ids with explicit radix ([2beace5](https://github.com/Sebas200702/anidev-v2/commit/2beace5b76a9d2bb9ebb051e79831c6718e8f4da))

## 0.1.0 (2026-08-07)


### Features

* add profile schema to define user profile structure ([77055ca](https://github.com/Sebas200702/anidev-v2/commit/77055cac23c35dc5c8decbcfcac7f9aade0f580c))
* **anime:** add anime filters and response schema ([8bb2a13](https://github.com/Sebas200702/anidev-v2/commit/8bb2a132c5439500ff0407e67c72ba7b7911b681))
* **anime:** add anime list repository with filtering and counting functionality ([3400958](https://github.com/Sebas200702/anidev-v2/commit/3400958ed32e8cf0059eb5127f8854c697642eb9))
* **anime:** add getMediaByAnimeIds function to retrieve media by multiple anime IDs ([4ec52b5](https://github.com/Sebas200702/anidev-v2/commit/4ec52b526fbf8deff8ed91b7b09758e59828220a))
* **anime:** add mapper function for anime card data ([ce72add](https://github.com/Sebas200702/anidev-v2/commit/ce72addefc9ac010278d67c5fe23574fa6511fd1))
* **anime:** add mapper function for anime filters ([8d1f73b](https://github.com/Sebas200702/anidev-v2/commit/8d1f73b891bca104c963c75c1f54f4d993e53da5))
* **anime:** add mapping function for anime list to card conversion ([234e717](https://github.com/Sebas200702/anidev-v2/commit/234e71705dd32d7137401cdf3c3b01b43bcbe223))
* **anime:** define types for anime filters and list response ([6732cda](https://github.com/Sebas200702/anidev-v2/commit/6732cdac025b32a2496cf70997a8ed30a3c9277d))
* **anime:** Enhance media handling in anime mapping ([33e27da](https://github.com/Sebas200702/anidev-v2/commit/33e27dade68a4db093d84e7de4d9d37c4a815d58))
* **anime:** implement anime list caching functionality ([56175f8](https://github.com/Sebas200702/anidev-v2/commit/56175f85f42200297d47c85b43c5ae63fa185ec0))
* **anime:** implement anime list service with caching and media retrieval ([d3f8206](https://github.com/Sebas200702/anidev-v2/commit/d3f8206506779d2b82c87f9e67e99f58e04af482))
* **anime:** implement domain repositories services and schemas ([5268c6b](https://github.com/Sebas200702/anidev-v2/commit/5268c6b3d1d97b1f36224379175eea97ba4ab9a5))
* **anime:** implement GET endpoint for anime list with validation and error handling ([335bc00](https://github.com/Sebas200702/anidev-v2/commit/335bc00ebaba6b08d4834655aea8484189272213))
* **anime:** update anime card schema to include genres and fix alt text property ([21750c4](https://github.com/Sebas200702/anidev-v2/commit/21750c4fc8b7cb46a21a429564c4fc11b3bd5c31))
* **anime:** update anime mapper for new fields ([df8801f](https://github.com/Sebas200702/anidev-v2/commit/df8801f192b87b69a03a8d5fc1d03b9f42ed5651))
* **api:** add anime music auth and proxy endpoints ([fc3286b](https://github.com/Sebas200702/anidev-v2/commit/fc3286b795d66d7f15a489844103a41088eeba65))
* **auth:** Add auth domain with explicit session routes ([d590de4](https://github.com/Sebas200702/anidev-v2/commit/d590de43c761982d56e5a58b5e25c8ceaec505f2))
* **auth:** add session middleware ([0554157](https://github.com/Sebas200702/anidev-v2/commit/0554157b5a8b31860bb2578596bf2701d8e89468))
* **auth:** switch Better Auth adapter to pg provider ([20c9b17](https://github.com/Sebas200702/anidev-v2/commit/20c9b17e3e73045b924d0898552a4e27d3339d6f))
* **cache:** add AnimeList key prefix to cache configuration ([3b22567](https://github.com/Sebas200702/anidev-v2/commit/3b225670ca5338eae482d3782e2f8ce7733eb8df))
* **cache:** move to ioredis with graceful degradation ([017aa7c](https://github.com/Sebas200702/anidev-v2/commit/017aa7c943b48b62693b9661a2781746d70626ba))
* **config:** use dynamic baseUrl for configuration ([e6b90d9](https://github.com/Sebas200702/anidev-v2/commit/e6b90d954320b2d0427cf9b3189f0274ac3a2787))
* **core:** add shared auth db cache and error infrastructure ([ac0c944](https://github.com/Sebas200702/anidev-v2/commit/ac0c944e522c6cca88a31477f0351aa0f83e2c59))
* **db:** degrade repositories to mappable AppError ([3a0773c](https://github.com/Sebas200702/anidev-v2/commit/3a0773cd1bb27502d70f2daa6fa7b120474398b8))
* **db:** migrate schemas to PostgreSQL pg-core ([5f17a79](https://github.com/Sebas200702/anidev-v2/commit/5f17a79f5a902e4ef3959544040d7d66aad58e88))
* **env:** add APP_BASE_URL to environment configuration and update README ([8d8a0ed](https://github.com/Sebas200702/anidev-v2/commit/8d8a0ed837883d389b96871fdddade5730a6743f))
* **image:** add source option to OptimizeOptions and normalizeOptimizeOptions function ([580e6cf](https://github.com/Sebas200702/anidev-v2/commit/580e6cf84bb4830c83b65b6a86067cf0df77ba36))
* **infra:** add rustrak-ui dashboard service ([5c8b2c2](https://github.com/Sebas200702/anidev-v2/commit/5c8b2c285675c565e1963e621e447d38daa1db45))
* **infra:** run the app in Docker under a preview profile ([d96adac](https://github.com/Sebas200702/anidev-v2/commit/d96adac30861379e029788e318a5c9df6f0a4e79))
* **infra:** support standalone Bun adapter for Docker preview ([30d732b](https://github.com/Sebas200702/anidev-v2/commit/30d732b0fb25440e1b940f8dee8fd594d9c7bfaa))
* **media:** Cache resolved raw media src ([98dbe01](https://github.com/Sebas200702/anidev-v2/commit/98dbe01ffa576b8f5da1a72a9606d1ba58d5489d))
* **media:** introduce media domain and route ([6b568da](https://github.com/Sebas200702/anidev-v2/commit/6b568dabcfd501a1ceae1895537faf72f1968013))
* **monitoring:** store pino logs in rustrak via enableLogs ([1cb86ab](https://github.com/Sebas200702/anidev-v2/commit/1cb86ab7d78596ddd33939872b9f0fad581fd6e4))
* **monitoring:** wire Sentry SDK at runtime via Astro integration ([ab5b7b7](https://github.com/Sebas200702/anidev-v2/commit/ab5b7b7ec8bf258a549e3d8fea3b9001ae7f77e5))
* **music:** Add GET /api/music paginated list endpoint ([c39360b](https://github.com/Sebas200702/anidev-v2/commit/c39360bb1b0d71cb79fbcf64ce1212ef6802c39f))
* **music:** Add list repository and batch artist lookup ([cd084b8](https://github.com/Sebas200702/anidev-v2/commit/cd084b8a068b2dcdffdfe56d8928f7d99ffd78bc))
* **music:** Add list schemas, mappers, and cache layer ([77e1bd2](https://github.com/Sebas200702/anidev-v2/commit/77e1bd26ccaa0610eb9f800f2c0e84e90af2a010))
* **music:** implement domain repositories services and schemas ([150bbfb](https://github.com/Sebas200702/anidev-v2/commit/150bbfbb0324c8064c7373855a45333e39fd406d))
* **music:** update music API schema ([de9c712](https://github.com/Sebas200702/anidev-v2/commit/de9c7122ebbbe9157ad150db6aa7c05a440c0cd9))
* **skills:** Add UI/UX Pro Max skill and update barrel best practices ([4db6e10](https://github.com/Sebas200702/anidev-v2/commit/4db6e10c8c1b54d1f98d4b6bda5bb497eaaa16fd))
* **tooling:** Harden agent lifecycle with Vitest/TDD, CI gate, and SemVer releases ([b6ad9ae](https://github.com/Sebas200702/anidev-v2/commit/b6ad9aecf6e0a47713d4e7715adc42fecfe90be0))
* **ui:** add app layout media components and anime pages ([01c30e7](https://github.com/Sebas200702/anidev-v2/commit/01c30e7a2920a56d268814e687c1ef15e051380a))
* **user:** add user domain and API endpoints ([f80ec08](https://github.com/Sebas200702/anidev-v2/commit/f80ec08bfed8c71d00daccebe6ed16150271e3ba))


### Bug Fixes

* **anime-list:** normalize query string to lowercase for consistent filtering, fixes _⚠️ Potential issue_ | _🟡 Minor_ ([6deaa6b](https://github.com/Sebas200702/anidev-v2/commit/6deaa6bae21bbd705f5102c004e7040f97564563)), closes [#14](https://github.com/Sebas200702/anidev-v2/issues/14)
* **anime/mappers:** include optional query in mapAnimeFilters output, fixes [#3](https://github.com/Sebas200702/anidev-v2/issues/3) ([c28d653](https://github.com/Sebas200702/anidev-v2/commit/c28d653b9c9591de377296287f91b531c752c3a1))
* **anime/repositories:** preserve genreless anime using leftJoin , fixes [#4](https://github.com/Sebas200702/anidev-v2/issues/4) ([5d7e0f6](https://github.com/Sebas200702/anidev-v2/commit/5d7e0f6423415a59319e0e5d9816b4d73c50be47))
* **anime/repositories:** use selectDistinc to retain anime without genres, fixes [#5](https://github.com/Sebas200702/anidev-v2/issues/5) ([b453ae0](https://github.com/Sebas200702/anidev-v2/commit/b453ae0a1afca0d914156ac00d293efd2dcfa370))
* **anime/schemas:** enforce integer constraints on pagination and year fields in animeFiltersParamsSchema, fixes [#11](https://github.com/Sebas200702/anidev-v2/issues/11) ([2f8c340](https://github.com/Sebas200702/anidev-v2/commit/2f8c340b42eed8e3d191778fbefa20d685b6231e))
* **anime/schemas:** update animeFiltersParamsSchema to use z.coerce for number fields ([f536a8a](https://github.com/Sebas200702/anidev-v2/commit/f536a8ac160d264cdf7c5653aff2c8543171d3b8))
* **api:** handle zod validation errors in middleware, fixes [#6](https://github.com/Sebas200702/anidev-v2/issues/6) ([96179ee](https://github.com/Sebas200702/anidev-v2/commit/96179eeef3611c78622dbb4e21ee01f34d01d2d5))
* **api:** refactor anime list filter logic to use buildAnimeListFilters for cleaner query handling ([40c3e1e](https://github.com/Sebas200702/anidev-v2/commit/40c3e1e27e411aeacdc95cc40335c3678ec3de17))
* **api:** update GET handler to use animeListRequestSchema and correct query parameter access ([cac08b3](https://github.com/Sebas200702/anidev-v2/commit/cac08b315f8a23d1c9d4cb8c918ba2cb86fde1f2))
* **cache:** connect at bootstrap and handle client errors ([035d7ba](https://github.com/Sebas200702/anidev-v2/commit/035d7ba48cbbcc206e48101ac6a76ecc4455943d))
* **cache:** handle initial connect rejection gracefully ([52b2228](https://github.com/Sebas200702/anidev-v2/commit/52b2228cb75123943036f289fdfaaaaa35de9cba))
* **character-media:** add missing await for database query in getMediaByCharacterIds, fixes _⚠️ Potential issue_ | _🔴 Critical_ ([03f0d43](https://github.com/Sebas200702/anidev-v2/commit/03f0d437a7f30c75014060779de57d7a13755c00)), closes [#16](https://github.com/Sebas200702/anidev-v2/issues/16)
* **config:** read env vars from process.env at runtime ([e8a3537](https://github.com/Sebas200702/anidev-v2/commit/e8a3537add4983edbf16f2d0b24a89528b2eded6))
* **config:** Update APP_BASE_URL to be required and adjust baseUrl logic ([d1446d9](https://github.com/Sebas200702/anidev-v2/commit/d1446d92926ce1027b680b8764fc3a74614a59ed))
* **core/errors:** update error codes and handler behavior ([f420d4f](https://github.com/Sebas200702/anidev-v2/commit/f420d4ffc33e5093981445370860c9dd67c6afaf))
* **core:** adjust cache configuration ([1687036](https://github.com/Sebas200702/anidev-v2/commit/16870366ae0b892a1925dc7d2aa863753d917bae))
* **db:** handle idle-client pool errors without crashing ([00b99fb](https://github.com/Sebas200702/anidev-v2/commit/00b99fb4f0e85a825b09ba41a3a7aa57e0795779))
* **db:** make music version_id globally unique for Postgres FK ([3e8da18](https://github.com/Sebas200702/anidev-v2/commit/3e8da18ea272dfe411002eadffbb6c27526c0f1b))
* **db:** mark integer primary keys non-null ([5061ef9](https://github.com/Sebas200702/anidev-v2/commit/5061ef9548c0a36f1a608c9d95c410f28e45c730))
* **deploy:** externalize compose credentials and secret defaults ([1f1d85f](https://github.com/Sebas200702/anidev-v2/commit/1f1d85f63effeaf2fb83800ae8e8962dbe2f38f2))
* **media-cache:** add missing colon in source token of buildKey cache keys, fixes [#15](https://github.com/Sebas200702/anidev-v2/issues/15) ([157c238](https://github.com/Sebas200702/anidev-v2/commit/157c238f20fb03287c4db300bb56032b55a41546))
* **media-cache:** correct formatting in buildKey function for URL generation, fixes _⚠️ Potential issue_ | _🟠 Major_ ([e7c9c67](https://github.com/Sebas200702/anidev-v2/commit/e7c9c679ccd53624eece9ee865c1b5553df5e5a0)), closes [#15](https://github.com/Sebas200702/anidev-v2/issues/15)
* **media-fetch:** improve error handling and response validation,  fixes [#17](https://github.com/Sebas200702/anidev-v2/issues/17) ([2128f5b](https://github.com/Sebas200702/anidev-v2/commit/2128f5b185d01856cf73cd09d2951850360ec892))
* **media:** Update caching logic to handle placeholder images correctly ([081e020](https://github.com/Sebas200702/anidev-v2/commit/081e02083006560d1d48e9ffcc8a11b7a5955cb4))
* **music:** wrap version/resolution queries in dbError ([267713e](https://github.com/Sebas200702/anidev-v2/commit/267713e1156f3d913c025ae875c69c5e2f90068e))
* resolve 500 error on /api/anime/:id/characters ([83e2f07](https://github.com/Sebas200702/anidev-v2/commit/83e2f077c23fc06210d41123b04e10efb0b5178c))

## [0.0.1] - 2026-03-12

### Added

- Initial project scaffold from Astro.
