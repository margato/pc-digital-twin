import {
  CURRENT_PSU_W, GPU_FAN_CFM, GPU_FAN_COUNT, GPU_FAN_FULL_W, GPU_FAN_MIN, GPU_FAN_STOP_W, PSU_FAN_CFM, PSU_FAN_MIN, PSU_FAN_STOP_LOAD,
  TOP_FAN_MODE, TOP_SLIT_FACTOR, type Scenario, type TopFanMode
} from '../data/scenarios';
import { powerOf } from './power';

/** GPU fan speed fraction (0 = stopped) from GPU watts. */
export function gpuFanFrac(w: number): number {
  if (w < GPU_FAN_STOP_W) return 0;
  return Math.min(1, GPU_FAN_MIN + (1 - GPU_FAN_MIN) * (w - GPU_FAN_STOP_W) / (GPU_FAN_FULL_W - GPU_FAN_STOP_W));
}

/** PSU fan speed fraction (0 = semi-passive stop) from load fraction. */
export function psuFanFrac(load: number): number {
  if (load < PSU_FAN_STOP_LOAD) return 0;
  return Math.min(1, PSU_FAN_MIN + (1 - PSU_FAN_MIN) * (load - PSU_FAN_STOP_LOAD) / (1 - PSU_FAN_STOP_LOAD));
}

/** GPU and PSU airflow sources. Own loops: neither changes case intake/exhaust or pressure. */
export function airSources(S: Scenario, psuW: number = CURRENT_PSU_W) {
  const gf = gpuFanFrac(S.w.gpu);
  const pf = psuFanFrac(powerOf(S.w, psuW).load);
  return {
    gpu: { frac: gf, cfm: Math.round(GPU_FAN_COUNT * GPU_FAN_CFM * gf), exhaustTemp: S.t.gpu - 6 },
    psu: { frac: pf, cfm: Math.round(PSU_FAN_CFM * pf), fanOn: pf > 0 }
  };
}

/**
 * Fan model assumptions: 52 CFM per 120 mm fan, radiator restriction about 28% (so 60 x 0.72 per radiator fan).
 * The three top radiator fans count as intake (restricted by the narrow top slit, TOP_SLIT_FACTOR) or exhaust depending on `topMode`.
 */
export function airReadout(S: Scenario, topMode: TopFanMode = TOP_FAN_MODE, psuW: number = CURRENT_PSU_W) {
  const top = 3 * 60 * 0.72 * S.fan;
  const intake = 3 * 52 * S.fan + (topMode === 'intake' ? top * TOP_SLIT_FACTOR : 0);
  const exhaust = 52 * S.fan + (topMode === 'exhaust' ? top : 0);
  const net = intake - exhaust;
  const pressure: 'negative' | 'positive' | 'balanced' = net < -5 ? 'negative' : net > 5 ? 'positive' : 'balanced';
  const { gpu, psu } = airSources(S, psuW);
  return { intake: Math.round(intake), exhaust: Math.round(exhaust), pressure, gpu: { cfm: gpu.cfm, exhaustTemp: gpu.exhaustTemp }, psu: { cfm: psu.cfm, fanOn: psu.fanOn } };
}

/** Front intake fan centres (y, case mm). */
export const FRONT_FANS = [432, 310, 188];
/** Top radiator fan centres (x, case mm; y 462, z 5). */
export const TOP_FANS = [-125, -5, 115];
/** Top intake slit (case mm): centre x, width along x, length along z, y of the panel. */
export const TOP_SLIT = { x: 205, w: 12, len: 190, y: 505 };
/** GPU fan centres (x, case mm; y 212, z -6), facing down; air goes up through the fin stack. */
export const GPU_FANS = [-185, -84, 17];
/** PSU footprint (case mm) and its rear exhaust plane. */
export const PSU_BOX = { x0: -236, x1: -96, y0: 15, y1: 101, z0: -85, z1: 65, rearX: -242 };
