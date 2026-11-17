import type { PsuSpec } from '../types';
/** PSU spec sheets. Real build first (XPG Core Reactor II VE 850 W, see README), then generic estimates. */
export const PSUS: PsuSpec[] = [
  {
    id: 'psu-xpg-core-reactor-ii-ve-850',
    kind: 'psu',
    name: 'Core Reactor II VE 850 W',
    manufacturer: 'ADATA',
    brand: 'XPG',
    wattage: 850,
    efficiency: '80+ Gold',
    atx: 'ATX 3.1',
    native12v2x6: true,
    fanMm: 135,
    dims: {
      w: 150,
      h: 86,
      d: 140,
    },
    model: {
      builder: 'psu-xpg-core-reactor',
    },
  },

  {
    id: 'psu-generic-1000-gold',
    kind: 'psu',
    name: '1000 W Gold ATX 3.1',
    manufacturer: 'Generic',
    brand: 'Generic',
    wattage: 1000,
    efficiency: '80+ Gold',
    atx: 'ATX 3.1',
    native12v2x6: true,
    fanMm: 135,
    estimated: true,
    model: {
      builder: 'generic-psu',
    },
    image: {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Power_Supply_ATX-450PNF.jpg/960px-Power_Supply_ATX-450PNF.jpg',
      license: 'CC-BY-SA-3.0',
      author: 'Victor Korniyenko',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Power_Supply_ATX-450PNF.jpg',
      representative: true,
    },
  },

  {
    id: 'psu-generic-1200-platinum',
    kind: 'psu',
    name: '1200 W Platinum ATX 3.1',
    manufacturer: 'Generic',
    brand: 'Generic',
    wattage: 1200,
    efficiency: '80+ Platinum',
    atx: 'ATX 3.1',
    native12v2x6: true,
    fanMm: 135,
    estimated: true,
    model: {
      builder: 'generic-psu',
    },
    image: {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Power_Supply_ATX-450PNF.jpg/960px-Power_Supply_ATX-450PNF.jpg',
      license: 'CC-BY-SA-3.0',
      author: 'Victor Korniyenko',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Power_Supply_ATX-450PNF.jpg',
      representative: true,
    },
  },
];
