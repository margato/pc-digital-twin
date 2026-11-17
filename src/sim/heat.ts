import type { Temperatures } from '../data/scenarios';
import type { PartId } from '../data/parts';

type RGB = [number, number, number];
const STOPS: [number, RGB][] = [
  [25, [43, 108, 255]], [40, [32, 196, 216]], [55, [56, 209, 106]],
  [70, [255, 210, 63]], [82, [255, 122, 26]], [95, [232, 32, 42]]
];

/** sRGB 0–255 colour for a temperature in °C. */
export function heatRGB(t: number): RGB {
  if (t <= STOPS[0][0]) return STOPS[0][1];
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const a = STOPS[i - 1], b = STOPS[i], k = (t - a[0]) / (b[0] - a[0]);
      return [0, 1, 2].map((c) => a[1][c] + (b[1][c] - a[1][c]) * k) as RGB;
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export function partTemp(part: PartId | null | undefined, T: Temperatures): number {
  const by: Record<PartId, number> = { cpu: T.cpu, gpu: T.gpu, board: T.vrm, ram: T.ram, ssd: T.ssd, psu: T.psu, cooler: T.rad, case: T.air };
  return part ? by[part] : T.air;
}

export const SLICE_W = 192, SLICE_H = 198;

/** Air-temperature slice between the parts and the glass, in case millimetres. Returns RGBA pixels. */
export function sliceImage(T: Temperatures): Uint8ClampedArray {
  const src = [
    { x: -84, y: 232, s: 95, t: T.gpu }, { x: -110, y: 355, s: 55, t: T.cpu - 10 }, { x: -190, y: 360, s: 45, t: T.vrm },
    { x: -31, y: 355, s: 40, t: T.ram }, { x: -166, y: 60, s: 70, t: T.psu }, { x: -5, y: 470, s: 110, t: T.rad + 2 },
    { x: -84, y: 290, s: 120, t: T.gpu - 12 }
  ];
  const d = new Uint8ClampedArray(SLICE_W * SLICE_H * 4);
  for (let j = 0; j < SLICE_H; j++) for (let i = 0; i < SLICE_W; i++) {
    const x = -237 + (i + 0.5) / SLICE_W * 474, y = 505 - (j + 0.5) / SLICE_H * 490;
    let t = T.air - (x > 150 ? (x - 150) / 87 * (T.air - 26) : 0);
    for (const s of src) { const dx = x - s.x, dy = y - s.y; t += (s.t - T.air) * 0.8 * Math.exp(-(dx * dx + dy * dy) / (2 * s.s * s.s)); }
    if (y < 125) t = T.psu - 4 + 6 * Math.exp(-((x + 166) * (x + 166)) / 9000);
    const c = heatRGB(t), k = (j * SLICE_W + i) * 4;
    d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 205;
  }
  return d;
}
