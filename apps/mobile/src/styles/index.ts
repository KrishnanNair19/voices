/**
 * @voices/mobile — styles barrel export
 *
 * Import everything from '@/styles' in component and screen files:
 *
 *   import { colors, typeScale, spacing, shadows, radius, useAppTheme } from '@/styles'
 *
 * Dependency graph (acyclic):
 *   layout.ts
 *     ↑
 *   typography.ts  colors.ts  shadows.ts
 *     ↑              ↑          ↑
 *                  theme.ts
 *                     ↑
 *                   index.ts
 */

export * from './colors'
export * from './typography'
export * from './layout'
export * from './shadows'
export { appTheme, useAppTheme } from './theme'
export type { AppTheme } from './theme'
