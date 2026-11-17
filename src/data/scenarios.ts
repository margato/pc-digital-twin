/** Estimates from published specs; replace with real sensor data (see README "Next steps"). */
export interface Scenario {
  label: string;
  /** Fan speed factor, 0–1. */
  fan: number;
  /** DC watts per subsystem. */
  w: PowerBreakdown;
  /** Estimated temperatures in °C. */
  t: Temperatures;
}
export interface PowerBreakdown { cpu: number; gpu: number; board: number; ram: number; ssd: number; cool: number; rgb: number }
export interface Temperatures { cpu: number; gpu: number; vrm: number; ssd: number; ram: number; psu: number; air: number; rad: number }

export type ScenarioId = 'idle' | 'gaming' | 'stress';

export const SCEN: Record<ScenarioId, Scenario> = {
  idle:   { label: 'Idle',   fan: 0.35, w: { cpu: 12, gpu: 22, board: 25, ram: 8, ssd: 2, cool: 9, rgb: 4 },   t: { cpu: 33, gpu: 34, vrm: 40, ssd: 38, ram: 36, psu: 34, air: 28, rad: 30 } },
  gaming: { label: 'Gaming', fan: 0.7,  w: { cpu: 95, gpu: 320, board: 30, ram: 10, ssd: 5, cool: 17, rgb: 5 }, t: { cpu: 38, gpu: 63, vrm: 58, ssd: 47, ram: 44, psu: 42, air: 35, rad: 39 } },
  stress: { label: 'Stress', fan: 1.0,  w: { cpu: 190, gpu: 360, board: 35, ram: 12, ssd: 8, cool: 24, rgb: 5 }, t: { cpu: 40, gpu: 70, vrm: 76, ssd: 55, ram: 50, psu: 50, air: 40, rad: 46 } }
};
export const SCEN_IDS = Object.keys(SCEN) as ScenarioId[];

/**
 * Direction of the three 120 mm radiator fans on the case top (NZXT H7 perforated top panel).
 * 'intake' (default): they pull room air in through the top grille and the radiator, so the rear fan is the only exhaust.
 * 'exhaust': legacy behaviour, the radiator fans blow warm air out of the top.
 */
export type TopFanMode = 'intake' | 'exhaust';
export const TOP_FAN_MODE: TopFanMode = 'intake';
/** In 'intake' mode air only enters through a narrow slit (about 12 x 190 mm) in the top panel, so the top fans move only this fraction of their free flow. Estimate. */
export const TOP_SLIT_FACTOR = 0.35;

/**
 * GPU cooler and PSU airflow assumptions (estimates, replace with real fan curves / sensor RPM).
 * GPU: 3 axial fans (about 90 mm) on the lower face push case air up through the fin stack; it leaves sideways (glass side and rear side) and through the I/O bracket vents.
 * It recirculates case air: it adds heat, not net flow, so it never changes case pressure.
 */
export const GPU_FAN_COUNT = 3;
/** Free-air flow per GPU fan at 100%, CFM. */
export const GPU_FAN_CFM = 30;
/** Fans stay at 0 rpm below this GPU power (W), then ramp from GPU_FAN_MIN to 100% at GPU_FAN_FULL_W. */
export const GPU_FAN_STOP_W = 60;
export const GPU_FAN_FULL_W = 360;
export const GPU_FAN_MIN = 0.3;
/**
 * PSU: one 135 mm fan draws room air through the floor (dust filter, feet gap) and exhausts out the rear panel,
 * in a sealed lower chamber behind the shroud: it does not change case pressure. Semi-passive (0 rpm) below PSU_FAN_STOP_LOAD of rated load.
 */
export const PSU_FAN_CFM = 70;
export const PSU_FAN_STOP_LOAD = 0.3;
export const PSU_FAN_MIN = 0.35;

/** Average weeks in a month, to turn weekly play time into a monthly estimate. */
export const WEEKS_PER_MONTH = 52 / 12;
/** RGB lighting draw, W. Same for every build until it becomes part of the spec sheets. */
export const RGB_W = 5;
/** Rated power of the 12V-2x6 connector. */
export const CONN_W = 600;
/** PSU wattage the airflow helpers assume when a caller does not pass one (the Default build's 850 W). */
export const CURRENT_PSU_W = 850;

