import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  // Externalized so consumers (apps/mobile, apps/web) supply their own copies.
  // This prevents double-bundling and keeps native modules out of the core dist.
  external: ['firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'zustand', '@tanstack/react-query', 'react'],
})
