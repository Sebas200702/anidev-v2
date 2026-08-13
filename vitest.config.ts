import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

const alias = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': alias('./src'),
      '@styles': alias('./src/styles'),
      '@anime': alias('./src/domains/anime'),
      '@auth': alias('./src/domains/auth'),
      '@media': alias('./src/domains/media'),
      '@music': alias('./src/domains/music'),
      '@user': alias('./src/domains/user'),
      '@search': alias('./src/domains/search'),
      '@shared': alias('./src/shared'),
      '@lib': alias('./src/lib'),
      '@config': alias('./src/config'),
      '@middleware': alias('./src/middleware'),
      '@layouts': alias('./src/shared/layouts'),
      '@http': alias('./src/shared/http'),
      '@components': alias('./src/shared/components'),
      '@hooks': alias('./src/shared/hooks'),
      '@stores': alias('./src/shared/stores'),
      '@utils': alias('./src/shared/utils'),
      '@db': alias('./src/lib/db'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/**/*.d.ts', 'src/**/*.astro'],
    },
  },
})
