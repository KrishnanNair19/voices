/**
 * Module augmentation for @firebase/auth.
 *
 * @firebase/auth ships a react-native build that exports getReactNativePersistence,
 * but its package.json places a catch-all "types" field before the "react-native"
 * export condition. TypeScript always matches the catch-all first, so the RN types
 * are unreachable even with customConditions: ["react-native"] in tsconfig.
 *
 * This augmentation adds the missing export so App.tsx can import it cleanly.
 * The function is fully present at runtime — Metro correctly resolves the
 * react-native bundle via Expo's moduleResolution: bundler + customConditions.
 */

import type { Persistence } from 'firebase/auth'

declare module '@firebase/auth' {
  export function getReactNativePersistence(storage: object): Persistence
}
