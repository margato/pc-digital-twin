import type { RamSpec } from '../types';
/** One module. A build uses qty 4 for a 4-slot board. */
export const RAMS: RamSpec[] = [
  {
    id: 'ram-kingston-fury-renegade-8gb-ddr4-4000',
    kind: 'ram',
    name: 'Fury Renegade 8 GB DDR4-4000 CL19',
    manufacturer: 'Kingston',
    brand: 'Fury Renegade',
    model: {
      builder: 'ram-fury-renegade',
    },
    memType: 'DDR4',
    moduleGB: 8,
    speedMT: 4000,
    cl: 19,
    powerW: 2.5,
  },

  {
    id: 'ram-generic-16gb-ddr4-3600',
    kind: 'ram',
    name: 'Generic 16 GB DDR4-3600 CL18',
    manufacturer: 'Generic',
    brand: 'Generic',
    model: {
      builder: 'generic-ram',
    },
    estimated: true,
    image: {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/RAM_Module_%28SDRAM-DDR4%29.jpg/960px-RAM_Module_%28SDRAM-DDR4%29.jpg',
      license: 'CC-BY-SA-4.0',
      author: 'ElooKoN',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:RAM_Module_(SDRAM-DDR4).jpg',
      representative: true,
    },
    memType: 'DDR4',
    moduleGB: 16,
    speedMT: 3600,
    cl: 18,
    powerW: 3,
  },

  {
    id: 'ram-generic-16gb-ddr5-6000',
    kind: 'ram',
    name: 'Generic 16 GB DDR5-6000 CL30',
    manufacturer: 'Generic',
    brand: 'Generic',
    model: {
      builder: 'generic-ram',
    },
    estimated: true,
    memType: 'DDR5',
    moduleGB: 16,
    speedMT: 6000,
    cl: 30,
    powerW: 5,
  },
];
