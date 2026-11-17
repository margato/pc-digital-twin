import type { BuildRepository } from './repository';
import { MemoryStore, StorageBuildRepository, type KeyValueStore } from './storageRepository';

export * from './repository';
export * from './resolve';
export * from './swap';
export * from './validate';
export { DEFAULT_BUILD } from './defaultBuild';
export { MemoryStore, StorageBuildRepository, STORAGE_KEYS, type KeyValueStore } from './storageRepository';

function browserStore(): KeyValueStore {
  try {
    // Touching localStorage can throw (blocked site data, sandboxed frames), so probe it before trusting it.
    const probe = '__pcdt_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return new MemoryStore();
  }
}

/** The app's repository. Tests build their own with `new StorageBuildRepository(new MemoryStore())`. */
export const buildRepository: BuildRepository = new StorageBuildRepository(browserStore());
