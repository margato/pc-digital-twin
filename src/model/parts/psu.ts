import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { PartTag, Kit } from '../kit';
import type { Shared } from './shared';

/**
 * PSU 150 × 86 × 140 mm, centre (-166, 58, -10): modular face at x = -96 (front), AC inlet at the rear
 * (x = -236), fan grille underneath, spec label on the glass side. Generic ATX 3.1 modular unit, no logos.
 */
export function buildPsu(kit: Kit, g: THREE.Group, _shared: Shared): void {
  const { pm, rbox, box, inst, canvasTex, reg } = kit;
  const pu = { part: 'psu' } as PartTag;
  const CX = -166, CY = 58, CZ = -10;

  const merge = (geos: THREE.BufferGeometry[]) => mergeGeometries(geos.map((q) => (q.index ? q.toNonIndexed() : q)), false);
  const addMerged = (geos: THREE.BufferGeometry[], mat: THREE.Material) => {
    const m = new THREE.Mesh(merge(geos), mat);
    g.add(m);
    return reg(m, pu);
  };
  const at = (geo: THREE.BufferGeometry, x: number, y: number, z: number) => geo.translate(x, y, z);
  const bx = (w: number, h: number, d: number, x: number, y: number, z: number) => at(new THREE.BoxGeometry(w, h, d), x, y, z);

  const body = pm('psu', 0x1d1d20, { metalness: 0.4, roughness: 0.55 });
  const trim = pm('psu', 0x2b2c31, { metalness: 0.45, roughness: 0.5 });
  const dark = pm('psu', 0x0a0a0a, {});
  const steel = pm('psu', 0x8a8f96, { metalness: 0.7, roughness: 0.35 });
  const brass = pm('psu', 0x8a7240, { metalness: 0.8, roughness: 0.35 });
  const rubber = pm('psu', 0x0b0b0c, { roughness: 0.92, metalness: 0 });

  // Housing and cover seams (dark grooves around the shell halves)
  rbox(140, 86, 150, 4, body, CX, CY, CZ, g, pu);
  const seams: THREE.BufferGeometry[] = [];
  [-104, -228].forEach((x) => {
    seams.push(bx(0.9, 0.5, 150, x, 101.1, CZ), bx(0.9, 78, 0.5, x, CY, 65.1), bx(0.9, 78, 0.5, x, CY, -85.1));
  });
  addMerged(seams, pm('psu', 0x060607, { roughness: 0.8 }));

  // Spec label panel (generic: ruled cells, symbols and a barcode, no text or brand)
  const label = canvasTex(200, 100, (c) => {
    c.fillStyle = '#c8cbd0'; c.fillRect(0, 0, 200, 100);
    c.fillStyle = '#3a3d43'; c.fillRect(0, 0, 200, 14);
    c.strokeStyle = '#7a7e86'; c.lineWidth = 1;
    for (let r = 0; r < 5; r++) { c.beginPath(); c.moveTo(8, 24 + r * 9); c.lineTo(132, 24 + r * 9); c.stroke(); }
    c.fillStyle = '#5b5f67';
    for (let r = 0; r < 5; r++) c.fillRect(8, 20 + r * 9, 30 + (r * 17) % 40, 2);
    for (let i = 0; i < 4; i++) { c.strokeStyle = '#3a3d43'; c.strokeRect(144 + i * 12, 22, 10, 10); c.strokeRect(144 + i * 12, 36, 10, 10); }
    c.fillStyle = '#20232a';
    for (let i = 0; i < 46; i++) c.fillRect(10 + i * 2.6 + (i % 3) * 0.4, 72, 1 + (i % 4 === 0 ? 1 : 0), 20);
  });
  box(100, 50, 1, pm('psu', 0xffffff, { map: label, metalness: 0.1, roughness: 0.6 }), CX, CY, 65.5, g, pu);

  // Underside fan: concentric grille over a visible rotor (one grille mesh, one blade mesh)
  const gr: THREE.BufferGeometry[] = [];
  [24, 36, 48, 60].forEach((R) => gr.push(at(new THREE.TorusGeometry(R, 0.5, 5, 64).rotateX(Math.PI / 2), CX, 13, CZ)));
  for (let k = 0; k < 6; k++) gr.push(at(new THREE.BoxGeometry(122, 0.8, 1.2).rotateY(k * Math.PI / 6), CX, 13, CZ));
  addMerged(gr, pm('psu', 0x15151a, { metalness: 0.6, roughness: 0.4 }));
  const fanDisc = new THREE.Mesh(new THREE.CylinderGeometry(62, 62, 0.3, 48), pm('psu', 0x040405, { roughness: 0.9 }));
  fanDisc.position.set(CX, 14.85, CZ); g.add(fanDisc); reg(fanDisc, pu);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 1.8, 32), pm('psu', 0x17171a, { roughness: 0.5 }));
  hub.position.set(CX, 14.1, CZ); g.add(hub); reg(hub, pu);
  const blades: number[][] = [];
  for (let k = 0; k < 11; k++) { const a = k * Math.PI * 2 / 11; blades.push([CX + Math.cos(a) * 38, 14.3, CZ + Math.sin(a) * 38, 0, -a, 0]); }
  inst(new THREE.BoxGeometry(26, 0.6, 9).rotateX(0.15), pm('psu', 0x26262b, { roughness: 0.5 }), blades, g, pu);

  // Rubber feet and screw heads (top cover, rear corners, modular plate corners)
  inst(new THREE.CylinderGeometry(6, 6.5, 3, 16), rubber, [[-226, 13.5, -75], [-106, 13.5, -75], [-226, 13.5, 55], [-106, 13.5, 55]], g, pu);
  const hz = Math.PI / 2, sc: number[][] = [];
  [[-226, -75], [-106, -75], [-226, 55], [-106, 55]].forEach((p) => sc.push([p[0], 101.2, p[1]]));
  [[26, -66.5], [26, 54.5], [90, -66.5], [90, 54.5]].forEach((p) => sc.push([-95.2, p[0], p[1], 0, 0, hz]));
  [[23, -77], [23, 57], [93, -77], [93, 57]].forEach((p) => sc.push([-236.5, p[0], p[1], 0, 0, hz]));
  inst(new THREE.CylinderGeometry(2.6, 2.6, 1.2, 14), steel, sc, g, pu);

  // Rear face: AC inlet, rocker switch and exhaust slots
  const poly = (w: number, h: number, c: number[]) => {
    const x = w / 2, y = h / 2;
    const raw: number[][] = [[-x + c[2], -y], [x - c[3], -y], [x, -y + c[3]], [x, y - c[1]], [x - c[1], y], [-x + c[0], y], [-x, y - c[0]], [-x, -y + c[2]]];
    const pts = raw.filter((p, i) => { const q = raw[(i + raw.length - 1) % raw.length]; return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) > 1e-6; });
    const sh = new THREE.Shape(); pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
    return sh;
  };
  /** Extrudes a (u, v) profile into the (z, y) plane; dir +1 grows toward +x, -1 toward -x. */
  const side = (sh: THREE.Shape, depth: number, dir: number, x: number, y: number, z: number) =>
    at(new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }).rotateY(dir * Math.PI / 2), x, y, z);
  addMerged([side(poly(36, 30, [2, 2, 2, 2]), 1.4, -1, -236, 72, 38)], trim);
  addMerged([side(poly(27, 19, [0, 0, 4, 4]), 1.9, -1, -236, 72, 38)], dark);
  box(1.2, 24, 17, trim, -236.6, 34, 38, g, pu);
  const rocker = box(2.2, 15, 10, pm('psu', 0x050506, { roughness: 0.4 }), -237.4, 34, 38, g, pu);
  rocker.rotation.z = 0.18;
  const vents: number[][] = [];
  for (let r = 0; r < 11; r++) for (let c = 0; c < 9; c++) vents.push([-236.1, 27 + r * 6.4, -70 + c * 9.5 + (r % 2) * 4.75]);
  inst(new THREE.BoxGeometry(0.5, 3, 7), dark, vents, g, pu);

  // Modular face: plate, colour-coded sockets with keyed profiles, pin contacts
  box(0.6, 74, 128, trim, -95.7, CY, -6, g, pu);
  interface Sock { y: number; z: number; w: number; h: number; c: number[]; col: number; cols: number; rows: number; pz: number; py: number }
  const socks: Sock[] = [
    { y: 75, z: -40, w: 34, h: 13, c: [3, 3, 0, 0], col: 0, cols: 12, rows: 2, pz: 2.6, py: 3.6 },   // 24-pin 20+4
    { y: 75, z: 0, w: 22, h: 12, c: [3, 0, 0, 0], col: 1, cols: 4, rows: 2, pz: 4.2, py: 4 },         // 8-pin EPS
    { y: 75, z: 35, w: 22, h: 9, c: [0, 0, 2, 2], col: 2, cols: 6, rows: 2, pz: 2.8, py: 2.6 },       // 12V-2x6
    { y: 35, z: -50, w: 22, h: 12, c: [0, 3, 3, 0], col: 2, cols: 4, rows: 2, pz: 4.2, py: 4 },       // PCIe 6+2
    { y: 35, z: -20, w: 22, h: 12, c: [0, 3, 3, 0], col: 2, cols: 4, rows: 2, pz: 4.2, py: 4 },
    { y: 35, z: 10, w: 22, h: 12, c: [0, 3, 3, 0], col: 2, cols: 4, rows: 2, pz: 4.2, py: 4 },
    { y: 35, z: 40, w: 20, h: 8, c: [0, 0, 0, 2.5], col: 3, cols: 4, rows: 1, pz: 4, py: 0 }          // peripheral
  ];
  const bezGeos: THREE.BufferGeometry[][] = [[], [], [], []], sockGeos: THREE.BufferGeometry[] = [], pinGeos: THREE.BufferGeometry[] = [];
  socks.forEach((s) => {
    bezGeos[s.col].push(side(poly(s.w + 3, s.h + 3, s.c.map((v) => v + 0.5)), 1.2, 1, -96, s.y, s.z));
    sockGeos.push(side(poly(s.w, s.h, s.c), 2.5, 1, -96, s.y, s.z));
    for (let i = 0; i < s.cols; i++) for (let j = 0; j < s.rows; j++) {
      pinGeos.push(bx(0.5, 1.7, 1.7, -93.3, s.y + (j - (s.rows - 1) / 2) * s.py, s.z + (i - (s.cols - 1) / 2) * s.pz));
    }
  });
  [0xa4a8ae, 0xb09a45, 0x4d6e9b, 0x5a8a5e].forEach((col, i) => addMerged(bezGeos[i], pm('psu', col, { roughness: 0.55, metalness: 0.2 })));
  addMerged(sockGeos, pm('psu', 0x101012, { roughness: 0.6 }));
  [-7, 0, 7].forEach((dz) => pinGeos.push(bx(0.6, 5, 1.5, -238.2, 72, 38 + dz)));
  addMerged(pinGeos, brass);

  // 12V-2x6 cable: 6 × 2 sleeved wires as a flat ribbon, one gentle bend (R ≈ 22 mm) before the plug
  const ctrl = [
    [-93.5, 75, 35], [-72, 75, 35], [-56, 80, 35], [-46, 98, 36], [-42, 128, 40], [-40, 152, 54], [-32, 182, 84], [-38, 203, 98],
    [-46, 217.7, 102], [-48, 228.7, 99.05], [-48, 236.75, 91], [-48, 239.7, 80], [-48, 239.7, 63.5]
  ].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
  const NS = 90, Wa = new THREE.Vector3(0, 0, 1), Wb = new THREE.Vector3(1, 0, 0);
  const frames: { p: THREE.Vector3; W: THREE.Vector3; N: THREE.Vector3; T: THREE.Vector3 }[] = [];
  for (let i = 0; i <= NS; i++) {
    const u = i / NS, p = curve.getPointAt(u), T = curve.getTangentAt(u).normalize();
    const s = Math.min(1, Math.max(0, (u - 0.22) / 0.3)), k = s * s * (3 - 2 * s);
    const W = Wa.clone().lerp(Wb, k); W.sub(T.clone().multiplyScalar(W.dot(T))).normalize();
    frames.push({ p, W, N: T.clone().cross(W), T });
  }
  const wires: THREE.BufferGeometry[] = [];
  for (let wc = 0; wc < 6; wc++) for (let wr = 0; wr < 2; wr++) {
    const pts = frames.map((f) => f.p.clone().addScaledVector(f.W, (wc - 2.5) * 2.3).addScaledVector(f.N, (wr - 0.5) * 2.4));
    wires.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), NS, 1.1, 6, false));
  }
  const braid = canvasTex(32, 32, (c) => {
    c.fillStyle = '#0d0d0e'; c.fillRect(0, 0, 32, 32); c.strokeStyle = '#2b2b2f'; c.lineWidth = 2;
    for (let i = -32; i < 64; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 32, 32); c.stroke(); }
  });
  braid.wrapS = braid.wrapT = THREE.RepeatWrapping; braid.repeat.set(26, 2);
  addMerged(wires, pm('psu', 0xffffff, { map: braid, roughness: 0.85, metalness: 0 }));

  // Cable combs holding the ribbon flat
  const combs: THREE.BufferGeometry[] = [];
  [0.1, 0.3, 0.52, 0.8].forEach((u) => {
    const f = frames[Math.round(u * NS)], m4 = new THREE.Matrix4().makeBasis(f.W, f.N, f.T).setPosition(f.p);
    combs.push(new RoundedBoxGeometry(15.8, 7, 2.4, 3, 1).applyMatrix4(m4));
  });
  addMerged(combs, pm('psu', 0x151517, { roughness: 0.5, metalness: 0.1 }));

  // Plug housings: PSU end (over the 12V-2x6 socket) and GPU end, each with boot and latch ridge
  const rb = (w: number, h: number, d: number, r: number, x: number, y: number, z: number) => at(new RoundedBoxGeometry(w, h, d, 3, r), x, y, z);
  const plugs = [
    rb(16, 12.6, 25.5, 1.4, -85.8, 75, 35), rb(11, 1.8, 10, 0.5, -86, 82, 35), rb(3, 2.4, 10, 0.5, -91.5, 82.6, 35), rb(6, 10, 20, 1.6, -75.5, 75, 35),
    rb(24.4, 12, 15, 1.4, -48, 239.7, 71.3), rb(8, 1.8, 10, 0.5, -48, 246.4, 69), rb(8, 2.4, 3, 0.5, -48, 246.8, 63.8), rb(18, 9, 4, 1.4, -48, 239.7, 80.8)
  ];
  addMerged(plugs, pm('psu', 0x0e0e10, { roughness: 0.55 }));
}
