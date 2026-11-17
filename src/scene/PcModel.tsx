import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildPcModel, modelSignature } from '../model';
import type { Kit, PcMat } from '../model/kit';
import { useApp } from '../state/store';
import { TOP_FAN_MODE, TOP_SLIT_FACTOR, type Scenario } from '../data/scenarios';
import { heatRGB, partTemp, sliceImage, SLICE_W, SLICE_H } from '../sim/heat';
import { airSources, FRONT_FANS, GPU_FANS, PSU_BOX, TOP_FANS, TOP_SLIT } from '../sim/airflow';
import { isMobile, prefersReducedMotion } from '../three-setup';

export interface PcCtx { group: THREE.Group; kit: Kit }
export const PcContext = createContext<PcCtx | null>(null);

export function usePc(): PcCtx {
  const v = useContext(PcContext);
  if (!v) throw new Error('usePc must be used inside <PcProvider>');
  return v;
}

/** Builds the PC model once and shares it (group + kit) with every scene component. */
export function PcProvider({ children }: { children: ReactNode }) {
  const resolved = useApp((st) => st.resolved);
  // Rebuild only when the drawn models change (see modelSignature), not on every build switch.
  const signature = modelSignature(resolved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pc = useMemo(() => buildPcModel(resolved), [signature]);
  return <PcContext.Provider value={pc}>{children}</PcContext.Provider>;
}

/* ---------- heat / airflow helpers (legacy port, case-millimetre space) ---------- */
const heatColor = (t: number) => {
  const c = heatRGB(t);
  return new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255).convertSRGBToLinear();
};

const NP = isMobile ? 520 : 1100;
// The one particle budget is split: main case air [0, NM), GPU cooler loop [NM, NM + NG), PSU lower-chamber loop [NM + NG, NP).
const NG = Math.round(NP * 0.18), NS = Math.round(NP * 0.1), NM = NP - NG - NS;

function makeOverlays() {
  const hc = document.createElement('canvas');
  hc.width = SLICE_W; hc.height = SLICE_H;
  const hctx = hc.getContext('2d')!;
  const heatTex = new THREE.CanvasTexture(hc);
  heatTex.colorSpace = THREE.SRGBColorSpace;
  const slice = new THREE.Mesh(
    new THREE.PlaneGeometry(474, 490),
    new THREE.MeshBasicMaterial({ map: heatTex, transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  );
  slice.position.set(0, 258.5, 78);
  slice.visible = false;
  slice.renderOrder = 2;

  const apos = new Float32Array(NP * 3), acol = new Float32Array(NP * 3), atemp = new Float32Array(NP), aage = new Float32Array(NP);
  const dotC = document.createElement('canvas');
  dotC.width = dotC.height = 64;
  const dg = dotC.getContext('2d')!;
  const rg = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.45, 'rgba(255,255,255,.85)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  dg.fillStyle = rg; dg.fillRect(0, 0, 64, 64);
  const ageo = new THREE.BufferGeometry();
  ageo.setAttribute('position', new THREE.BufferAttribute(apos, 3));
  ageo.setAttribute('color', new THREE.BufferAttribute(acol, 3));
  const pts = new THREE.Points(
    ageo,
    new THREE.PointsMaterial({ size: isMobile ? 0.07 : 0.055, map: new THREE.CanvasTexture(dotC), vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false })
  );
  pts.visible = false; pts.frustumCulled = false; pts.renderOrder = 3;

  const TOP_INTAKE = TOP_FAN_MODE === 'intake';
  const TOP_SHARE = (3 * 60 * 0.72 * TOP_SLIT_FACTOR) / (3 * 52 + 3 * 60 * 0.72 * TOP_SLIT_FACTOR);
  const spawn = (i: number, anywhere: boolean) => {
    if (i >= NM + NG) {
      // PSU: room air enters through the floor under the PSU footprint (feet gap, dust filter)
      apos[i * 3] = PSU_BOX.x0 + 10 + Math.random() * (PSU_BOX.x1 - PSU_BOX.x0 - 20);
      apos[i * 3 + 1] = anywhere ? Math.random() * 100 : Math.random() * 12;
      apos[i * 3 + 2] = PSU_BOX.z0 + 10 + Math.random() * (PSU_BOX.z1 - PSU_BOX.z0 - 20);
      atemp[i] = 26; aage[i] = anywhere ? Math.random() * 5 : 0;
      return;
    }
    if (i >= NM) {
      // GPU: case air under the three fans (between the shroud at y 125 and the card at y 207)
      const gx = GPU_FANS[(Math.random() * 3) | 0], ga = Math.random() * Math.PI * 2, gr = Math.sqrt(Math.random()) * 38;
      apos[i * 3] = gx + Math.cos(ga) * gr;
      apos[i * 3 + 1] = anywhere ? 150 + Math.random() * 100 : 150 + Math.random() * 50;
      apos[i * 3 + 2] = -6 + Math.sin(ga) * gr;
      atemp[i] = 30; aage[i] = anywhere ? Math.random() * 4 : 0;
      return;
    }
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * 52;
    if (TOP_INTAKE && Math.random() < TOP_SHARE) {
      // top intake: air enters only through the narrow top slit, is guided to the radiator fans and falls through the radiator
      apos[i * 3] = anywhere ? -190 + Math.random() * 390 : TOP_SLIT.x + (Math.random() - 0.5) * TOP_SLIT.w;
      apos[i * 3 + 1] = anywhere ? 440 + Math.random() * 62 : 506 - Math.random() * 3;
      apos[i * 3 + 2] = (Math.random() - 0.5) * TOP_SLIT.len;
      atemp[i] = 26; aage[i] = anywhere ? Math.random() * 6 : 0;
      return;
    }
    const fy = FRONT_FANS[(Math.random() * 3) | 0];
    apos[i * 3] = anywhere ? -230 + Math.random() * 450 : 222 - Math.random() * 10;
    apos[i * 3 + 1] = anywhere ? 135 + Math.random() * 355 : fy + Math.sin(a) * rr;
    apos[i * 3 + 2] = Math.cos(a) * rr * (anywhere ? 1.8 : 1);
    atemp[i] = 26; aage[i] = anywhere ? Math.random() * 6 : 0;
  };
  for (let i = 0; i < NP; i++) spawn(i, true);

  const inBox = (x: number, y: number, z: number, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
    x > x0 && x < x1 && y > y0 && y < y1 && z > z0 && z < z1;

  function airStep(dt: number, S: Scenario, psuW: number) {
    const f = 0.35 + S.fan, T = S.t, tt = performance.now() * 0.001, src = airSources(S, psuW);
    for (let i = 0; i < NP; i++) {
      const x = apos[i * 3], y = apos[i * 3 + 1], z = apos[i * 3 + 2];
      if (i >= NM) {
        // GPU / PSU loops: separate from the main chamber (the shroud at y 125 blocks the PSU loop); idle fans leave only a slow drift
        let vx = 0, vy = 0, vz = 0, nx = x, ny = y, nz = z, out = false;
        if (i >= NM + NG) {
          const p = Math.max(0.06, src.psu.frac), P = PSU_BOX;
          if (x <= P.x0) { vx = -300 * p; vy = 0; out = x < P.rearX; }
          else if (y < P.y0) vy = 230 * p;
          else { vy = (58 - y) * 3 * p; vx = -230 * p; atemp[i] += (T.psu - 3 - atemp[i]) * dt * 1.6; }
          vz = Math.sin(tt * 1.7 + i) * 14; vy += Math.sin(tt * 2 + i) * 10;
          nx = x + vx * dt; ny = Math.min(P.y1, y + vy * dt); nz = Math.min(P.z1, Math.max(P.z0, z + vz * dt));
        } else {
          const g = 0.12 + src.gpu.frac, fin = x > -236 && x < 68 && y > 207 && y < 257;
          if (y < 207) { vy = 260 * g; vx = (GPU_FANS.reduce((b, c) => (Math.abs(c - x) < Math.abs(b - x) ? c : b), GPU_FANS[0]) - x) * 2 * g; }
          else if (fin && y < 240) { vy = 240 * g; atemp[i] += (T.gpu - 6 - atemp[i]) * dt * 2.4; }
          else if (fin) {
            // fin stack is closed above: air leaves sideways (glass side / rear side) or through the I/O bracket vents
            if (i % 5 === 0) vx = -300 * g; else vz = (i % 2 ? 1 : -1) * 320 * g;
            atemp[i] += (T.gpu - 6 - atemp[i]) * dt * 2.4;
          } else { vy = 30 * g; vz = Math.sign(z + 6) * 140 * g; vx = x < -236 ? -140 * g : 0; atemp[i] += (T.air - atemp[i]) * dt * 0.25; }
          nx = x + vx * dt; ny = y + vy * dt; nz = z + vz * dt;
          if (fin) ny = Math.min(ny, 240);
          out = nx < -242 || nz > 100 || nz < -72;
        }
        apos[i * 3] = nx; apos[i * 3 + 1] = ny; apos[i * 3 + 2] = nz;
        aage[i] += dt;
        if (out || aage[i] > 6) spawn(i, false);
        const c = heatRGB(atemp[i]);
        acol[i * 3] = Math.pow(c[0] / 255, 2.2); acol[i * 3 + 1] = Math.pow(c[1] / 255, 2.2); acol[i * 3 + 2] = Math.pow(c[2] / 255, 2.2);
        continue;
      }
      let vx = -230 * f, vy = 0, vz = 0;
      if (!TOP_INTAKE && y > 395) vy += (y - 395) * 4.2 * f;
      if (TOP_INTAKE && y > 430 && x >= 190) { vx = -300 * f; vy = -30; }
      if (TOP_INTAKE && y > 430 && x > -200 && x < 190) { vy = -270 * f; vx *= 0.15; }
      if (x < -110 && y > 300 && y < 470) vx -= 260 * f;
      if (inBox(x, y, z, -236, 68, 140, 207, -69, 57)) { vy += 420 * f; vx *= 0.4; }
      if (inBox(x, y, z, -236, 68, 207, 256, -69, 57)) { vy += 320 * f; vz += 170 * f; vx *= 0.3; atemp[i] += (T.gpu - 6 - atemp[i]) * dt * 2.2; }
      if (inBox(x, y, z, -236, 68, 256, 310, -80, 110)) vy += 140 * f;
      if (y > 440 && x > -200 && x < 190) atemp[i] += (T.rad + 4 - atemp[i]) * dt * 3;
      if (inBox(x, y, z, -215, -165, 300, 420, -80, -30)) atemp[i] += (T.vrm - 8 - atemp[i]) * dt * 1.5;
      vy += Math.sin(tt * 2 + i) * 22; vz += Math.cos(tt * 1.7 + i * 0.7) * 22;
      if (y < 132) vy = Math.abs(vy) + 60;
      if (TOP_INTAKE && y > 508 && !(x > -200 && x < 190)) vy = -Math.abs(vy) - 40;
      if (z < -66) vz = Math.abs(vz) + 40;
      if (z > 104) vz = -Math.abs(vz) - 40;
      apos[i * 3] = x + vx * dt; apos[i * 3 + 1] = y + vy * dt; apos[i * 3 + 2] = z + vz * dt;
      aage[i] += dt;
      if ((!TOP_INTAKE && apos[i * 3 + 1] > 502) || apos[i * 3] < -236 || aage[i] > 9) spawn(i, false);
      const c = heatRGB(atemp[i]);
      acol[i * 3] = Math.pow(c[0] / 255, 2.2); acol[i * 3 + 1] = Math.pow(c[1] / 255, 2.2); acol[i * 3 + 2] = Math.pow(c[2] / 255, 2.2);
    }
    (ageo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (ageo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  // Airflow arrows are flat 2D shapes: each one is re-oriented every frame to lie in the screen plane, pointing along the flow as seen
  // from the camera, so they read as a 2D overlay however the 3D model is rotated. Depth test is off so none are hidden behind the case.
  const arrows = new THREE.Group();
  arrows.visible = false;
  const arrowGeos = new Map<number, THREE.ShapeGeometry>();
  const arrowGeo = (len: number) => {
    let g = arrowGeos.get(len);
    if (!g) {
      const hw = 4, hl = 30, hh = 15; // shaft half-width, head length, head half-width (mm)
      const sh = new THREE.Shape();
      sh.moveTo(0, -hw); sh.lineTo(len - hl, -hw); sh.lineTo(len - hl, -hh); sh.lineTo(len, 0);
      sh.lineTo(len - hl, hh); sh.lineTo(len - hl, hw); sh.lineTo(0, hw); sh.closePath();
      g = new THREE.ShapeGeometry(sh);
      arrowGeos.set(len, g);
    }
    return g;
  };
  const flat: { mesh: THREE.Mesh; o: THREE.Vector3; d: THREE.Vector3 }[] = [];
  const arrow = (o: number[], d: number[], col: number, len = 95) => {
    const mesh = new THREE.Mesh(
      arrowGeo(len),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthTest: false, depthWrite: false })
    );
    mesh.renderOrder = 10;
    mesh.matrixAutoUpdate = false;
    arrows.add(mesh);
    flat.push({ mesh, o: new THREE.Vector3().fromArray(o), d: new THREE.Vector3().fromArray(d).normalize() });
  };
  const _f = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector3();
  const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4();
  function faceCamera(camera: THREE.Camera) {
    arrows.updateWorldMatrix(true, false);
    _inv.copy(arrows.matrixWorld).invert();
    camera.getWorldDirection(_f);
    _z.copy(_f).negate();
    flat.forEach((a) => {
      _p.copy(a.o).applyMatrix4(arrows.matrixWorld);
      _d.copy(a.d).transformDirection(arrows.matrixWorld);
      _x.copy(_d).addScaledVector(_f, -_d.dot(_f)); // flow direction projected onto the screen plane
      const len = _x.length();
      if (len < 1e-3) _x.copy(camera.up).addScaledVector(_f, -camera.up.dot(_f));
      _x.normalize();
      const k = Math.min(1, Math.max(0.4, len)); // flow mostly along the view axis: draw a shorter arrow instead of a degenerate one
      _y.crossVectors(_z, _x);
      _m.makeBasis(_x.clone().multiplyScalar(k), _y.clone().multiplyScalar(k), _z).setPosition(_p);
      a.mesh.matrix.copy(_inv).multiply(_m);
      a.mesh.matrixWorldNeedsUpdate = true;
    });
  }
  FRONT_FANS.forEach((fy) => arrow([300, fy, 0], [-1, 0, 0], 0x2b6cff));
  if (TOP_INTAKE) {
    arrow([TOP_SLIT.x, 600, 0], [0, -1, 0], 0x2b6cff);
    TOP_FANS.forEach((fx) => arrow([fx, 600, 5], [0, -1, 0], 0x2b6cff));
  }
  else TOP_FANS.forEach((fx) => arrow([fx, 512, 5], [0, 1, 0], 0xff7a1a));
  arrow([-245, 369, 38], [-1, 0, 0], 0xff7a1a);
  // GPU cooler: fans draw case air up from below through the fins, exhaust leaves sideways and out the I/O bracket
  GPU_FANS.forEach((gx) => arrow([gx, 135, -6], [0, 1, 0], 0x2b6cff, 70));
  arrow([-84, 232, 62], [0, 0, 1], 0xff7a1a, 60);
  arrow([-84, 232, -70], [0, 0, -1], 0xff7a1a, 60);
  arrow([-240, 214, -6], [-1, 0, 0], 0xff7a1a, 60);
  // PSU: floor intake under the unit, rear panel exhaust
  arrow([-166, -75, -10], [0, 1, 0], 0x2b6cff, 70);
  arrow([PSU_BOX.rearX, 58, -10], [-1, 0, 0], 0xff7a1a, 60);

  function paintSlice(S: Scenario) {
    const img = hctx.createImageData(SLICE_W, SLICE_H);
    img.data.set(sliceImage(S.t));
    hctx.putImageData(img, 0, 0);
    heatTex.needsUpdate = true;
  }

  return { slice, pts, arrows, faceCamera, airStep, paintSlice };
}

export function PcModel() {
  const { group, kit } = usePc();
  const ov = useMemo(makeOverlays, []);
  const reduce = useMemo(prefersReducedMotion, []);
  const origEm = useRef(new Map<PcMat, { em: THREE.Color; ei: number }>());

  // Shadows: transparent materials do not cast.
  useEffect(() => {
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const mat = m.material as THREE.Material;
        m.castShadow = !(mat && mat.transparent);
        m.receiveShadow = true;
      }
    });
  }, [group]);

  // Part isolation (legacy applyPart)
  const part = useApp((s) => s.part);
  useEffect(() => {
    kit.pcMats.forEach((e) => {
      const dim = !!part && e.part !== part;
      // CPU isolation: the cooler sits right in front of the chip, so it vanishes entirely
      const gone = part === 'cpu' && e.part === 'cooler';
      e.m.transparent = dim ? true : e.t;
      e.m.opacity = gone ? 0 : dim ? Math.min(e.o, 0.06) : e.o;
      e.m.depthWrite = dim ? false : e.dw;
      e.m.needsUpdate = true;
    });
    // CPU isolation: hide the cooler and the ILM frame / load plate / lever so the IHS is unobstructed
    (Object.keys(kit.partMeshes) as (keyof typeof kit.partMeshes)[]).forEach((id) => {
      kit.partMeshes[id]!.forEach((m) => {
        m.visible = !(part === 'cpu' && (id === 'cooler' || (id === 'cpu' && m.userData.cover)));
      });
    });
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.castShadow = !((m.material as THREE.Material)?.transparent) && m.visible;
    });
  }, [part, kit, group]);

  // Heat tint (legacy applyHeat) and slice texture
  const heatOn = useApp((s) => s.heatOn);
  const scen = useApp((s) => s.scen);
  const scenarios = useApp((s) => s.scenarios);
  useEffect(() => {
    const store = origEm.current;
    kit.pcMats.forEach((e) => {
      let o = store.get(e);
      if (!o) { o = { em: e.m.emissive.clone(), ei: e.m.emissiveIntensity }; store.set(e, o); }
      const glowing = o.ei > 0.9 && o.em.r + o.em.g + o.em.b > 0.3;
      if (heatOn && !glowing) { e.m.emissive.copy(heatColor(partTemp(e.part, scenarios[scen].t))); e.m.emissiveIntensity = 0.6; }
      else { e.m.emissive.copy(o.em); e.m.emissiveIntensity = o.ei; }
    });
    if (heatOn) ov.paintSlice(scenarios[scen]);
  }, [heatOn, scen, scenarios, kit, ov]);

  useFrame(({ camera }, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    const st = useApp.getState();
    ov.slice.visible = st.heatOn;
    ov.pts.visible = st.airOn;
    ov.arrows.visible = st.airOn;
    if (st.airOn) ov.faceCamera(camera);
    if (reduce) return;
    const ff = 0.3 + st.scenarios[st.scen].fan;
    kit.spinners.forEach((sp) => { sp.o.rotation.y += sp.s * dt * ff; });
    if (st.airOn) ov.airStep(dt, st.scenarios[st.scen], st.resolved.psu.wattage);
  });

  return (
    <group scale={0.01} rotation-y={-0.3}>
      <primitive object={group} />
      <primitive object={ov.slice} />
      <primitive object={ov.pts} />
      <primitive object={ov.arrows} />
    </group>
  );
}
