/** Something else plugged into the same outlet as the PC (monitor, TV, router, speakers...). */
export interface HomeDevice {
  id: string;
  name: string;
  /** Wall draw while the PC is under load (Gaming, Stress), W. */
  watts: number;
  /** Wall draw while the PC idles, W. Same as `watts` when absent. */
  idleWatts?: number;
}

/**
 * The user's home, the other half of the picture next to the PC's spec sheets: the wall outlet the PC shares and the devices on it.
 * It belongs to the user, not to a build, so every build is checked against the same home.
 */
export interface HomeSpec {
  version: 1;
  /** Mains voltage, V. */
  volts: number;
  /** Breaker / outlet rating, A. */
  amps: number;
  /** Share of the outlet rating that is fine for continuous load (0.8 is the usual rule). */
  safeFraction: number;
  devices: HomeDevice[];
}
