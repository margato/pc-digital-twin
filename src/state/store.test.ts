import { beforeEach, describe, expect, it } from 'vitest';
import { buildRepository, DEFAULT_BUILD } from '../builds';
import type { Build } from '../catalog';
import { useApp } from './store';

const s = () => useApp.getState();
beforeEach(() => {
  s().resetBuilds();
  useApp.setState({ part: null, scen: 'gaming', section: 'parts', swap: {}, heatOn: false, airOn: false });
});

describe('store', () => {
  it('togglePart isolates, then clears on the same part', () => {
    s().togglePart('gpu');
    expect(s().part).toBe('gpu');
    s().togglePart('cpu');
    expect(s().part).toBe('cpu');
    s().togglePart('cpu');
    expect(s().part).toBeNull();
  });
  it('setSwap patches and clears keys set to undefined; resetSwap empties it', () => {
    s().setSwap({ gpu: 'gpu-nvidia-rtx-5090' });
    s().setSwap({ psu: 'psu-generic-1200-platinum' });
    expect(s().swap).toEqual({ gpu: 'gpu-nvidia-rtx-5090', psu: 'psu-generic-1200-platinum' });
    s().setSwap({ gpu: undefined });
    expect(s().swap).toEqual({ psu: 'psu-generic-1200-platinum' });
    s().resetSwap();
    expect(s().swap).toEqual({});
  });
  it('tryUpgrade replaces the swap and opens what-if', () => {
    s().setSwap({ psu: 'psu-generic-1200-platinum' });
    s().tryUpgrade({ addSsd: 'ssd-generic-2tb-gen4' });
    expect(s().section).toBe('whatif');
    expect(s().swap).toEqual({ addSsd: 'ssd-generic-2tb-gen4' });
  });
  it('starts on the default build with scenarios derived from it', () => {
    expect(s().build.id).toBe('default');
    expect(s().resolved.psu.wattage).toBe(850);
    expect(s().scenarios.stress.w.gpu).toBe(360);
  });
  it('saveBuild stores, activates and closes onboarding; selectBuild switches back', () => {
    const mine: Build = { ...JSON.parse(JSON.stringify(DEFAULT_BUILD)), id: 'mine', name: 'Mine', upgrades: undefined };
    mine.parts.gpu = [{ spec: 'gpu-nvidia-rtx-5090', qty: 1 }];
    s().openOnboarding();
    s().setSwap({ psu: 'psu-generic-1200-platinum' });
    s().saveBuild(mine);
    expect([s().build.id, s().onboardingOpen, s().swap]).toEqual(['mine', false, {}]);
    expect(s().scenarios.stress.w.gpu).toBe(575);
    expect(buildRepository.getActiveId()).toBe('mine');
    expect(s().builds.map((b) => b.id)).toEqual(['default', 'mine']);
    s().selectBuild('default');
    expect(s().build.id).toBe('default');
  });
  it('removeBuild of the active build falls back to the default; resetBuilds clears all', () => {
    const mine: Build = { ...JSON.parse(JSON.stringify(DEFAULT_BUILD)), id: 'mine', name: 'Mine', upgrades: undefined };
    s().saveBuild(mine);
    s().removeBuild('mine');
    expect([s().build.id, s().builds.length]).toEqual(['default', 1]);
    s().saveBuild(mine);
    s().resetBuilds();
    expect([s().build.id, s().builds.length]).toEqual(['default', 1]);
  });
  it('setHeat / setAir toggle independently', () => {
    s().setHeat(true);
    expect([s().heatOn, s().airOn]).toEqual([true, false]);
    s().setAir(true);
    s().setHeat(false);
    expect([s().heatOn, s().airOn]).toEqual([false, true]);
  });
  it('setScen and setSection', () => {
    s().setScen('stress'); s().setSection('power');
    expect([s().scen, s().section]).toEqual(['stress', 'power']);
  });
});
