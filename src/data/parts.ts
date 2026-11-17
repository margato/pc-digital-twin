export type PartId = 'gpu' | 'cpu' | 'cooler' | 'ram' | 'board' | 'ssd' | 'psu' | 'case';

/** One physical component (a type can have several: e.g. four RAM sticks or three SSDs). */
export interface PartItem {
  /** Id of the spec sheet in the catalog; gives the photo and attribution. */
  spec?: string;
  name: string;
  detail: string;
  /** Label/value facts shown as a grid instead of the detail tags, when a part has enough numbers to deserve one. */
  specs?: { k: string; v: string }[];
  /** Real-world dimensions, when they are worth showing. */
  dims?: string;
  /** Capacity in GB, for types whose items add up (memory, storage). */
  gb?: number;
}

export interface PartRow {
  part: PartId;
  /** Short label used in the dock. */
  k: string;
  /** Component type name shown in the Parts list. */
  type: string;
  items: PartItem[];
}

/** "32 GB", "1 TB", "3.5 TB" for a capacity in GB. */
export function fmtGB(gb: number): string {
  return gb >= 1000 ? +(gb / 1000).toFixed(2) + ' TB' : gb + ' GB';
}
