import { describe, expect, it } from 'vitest'
import {
  buildSitemapIndexXml,
  buildUrlSetXml,
} from '@seo/utils/sitemap-xml'

const BASE = 'https://anidev.example'

describe('buildUrlSetXml', () => {
  it('renders absolute, escaped <loc> entries', () => {
    const xml = buildUrlSetXml(BASE, [
      { path: '/' },
      { path: '/search?genre=Boys Love&page=1' },
    ])
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    )
    expect(xml).toContain('<url><loc>https://anidev.example/</loc></url>')
    expect(xml).toContain(
      '<loc>https://anidev.example/search?genre=Boys%20Love&amp;page=1</loc>'
    )
  })

  it('renders an empty set', () => {
    expect(buildUrlSetXml(BASE, [])).toContain('<urlset')
  })
})

describe('buildSitemapIndexXml', () => {
  it('lists every sitemap file', () => {
    const xml = buildSitemapIndexXml(BASE, ['static-1', 'anime-2'])
    expect(xml).toContain(
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    )
    expect(xml).toContain(
      '<sitemap><loc>https://anidev.example/sitemaps/anime-2.xml</loc></sitemap>'
    )
  })
})
