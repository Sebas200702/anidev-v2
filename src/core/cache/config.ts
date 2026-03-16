export enum CacheKeyPrefix {
  AnimeFull = 'anime:full',
  AnimeStaff = 'anime:staff',
  AnimeDetails = 'anime:details',
  AnimeCharacters = 'anime:characters',
  MusicDetails = 'music:details',
}

export enum CacheTtl {
  VeryShort = 300,
  Short = 1800,
  Medium = 3600,
  Long = 86400,
  VeryLong = 604800,
}
