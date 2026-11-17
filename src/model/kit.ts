import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { PartId } from '../data/parts';

export interface PartTag { part: PartId; focus?: boolean; cover?: boolean }
export interface PcMat { part: PartId; m: THREE.MeshStandardMaterial; o: number; t: boolean; dw: boolean }
export interface Spinner { o: THREE.Object3D; s: number }
export interface DimSpec { a: number[]; b: number[]; c: number[]; t: string }
export type MatOpts = THREE.MeshPhysicalMaterialParameters;
export type Pose = [number, number, number, number?, number?, number?];

/**
 * Everything a model builder registers while it builds: pickable meshes, per-part materials (for
 * isolation and heat tinting), spinning rotors and dimension callouts. One kit per built model.
 */
export function createKit() {
  const pickables: THREE.Mesh[] = [];
  const partMeshes: Partial<Record<PartId, THREE.Mesh[]>> = {};
  /** Meshes flagged `focus`: the hero object of a part (camera frames only these when the part is isolated). */
  const focusMeshes: Partial<Record<PartId, THREE.Mesh[]>> = {};
  const pcMats: PcMat[] = [];
  const spinners: Spinner[] = [];
  const dims: DimSpec[] = [];
  const geoCache: Record<string, THREE.BufferGeometry> = {};

  function std(color: number, opts?: MatOpts) {
    const base = { roughness: 0.6, metalness: 0.25, ...opts };
    // Painted/plastic glossy surfaces get a clearcoat lacquer layer; bare metals and matte parts do not.
    const glossy = base.roughness! < 0.4 && base.metalness! < 0.7;
    const m = new THREE.MeshPhysicalMaterial({
      color, envMapIntensity: 0.55, clearcoat: glossy ? 0.6 : 0, clearcoatRoughness: 0.12, ...base,
    });
    m.color.convertSRGBToLinear();
    m.emissive.convertSRGBToLinear();
    return m;
  }
  /** Standard material that belongs to a part, so isolation and heat tint can find it. */
  function pm(part: PartId, color: number, opts?: MatOpts) {
    const m = std(color, opts);
    pcMats.push({ part, m, o: m.opacity, t: m.transparent, dw: m.depthWrite });
    return m;
  }
  function reg<T extends THREE.Mesh>(mesh: T, ud?: PartTag | null): T {
    if (!ud) return mesh;
    mesh.userData = ud;
    pickables.push(mesh);
    (partMeshes[ud.part] ||= []).push(mesh);
    if (ud.focus) (focusMeshes[ud.part] ||= []).push(mesh);
    return mesh;
  }
  function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D, ud?: PartTag | null) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return reg(m, ud);
  }
  function rbox(w: number, h: number, d: number, r: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D, ud?: PartTag | null) {
    const rr = Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01);
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 10, rr), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return reg(m, ud);
  }
  /** Bakes repeated geometry into one merged mesh (fewer draw calls). */
  function inst(geo: THREE.BufferGeometry, mat: THREE.Material, list: readonly (readonly number[])[], parent: THREE.Object3D, ud?: PartTag | null) {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
    const parts = list.map((pt) => {
      e.set(pt[3] || 0, pt[4] || 0, pt[5] || 0); q.setFromEuler(e); v.set(pt[0], pt[1], pt[2]);
      m4.compose(v, q, sc);
      return geo.clone().applyMatrix4(m4);
    });
    const m = new THREE.Mesh(mergeGeometries(parts, false), mat);
    parent.add(m);
    return reg(m, ud);
  }
  function rrShape(w: number, h: number, r: number) {
    const sh = new THREE.Shape(), x = -w / 2, y = -h / 2;
    sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
    sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
    sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
    return sh;
  }
  function cyl(r: number, h: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D, ud?: PartTag | null, seg?: number) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, Math.max(seg || 64, 24)), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return reg(m, ud);
  }
  function torus(R: number, tube: number, mat: THREE.Material, parent: THREE.Object3D, ud?: PartTag | null) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 16, 128), mat);
    m.rotation.x = Math.PI / 2;
    parent.add(m);
    return reg(m, ud);
  }
  function tube(points: number[][], r: number, mat: THREE.Material, parent: THREE.Object3D, ud?: PartTag | null) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, r < 2 ? 64 : 160, r, r < 2 ? 10 : 24, false), mat);
    parent.add(m);
    return reg(m, ud);
  }
  function edges(g: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, color: number) {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color }));
    e.position.set(x, y, z);
    g.add(e);
    return e;
  }

  function bladeGeo(R: number) {
    const k = 'b' + R;
    if (geoCache[k]) return geoCache[k];
    const r0 = R * 0.3, sh = new THREE.Shape();
    sh.moveTo(r0, -0.14 * R);
    sh.quadraticCurveTo(0.62 * R, -0.02 * R, 0.97 * R, -0.16 * R);
    sh.quadraticCurveTo(1.03 * R, 0.12 * R, 0.95 * R, 0.36 * R);
    sh.quadraticCurveTo(0.6 * R, 0.34 * R, r0, 0.14 * R);
    sh.lineTo(r0, -0.14 * R);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2, curveSegments: 28 });
    geo.translate(0, 0, -0.6);
    geo.rotateX(-Math.PI / 2);
    return (geoCache[k] = geo);
  }
  function frameGeo(sz: number, R: number, T: number) {
    const k = `f${sz}_${R}_${T}`;
    if (geoCache[k]) return geoCache[k];
    const sh = rrShape(sz, sz, 8);
    const hole = new THREE.Path(); hole.absarc(0, 0, R + 3, 0, Math.PI * 2, true); sh.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 96 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -T / 2, 0);
    return (geoCache[k] = geo);
  }
  interface FanMats { frame: THREE.Material; hub: THREE.Material; blade: THREE.Material; cap?: THREE.Material }
  interface FanOpts { square?: number; glow?: THREE.Material; blades?: number; speed?: number }
  /** A fan with its axis along local y. R = rotor radius, T = thickness. Registers its rotor as a spinner. */
  function fan(R: number, T: number, mats: FanMats, ud: PartTag, opts: FanOpts = {}) {
    const g = new THREE.Group();
    if (opts.square) {
      const fr = new THREE.Mesh(frameGeo(opts.square, R, T), mats.frame);
      g.add(fr); reg(fr, ud);
      for (let q = 0; q < 4; q++) {
        const sp = new THREE.Group(); sp.rotation.y = q * Math.PI / 2 + Math.PI / 4; g.add(sp);
        box(R * 0.72, 2, 3, mats.frame, R * 0.3 + R * 0.36, T / 2 - 1, 0, sp, ud);
      }
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach((c) => {
        cyl(2.6, T + 0.2, mats.hub, c[0] * (opts.square! / 2 - 7.5), 0, c[1] * (opts.square! / 2 - 7.5), g, ud, 12);
      });
    }
    const ring = torus(R + 2.5, opts.glow ? 1.8 : 1.4, opts.glow || mats.frame, g, ud);
    ring.position.y = -T / 2 + 1;
    const rotor = new THREE.Group();
    g.add(rotor);
    cyl(R * 0.3, T * 0.75, mats.hub, 0, 0, 0, rotor, ud, 32);
    cyl(R * 0.22, 0.8, mats.cap || mats.hub, 0, -T * 0.375 - 0.4, 0, rotor, ud, 32);
    const n = opts.blades || 7;
    for (let i = 0; i < n; i++) {
      const pivot = new THREE.Group();
      pivot.rotation.y = (i / n) * Math.PI * 2;
      rotor.add(pivot);
      const bl = new THREE.Mesh(bladeGeo(R), mats.blade);
      bl.rotation.x = 0.36;
      pivot.add(bl); reg(bl, ud);
    }
    spinners.push({ o: rotor, s: opts.speed || 9 });
    return g;
  }

  function addDims(specs: DimSpec[]) { dims.push(...specs); }

  function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const k = 2, c = document.createElement('canvas'); c.width = w * k; c.height = h * k;
    const ctx = c.getContext('2d')!; ctx.scale(k, k);
    draw(ctx);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  return { pickables, partMeshes, focusMeshes, pcMats, spinners, dims, std, pm, reg, box, rbox, inst, rrShape, cyl, torus, tube, edges, fan, addDims, canvasTex };
}

export type Kit = ReturnType<typeof createKit>;
