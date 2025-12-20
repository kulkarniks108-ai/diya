// TypeScript augmentation for React Native builds.
// Firebase Auth does export getReactNativePersistence in RN, but some TS setups
// resolve the web typings which omit it.

declare module "firebase/auth" {
  import type { Persistence } from "firebase/auth";

  export function getReactNativePersistence(storage: unknown): Persistence;
}
