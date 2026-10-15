/**
 * Public exports for the toolbar component.
 *
 * @module shared/components/toolbar
 * @remarks
 * Zero-JS presentational component; behavior lives in the vanilla
 * `./script` controller bundled via the inline `<script>` tag.
 *
 * @see {@link Toolbar}
 * @see {@link initToolbar}
 */

export { default as Toolbar } from './toolbar.astro'
export { initToolbar } from './script'
export type { ToolbarControls } from './script'
