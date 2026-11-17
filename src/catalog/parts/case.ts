import type { CaseSpec } from '../types';
/** Case spec sheets. Real build first (NZXT H7), then a generic ATX mid tower estimate. */
export const CASES: CaseSpec[] = [
  {
    id: 'case-nzxt-h7',
    kind: 'case',
    name: 'H7',
    manufacturer: 'NZXT',
    brand: 'H Series',
    formFactors: ['ATX', 'mATX', 'ITX'],
    gpuMaxLenMm: 375,
    gpuMaxLenNoFrontFansMm: 400,
    expansionSlots: 7,
    frontFans: 3,
    rearFans: 1,
    topRadiatorMm: 360,
    dims: {
      w: 230,
      h: 505,
      d: 480,
    },
    model: {
      builder: 'case-nzxt-h7',
    },
  },

  {
    id: 'case-generic-atx-mid-tower',
    kind: 'case',
    name: 'ATX mid tower',
    manufacturer: 'Generic',
    brand: 'Generic',
    formFactors: ['ATX', 'mATX', 'ITX'],
    gpuMaxLenMm: 350,
    gpuMaxLenNoFrontFansMm: 400,
    expansionSlots: 7,
    frontFans: 2,
    rearFans: 1,
    dims: {
      w: 230,
      h: 490,
      d: 470,
    },
    estimated: true,
    model: {
      builder: 'generic-case',
    },
    image: {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/ATX_computer_case_-_left_-_2018-05-18.jpg/960px-ATX_computer_case_-_left_-_2018-05-18.jpg',
      license: 'CC-BY-SA-4.0',
      author: 'Bretwa',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:ATX_computer_case_-_left_-_2018-05-18.jpg',
      representative: true,
    },
  },
];
