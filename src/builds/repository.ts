import type { Build } from '../catalog';

/** Id of the built-in build (the author's PC). It ships in `default.build.json`, is never stored and can not be changed or deleted. */
export const DEFAULT_ID = 'default';

/**
 * Where builds live. The app only talks to this interface, so the storage can change (localStorage today,
 * a server later) without touching the store or the UI. Synchronous because localStorage is; an async backend
 * would wrap it and load once at startup.
 */
export interface BuildRepository {
  /** The default build first, then the user's builds in the order they were first saved. */
  list(): Build[];
  get(id: string): Build | undefined;
  /** Creates or replaces a user build. Throws for the default build's id. */
  save(build: Build): void;
  /** Throws for the default build. If it was active, the default becomes active. */
  remove(id: string): void;
  /** The active build id; falls back to the default if the stored one no longer exists. */
  getActiveId(): string;
  setActiveId(id: string): void;
  /** Deletes every user build and activates the default again. Onboarding state is kept. */
  reset(): void;
  hasOnboarded(): boolean;
  markOnboarded(): void;
}
