/**
 * Showcase entries for the components the app shell renders.
 *
 * @module shared/components/showcase/entries-shell
 */
import Footer from '../footer/footer.astro'
import Header from '../header/header.astro'
import type { ShowcaseEntry } from './types'

/**
 * Masthead, footer and toolbar.
 *
 * @remarks
 * All flagged `renderedByShell`: the page already renders them, and a second
 * instance would duplicate a document landmark.
 */
export const shellShowcaseEntries: readonly ShowcaseEntry[] = [
  {
    slug: 'header',
    title: 'Header',
    owner: 'shared',
    summary: 'Editorial masthead — the live instance is this page’s own.',
    component: Header,
    fixture: {},
    controls: [],
    renderedByShell: true,
  },
  {
    slug: 'footer',
    title: 'Footer',
    owner: 'shared',
    summary: 'Brand line, section links and socials — also part of the shell.',
    component: Footer,
    fixture: {},
    controls: [],
    renderedByShell: true,
  },
  {
    slug: 'toolbar',
    title: 'Toolbar',
    owner: 'shared',
    summary:
      'The shell’s only hydrated island; already live in the corner of this page.',
    fixture: {},
    controls: [],
    renderedByShell: true,
  },
]
