import type { PartId } from '../../data/parts';

export type MemType = 'DDR4' | 'DDR5';
export type PcieGen = 3 | 4 | 5;

/** Where the 3D model of a part comes from. `builder` always names a procedural builder in `model/registry.ts` and is the fallback. */
export interface ModelRef {
  /** Key into the procedural builders (e.g. 'case-nzxt-h7', 'generic-case'). */
  builder: string;
  /** Optional pre-built free model. Only used when `license` allows use in the app; loaded with GLTFLoader, `builder` stays as fallback. */
  glb?: {
    url: string;
    license: 'CC0' | 'CC-BY-4.0' | 'CC-BY-3.0' | 'MIT' | 'Apache-2.0';
    author: string;
    /** Page where the model and its license can be checked. */
    sourceUrl: string;
    /** Uniform scale to convert the file's units to mm. */
    scaleToMm?: number;
  };
}

/** A photo of the real product from a free public source (e.g. Wikimedia Commons API). Only licenses that allow reuse; attribution is shown in the UI. */
export interface ImageRef {
  /** Direct image URL (hotlink-safe, e.g. upload.wikimedia.org thumbnail). */
  url: string;
  license: 'CC0' | 'Public domain' | 'CC-BY-4.0' | 'CC-BY-3.0' | 'CC-BY-SA-4.0' | 'CC-BY-SA-3.0' | 'CC-BY-SA-2.0';
  author: string;
  /** File page where the license can be checked. */
  sourceUrl: string;
  /** True when the photo shows a similar product of the same type, not this exact model. The UI labels it "illustrative". */
  representative?: boolean;
}

export interface Dimensions { w: number; h: number; d: number }

/** Fields every spec sheet ("ficha") has. Pure data: no three.js, no React. */
export interface SpecBase {
  /** Stable slug, unique across the whole catalog (e.g. 'gpu-asus-prime-rtx5080-oc'). */
  id: string;
  kind: PartId;
  /** Display name without the manufacturer prefix when it reads naturally. */
  name: string;
  /** Company that makes the product (e.g. 'Intel', 'ASUS', 'Kingston'). */
  manufacturer: string;
  /** Brand / product line (e.g. 'Core', 'TUF Gaming', 'Fury Renegade'). */
  brand: string;
  /** Millimetres. For a stick/drive/card this is the real part, not the package. */
  dims?: Dimensions;
  model: ModelRef;
  /** Product photo. Optional: the UI falls back to an icon. */
  image?: ImageRef;
  /** True when numbers are estimates and not from the maker's datasheet. */
  estimated?: boolean;
  /** Where the numbers come from (maker spec page URLs). */
  sources?: string[];
}
