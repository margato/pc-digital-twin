import type { SsdSpec } from '../types';
const M2_2280_DIMS = {
  w: 80,
  h: 22,
  d: 3.5,
};
export const SSDS: SsdSpec[] = [
  {
    id: 'ssd-kingston-kc3000-1tb',
    kind: 'ssd',
    name: 'KC3000 1 TB',
    manufacturer: 'Kingston',
    brand: 'KC3000',
    // 1 TB model; the 2 and 4 TB models are 3.5 mm thick
    dims: {
      w: 80,
      h: 22,
      d: 2.21,
    },
    model: {
      builder: 'ssd-kc3000',
    },
    capacityGB: 1000,
    iface: 'NVMe',
    pcieGen: 4,
    formFactor: 'M.2 2280',
    readMBs: 7000,
    writeMBs: 6000,
    powerW: 6.3, // max write per Kingston datasheet
  },

  {
    id: 'ssd-generic-2tb-gen4',
    kind: 'ssd',
    name: 'Generic 2 TB NVMe PCIe 4.0',
    manufacturer: 'Generic',
    brand: 'Generic',
    dims: M2_2280_DIMS,
    model: {
      builder: 'generic-ssd',
    },
    estimated: true,
    image: {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/20260522_%EC%8A%A4%EC%BA%94%EB%94%94%EC%8A%A4%ED%81%AC_NVMe_M.2%ED%98%95_SSD.jpg/960px-20260522_%EC%8A%A4%EC%BA%94%EB%94%94%EC%8A%A4%ED%81%AC_NVMe_M.2%ED%98%95_SSD.jpg',
      license: 'CC0',
      author: 'Striker9498',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:20260522_%EC%8A%A4%EC%BA%94%EB%94%94%EC%8A%A4%ED%81%AC_NVMe_M.2%ED%98%95_SSD.jpg',
      representative: true,
    },
    capacityGB: 2000,
    iface: 'NVMe',
    pcieGen: 4,
    formFactor: 'M.2 2280',
    readMBs: 7000,
    writeMBs: 6000,
    powerW: 6,
  },

  {
    id: 'ssd-generic-4tb-gen4',
    kind: 'ssd',
    name: 'Generic 4 TB NVMe PCIe 4.0',
    manufacturer: 'Generic',
    brand: 'Generic',
    dims: M2_2280_DIMS,
    model: {
      builder: 'generic-ssd',
    },
    estimated: true,
    image: {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/20260522_%EC%8A%A4%EC%BA%94%EB%94%94%EC%8A%A4%ED%81%AC_NVMe_M.2%ED%98%95_SSD.jpg/960px-20260522_%EC%8A%A4%EC%BA%94%EB%94%94%EC%8A%A4%ED%81%AC_NVMe_M.2%ED%98%95_SSD.jpg',
      license: 'CC0',
      author: 'Striker9498',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:20260522_%EC%8A%A4%EC%BA%94%EB%94%94%EC%8A%A4%ED%81%AC_NVMe_M.2%ED%98%95_SSD.jpg',
      representative: true,
    },
    capacityGB: 4000,
    iface: 'NVMe',
    pcieGen: 4,
    formFactor: 'M.2 2280',
    readMBs: 7000,
    writeMBs: 6000,
    powerW: 7,
  },

  {
    id: 'ssd-generic-2tb-gen5',
    kind: 'ssd',
    name: 'Generic 2 TB NVMe PCIe 5.0',
    manufacturer: 'Generic',
    brand: 'Generic',
    dims: M2_2280_DIMS,
    model: {
      builder: 'generic-ssd',
    },
    estimated: true,
    image: {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/20260522_%EC%8A%A4%EC%BA%94%EB%94%94%EC%8A%A4%ED%81%AC_NVMe_M.2%ED%98%95_SSD.jpg/960px-20260522_%EC%8A%A4%EC%BA%94%EB%94%94%EC%8A%A4%ED%81%AC_NVMe_M.2%ED%98%95_SSD.jpg',
      license: 'CC0',
      author: 'Striker9498',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:20260522_%EC%8A%A4%EC%BA%94%EB%94%94%EC%8A%A4%ED%81%AC_NVMe_M.2%ED%98%95_SSD.jpg',
      representative: true,
    },
    capacityGB: 2000,
    iface: 'NVMe',
    pcieGen: 5,
    formFactor: 'M.2 2280',
    readMBs: 12000,
    writeMBs: 11000,
    powerW: 11,
  },
];
