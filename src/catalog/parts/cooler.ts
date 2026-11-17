import type { CoolerSpec } from '../types';
/** Cooler spec sheets. Real build first (MasterLiquid PL360 Flux, top mounted), then generic AIO estimates. */
export const COOLERS: CoolerSpec[] = [
  {
    id: 'cooler-masterliquid-pl360-flux',
    kind: 'cooler',
    name: 'MasterLiquid PL360 Flux',
    manufacturer: 'Cooler Master',
    brand: 'MasterLiquid',
    type: 'aio',
    radiatorMm: 360,
    fanCount: 3,
    fanMm: 120,
    powerW: 24,
    sockets: ['LGA1700', 'AM5'],
    dims: {
      w: 394,
      h: 119.6,
      d: 27.2,
    },
    model: {
      builder: 'cooler-pl360-flux',
    },
  },

  {
    id: 'cooler-generic-aio-240',
    kind: 'cooler',
    name: '240 mm AIO',
    manufacturer: 'Generic',
    brand: 'Generic',
    type: 'aio',
    radiatorMm: 240,
    fanCount: 2,
    fanMm: 120,
    powerW: 18,
    sockets: ['LGA1700', 'LGA1851', 'AM5'],
    dims: {
      w: 274,
      h: 120,
      d: 27,
    },
    estimated: true,
    model: {
      builder: 'generic-cooler',
    },
    image: {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/Cooler_Master_ML240P_series_20190601.jpg/960px-Cooler_Master_ML240P_series_20190601.jpg',
      license: 'CC-BY-SA-4.0',
      author: 'Solomon203',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cooler_Master_ML240P_series_20190601.jpg',
      representative: true,
    },
  },

  {
    id: 'cooler-generic-aio-360',
    kind: 'cooler',
    name: '360 mm AIO',
    manufacturer: 'Generic',
    brand: 'Generic',
    type: 'aio',
    radiatorMm: 360,
    fanCount: 3,
    fanMm: 120,
    powerW: 24,
    sockets: ['LGA1700', 'LGA1851', 'AM5'],
    dims: {
      w: 394,
      h: 120,
      d: 27,
    },
    estimated: true,
    model: {
      builder: 'generic-cooler',
    },
    image: {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/Cooler_Master_ML240P_series_20190601.jpg/960px-Cooler_Master_ML240P_series_20190601.jpg',
      license: 'CC-BY-SA-4.0',
      author: 'Solomon203',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cooler_Master_ML240P_series_20190601.jpg',
      representative: true,
    },
  },
];
