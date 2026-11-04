# 01-media-engine

Tatakai's Core Media Engine is a central system that manages media ingestion, source resolution, playback, and extension integration. It is structured around several key components, including the playback pipeline, video player components, extension ecosystem, and metadata mapping. 

## Playback Pipeline

The playback pipeline in Tatakai is responsible for resolving and selecting streaming sources, handling failover, managing HLS playback, and buffering.

### Source Resolution and Selection

Source resolution begins with `useCombinedSources` which aggregates streaming sources from various providers, including extensions.  The `mapRawSourcesToStreamingData` function processes these raw sources into a `StreamingData` object, enriching them with details like provider name, quality, language, and specific metadata for torrents or debrid services.  The `selectPreferredSource` function then selects the best available source based on user settings, such as default quality. 

For remote sources, the `resolveRemoteSources` function in `src/core/extensions/remote/resolve.ts` fetches sources and subtitles from enabled extensions.  It uses `fetchAniZipMapping` for AniList ID mapping and `searchStremioTargets` for Stremio extensions to find relevant streams.   These sources are then normalized and proxied via `proxyRemoteSources`. 

### Failover Between Providers

Tatakai implements a failover mechanism to ensure continuous playback. When a playback error occurs, the system attempts to recover. In `MobileVideoPlayer.tsx`, if a media error occurs, `recoverMediaError` is called, and if it persists, the system tries to swap audio codecs.   For network errors, `mountAt` is called to reload the manifest, and if retries for the current URL are exhausted, it attempts to switch to the next candidate source in the `candidates` array. 

The `HlsAdapter` also handles network and media errors with retry logic. For network errors, it retries loading the manifest up to `MAX_NETWORK_RETRIES` times.  If these retries fail, it attempts to advance to the next candidate source.  Media errors are handled by calling `recoverMediaError` and potentially swapping audio codecs. 

### HLS Handling, Buffering, and Abort

HLS (HTTP Live Streaming) is a primary streaming format in Tatakai.  The `MobileVideoPlayer` uses `hls.js` for HLS playback, configuring buffer lengths based on data saver settings and memory profiles.  It also sets various timeouts and retry limits for manifest, level, and fragment loading to optimize for mobile networks. 

Buffering is managed by tracking `waiting` and `playing` events from the video element.  The `handleProgress` event listener updates the `buffered` state.  Playback can be aborted using `AbortController` instances, particularly during debrid resolution or when switching sources.  

## Video Player Components

Tatakai provides two main video player components: `VideoPlayer` for desktop and `MobileVideoPlayer` for mobile. <cite repo="Snozxyx/Tatakai" path="wiki_page" start="3.2" end="3.2" /> Both components utilize `usePlaybackCoordinator` for playback configuration and `selectPreferredSource` for quality selection. <cite repo="Snozxyx/Tatakai" path="wiki_page" start="3.2" end="3.2" />

### `VideoPlayer` (Desktop)

The desktop `VideoPlayer` uses standard HTML5 video elements and `hls.js`. <cite repo="Snozxyx/Tatakai" path="wiki_page" start="3.2" end="3.2" /> It integrates with various hooks like `useVideoSettings`, `useKeybinds`, and `useAniskip` for features such as quality profiles, keyboard shortcuts, and skip segments. <cite repo="Snozxyx/Tatakai" path="wiki_page" start="3.2" end="3.2" />

### `MobileVideoPlayer` (Mobile)

The `MobileVideoPlayer` integrates Capacitor device controls for screen orientation and status bar management, and uses native HLS loaders. <cite repo="Snozxyx/Tatakai" path="wiki_page" start="3.2" end="3.2" /> It also includes specific mobile-tuned features like `useMobileCloudProxy` for fallback options when direct streaming fails. <cite repo="Snozxyx/Tatakai" path="wiki_page" start="3.2" end="3.2" />

### Shared UI and Controls

Both players share modular UI controls for transport, audio/subtitle tracks, and playback rates. These include `PlaybackControls`, `Seekbar`, `VolumeControl`, `TimeDisplay`, `SubtitleSelector`, `AudioTrackSelector`, `SpeedSelector`, `FullscreenButton`, `PiPButton`, `ExternalPlayerButton`, and `DownloadButton`. <cite repo="Snozxyx/Tatakai" path="wiki_page" start="3.2" end="3.2" />

The `VideoSettingsPanel` provides a comprehensive interface for customizing playback, subtitle preferences, and keybindings. <cite repo="Snozxyx/Tatakai" path="wiki_page" start="3.2" end="3.2" />

## Extension Ecosystem / Content-Client Abstraction

Tatakai's extension ecosystem allows for dynamic content ingestion and playback. Extensions can provide streaming sources, preview sources, and integrate with various content types like anime, manga, and novels. 

The `ExtensionRegistry` manages the loading and activation of extensions.  Extensions with the `sources` capability are fanned out to resolve streaming sources.  The `resolveRemoteSources` function is key here, fetching sources and subtitles from enabled remote extensions. 

The `SourceResult` interface defines the canonical shape for sources returned by extensions, including `url`, `quality`, `headers`, `subtitles`, and `sourceType`.  These sources are then processed by the host, which applies proxying and type detection.  

Content clients like `anime-client.ts` and `manga-client.ts` provide specialized operations for different media types, abstracting the data retrieval from the UI.  The `content-graph.ts` acts as a unified interface for browsing and searching, handling fallback logic and normalization. 

## Metadata Mapping

Metadata mapping unifies content streams across different verticals (anime, manga, novel) by integrating external catalogs like AniList and MyAnimeList. <cite repo="Snozxyx/Tatakai" path="wiki_page" start="3.5" end="3.5" /> The `content-graph.ts` module is central to this, ensuring that all data is transformed into standard "Media" shapes before being consumed by components.  It also handles the unwrapping of `MediaEnvelope` objects into `TatakaiMedia` objects, which include `tatakaiId` and `mapping` information. 

The `resolveRemoteSources` function uses `fetchAniZipMapping` to get AniList ID mappings, which helps in resolving titles and other metadata for Stremio extensions.  This ensures that extensions can correctly identify and provide sources for the requested content. 

## Notes

The provided context primarily focuses on the client-side playback and source resolution within the `Snozxyx/Tatakai` repository. While the prompt mentions "content-client abstraction" and "metadata mapping," the details provided are more about how these are consumed by the player and how extensions contribute to source resolution rather than the internal workings of the content clients themselves. The `docs/features/playback.md` file provides a high-level overview of the video player and streaming architecture. 

Wiki pages you might want to explore:
- [Core Media Engine (Snozxyx/Tatakai)](/wiki/Snozxyx/Tatakai#3)
- [Video Player Components (Snozxyx/Tatakai)](/wiki/Snozxyx/Tatakai#3.2)

View this search on DeepWiki: https://deepwiki.com/search/describe-in-technical-detail-t_be548a62-5e20-4ced-a296-09db598d4647

