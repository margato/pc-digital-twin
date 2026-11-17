import { describe, expect, it } from 'vitest';
import { SCEN, TOP_FAN_MODE, TOP_SLIT_FACTOR } from '../data/scenarios';
import { airReadout, airSources, FRONT_FANS, GPU_FANS, TOP_FANS } from './airflow';

const rad = 3 * 60 * 0.72;

describe('airReadout', () => {
  it('defaults to top intake', () => expect(TOP_FAN_MODE).toBe('intake'));
  it('top intake: intake = front + restricted top slit, exhaust = rear only', () => {
    expect(airReadout(SCEN.stress, 'intake')).toMatchObject({ intake: Math.round(156 + rad * TOP_SLIT_FACTOR), exhaust: 52 });
    expect(airReadout(SCEN.idle, 'intake')).toMatchObject({ intake: Math.round((156 + rad * TOP_SLIT_FACTOR) * 0.35), exhaust: Math.round(52 * 0.35) });
  });
  it('top intake is clearly positive pressure in every scenario', () => {
    for (const id of ['idle', 'gaming', 'stress'] as const) expect(airReadout(SCEN[id], 'intake').pressure).toBe('positive');
  });
  it('top exhaust keeps the legacy numbers and negative pressure', () => {
    expect(airReadout(SCEN.stress, 'exhaust')).toMatchObject({ intake: 156, exhaust: 182 });
    expect(airReadout(SCEN.idle, 'exhaust')).toMatchObject({ intake: Math.round(156 * 0.35), exhaust: Math.round((rad + 52) * 0.35) });
    for (const id of ['idle', 'gaming', 'stress'] as const) expect(airReadout(SCEN[id], 'exhaust').pressure).toBe('negative');
  });
  it('reports balanced when net flow is within 5 CFM (exhaust mode)', () => {
    expect(airReadout({ ...SCEN.idle, fan: 0.1 }, 'exhaust').pressure).toBe('balanced');
  });
  it('top slit restricts top flow below the free-flow figure', () => {
    expect(TOP_SLIT_FACTOR).toBeLessThan(1);
    expect(airReadout(SCEN.stress, 'intake').intake).toBeLessThan(Math.round(156 + rad));
  });
  it('has three front fans and three top fans', () => {
    expect(FRONT_FANS).toHaveLength(3);
    expect(TOP_FANS).toHaveLength(3);
  });
  it('PSU fan is off at idle (semi-passive) and on under load', () => {
    expect(airReadout(SCEN.idle).psu).toEqual({ cfm: 0, fanOn: false });
    expect(airReadout(SCEN.gaming).psu.fanOn).toBe(true);
    expect(airReadout(SCEN.stress).psu.cfm).toBeGreaterThan(airReadout(SCEN.gaming).psu.cfm);
  });
  it('GPU fan CFM scales with scenario and is stopped at idle', () => {
    const g = (id: 'idle' | 'gaming' | 'stress') => airReadout(SCEN[id]).gpu.cfm;
    expect(g('idle')).toBe(0);
    expect(g('gaming')).toBeGreaterThan(0);
    expect(g('stress')).toBeGreaterThan(g('gaming'));
    expect(g('stress')).toBe(90);
    expect(airReadout(SCEN.stress).gpu.exhaustTemp).toBe(SCEN.stress.t.gpu - 6);
  });
  it('GPU and PSU loops do not change case intake, exhaust or pressure', () => {
    const a = airReadout(SCEN.stress, 'intake');
    const b = airReadout({ ...SCEN.stress, w: { ...SCEN.stress.w, gpu: 0, cpu: 0 } }, 'intake');
    expect({ i: a.intake, e: a.exhaust, p: a.pressure }).toEqual({ i: b.intake, e: b.exhaust, p: b.pressure });
    expect(airSources(SCEN.stress, 1000).psu.cfm).toBeLessThan(airSources(SCEN.stress, 650).psu.cfm);
  });
  it('has three GPU fans', () => expect(GPU_FANS).toHaveLength(3));
});
