import { describe, expect, it } from 'vitest';
import { applySwap, DEFAULT_BUILD, resolveBuild } from '../builds';
import type { Swap } from '../catalog';
import { setLang } from '../i18n';
import { evaluate } from './compat';

const base = resolveBuild(DEFAULT_BUILD);
const ev = (swap: Swap) => evaluate(resolveBuild(applySwap(DEFAULT_BUILD, swap)), base);
const find = (e: ReturnType<typeof evaluate>, label: string) => e.checks.find((c) => c.label === label);

const CPU = { i14700k: 'cpu-intel-i7-14700k', i14900k: 'cpu-intel-i9-14900k', r9800: 'cpu-amd-ryzen-7-9800x3d' };
const DDR5_32 = { spec: 'ram-generic-16gb-ddr5-6000', qty: 2 };

describe('evaluate with a home spec', () => {
  it('counts the other devices and the outlet size of the home it is given', () => {
    const noDevices = { version: 1 as const, volts: 127, amps: 10, safeFraction: 0.8, devices: [] };
    const heavy = { ...noDevices, devices: [{ id: 'h', name: 'Heater', watts: 900 }] };
    const small = { ...noDevices, volts: 120, amps: 5 };
    expect(evaluate(base, base, heavy).outlet - evaluate(base, base, noDevices).outlet).toBe(900);
    expect(find(evaluate(base, base, small), 'Wall outlet (est.)')?.l).toBe('fail');
  });
});

describe('evaluate', () => {
  it('current build has no warnings or failures', () => {
    const e = ev({});
    expect(e.checks.filter((c) => c.l !== 'ok')).toEqual([]);
    expect(e.worst).toBe('ok');
    expect(e.cap).toBe(850);
  });

  it('fails a CPU socket mismatch (9800X3D on Z690)', () => {
    const e = ev({ cpu: CPU.r9800 });
    expect(find(e, 'CPU socket')?.l).toBe('fail');
    expect(e.worst).toBe('fail');
  });

  it('fails a DDR mismatch', () => {
    const e = ev({ ram: DDR5_32 });
    expect(find(e, 'Memory')?.l).toBe('fail');
    expect(e.worst).toBe('fail');
  });

  it('fails when modules or capacity exceed the board', () => {
    expect(find(ev({ ram: { spec: 'ram-generic-16gb-ddr4-3600', qty: 6 } }), 'Memory slots')?.l).toBe('fail');
    expect(find(ev({ ram: { spec: 'ram-generic-16gb-ddr4-3600', qty: 4 } }), 'Memory slots')).toBeUndefined();
    expect(find(ev({}), 'Memory capacity')).toBeUndefined();
  });

  it('warns about BIOS for a 14th gen CPU on Z690 but not 12th gen', () => {
    expect(find(ev({ cpu: CPU.i14700k }), 'BIOS')?.l).toBe('warn');
    expect(find(ev({}), 'BIOS')).toBeUndefined();
    expect(ev({ cpu: CPU.i14700k }).worst).toBe('warn');
  });

  it('warns about cooling on the 14900K', () => {
    expect(find(ev({ cpu: CPU.i14900k }), 'Cooling')?.l).toBe('warn');
  });

  it('fails PSU-for-GPU for a 5090 on the 850 W PSU', () => {
    const e = ev({ gpu: 'gpu-nvidia-rtx-5090' });
    expect(find(e, 'PSU for the GPU')?.l).toBe('fail');
    expect(e.worst).toBe('fail');
  });

  it('5090 + 1000 W passes the GPU recommendation, with PSU and outlet loaded high', () => {
    const e = ev({ gpu: 'gpu-nvidia-rtx-5090', psu: 'psu-generic-1000-gold' });
    expect(find(e, 'PSU for the GPU')?.l).toBe('ok');
    expect(find(e, 'PSU load at full stress (est.)')?.l).toBe('warn');
    expect(find(e, 'Wall outlet (est.)')?.l).toBe('warn');
    expect(e.outlet).toBeGreaterThan(0.8 * 1270);
    expect(e.worst).toBe('warn');
  });

  it('warns that a Gen5 SSD runs at Gen4 on Z690, but a Gen4 one is ok', () => {
    expect(find(ev({ addSsd: 'ssd-generic-2tb-gen5' }), 'Storage')?.l).toBe('warn');
    expect(find(ev({ addSsd: 'ssd-generic-2tb-gen4' }), 'Storage')?.l).toBe('ok');
    expect(find(ev({}), 'Storage')).toBeUndefined();
  });

  it('warns on a platform change', () => {
    const e = ev({ cpu: CPU.r9800, board: 'board-generic-x870-ddr5', ram: DDR5_32 });
    expect(find(e, 'Platform change')?.l).toBe('warn');
    expect(find(e, 'CPU socket')?.l).toBe('ok');
    expect(find(e, 'Memory')?.l).toBe('ok');
    expect(e.worst).toBe('warn');
  });

  it('adds the new drive\'s wattage to the power breakdown', () => {
    const before = ev({}).w.ssd;
    expect(ev({ addSsd: 'ssd-generic-2tb-gen5' }).w.ssd).toBeCloseTo(before + 11);
  });

  it('judges a custom build against its own baseline, not the default', () => {
    const custom = resolveBuild(applySwap(DEFAULT_BUILD, { cpu: CPU.r9800, board: 'board-generic-x870-ddr5', ram: DDR5_32 }));
    const e = evaluate(custom, custom);
    expect(find(e, 'Platform change')).toBeUndefined();
    expect(e.checks.filter((c) => c.l === 'fail')).toEqual([]);
  });
});

describe('evaluate in Portuguese', () => {
  it('translates labels and texts, keeps the check id, and switches back to English', () => {
    setLang('pt');
    try {
      const e = ev({ cpu: CPU.r9800 });
      const socket = e.checks.find((c) => c.id === 'cpuSocket');
      expect(socket?.label).toBe('Soquete da CPU');
      expect(socket?.text).toContain('Escolha uma placa-mãe compatível.');
      expect(find(e, 'CPU socket')).toBeUndefined();
    } finally {
      setLang('en');
    }
    expect(find(ev({ cpu: CPU.r9800 }), 'CPU socket')?.l).toBe('fail');
  });
});
