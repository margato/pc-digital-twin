import type { Build } from '../catalog';
import { DEFAULT_BUILD } from './defaultBuild';
import { DEFAULT_ID, type BuildRepository } from './repository';
import { validateBuild } from './validate';

/** The slice of the Web Storage API the repository needs. `localStorage` fits; tests pass a plain Map-backed fake. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEYS = { builds: 'pcdt.builds.v1', active: 'pcdt.active.v1', onboarded: 'pcdt.onboarded.v1' } as const;

/**
 * User builds as a JSON array under one key. Reads validate every build against the catalog and drop the broken ones
 * (a part removed from the catalog, hand-edited JSON) instead of crashing. Storage errors (private window, quota) are
 * swallowed: the app keeps working for the session with whatever is held in memory.
 */
export class StorageBuildRepository implements BuildRepository {
  private cache: Build[];
  private active: string;
  private onboarded: boolean;

  constructor(private store: KeyValueStore) {
    this.cache = this.readBuilds();
    this.active = this.read(STORAGE_KEYS.active) ?? DEFAULT_ID;
    this.onboarded = this.read(STORAGE_KEYS.onboarded) === '1';
  }

  list(): Build[] {
    return [DEFAULT_BUILD, ...this.cache];
  }

  get(id: string): Build | undefined {
    return this.list().find((b) => b.id === id);
  }

  save(build: Build): void {
    if (build.id === DEFAULT_ID) throw new Error('The default build can not be overwritten. Save it under a new id.');
    const check = validateBuild(build);
    if (!check.ok) throw new Error('Invalid build: ' + check.errors.join(' '));
    const i = this.cache.findIndex((b) => b.id === build.id);
    this.cache = i === -1 ? [...this.cache, build] : this.cache.map((b, k) => (k === i ? build : b));
    this.writeBuilds();
  }

  remove(id: string): void {
    if (id === DEFAULT_ID) throw new Error('The default build can not be deleted.');
    this.cache = this.cache.filter((b) => b.id !== id);
    this.writeBuilds();
    if (this.active === id) this.setActiveId(DEFAULT_ID);
  }

  getActiveId(): string {
    return this.get(this.active) ? this.active : DEFAULT_ID;
  }

  setActiveId(id: string): void {
    if (!this.get(id)) throw new Error('Unknown build: ' + id);
    this.active = id;
    this.write(STORAGE_KEYS.active, id);
  }

  reset(): void {
    this.cache = [];
    this.active = DEFAULT_ID;
    this.remove_(STORAGE_KEYS.builds);
    this.remove_(STORAGE_KEYS.active);
  }

  hasOnboarded(): boolean {
    return this.onboarded;
  }

  markOnboarded(): void {
    this.onboarded = true;
    this.write(STORAGE_KEYS.onboarded, '1');
  }

  private readBuilds(): Build[] {
    const text = this.read(STORAGE_KEYS.builds);
    if (!text) return [];
    try {
      const data: unknown = JSON.parse(text);
      if (!Array.isArray(data)) return [];
      const seen = new Set<string>([DEFAULT_ID]);
      const out: Build[] = [];
      for (const item of data) {
        const v = validateBuild(item);
        if (v.ok && !seen.has(v.build.id)) {
          seen.add(v.build.id);
          out.push(v.build);
        }
      }
      return out;
    } catch {
      return [];
    }
  }

  private writeBuilds(): void {
    this.write(STORAGE_KEYS.builds, JSON.stringify(this.cache));
  }

  private read(key: string): string | null {
    try {
      return this.store.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      this.store.setItem(key, value);
    } catch {
      /* storage unavailable or full: keep the in-memory copy */
    }
  }

  private remove_(key: string): void {
    try {
      this.store.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  }
}

/** In-memory store: used when localStorage is missing or throws, and by tests. */
export class MemoryStore implements KeyValueStore {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}
