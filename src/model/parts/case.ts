import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { PartTag, Kit } from '../kit';
import type { Shared } from './shared';

/**
 * NZXT H7 (CM-H71BB, black), modelled from a local reference photo set (not committed) (1000 px webp, no scale bar).
 * "photo NN" comments below use this order (files sorted by name):
 *   01 three-quarter front, glass side · 02 glass side with build · 03 front, blank plate · 04 top, mesh field
 *   05 top front I/O · 06 solid side, 3/4 view, mesh strip at front edge · 07 glass panel swung open
 *   08 solid side, straight-on elevation (mesh strip at front) · 09 rear, slots and PSU opening
 *   10 interior through glass, front fan bracket · 11 glass side, dark, cable bar with NZXT logo
 *   12 exploded frame, top panel and filter panels lifted off · 13 frame with side fan and cable arm · 14 glass side with 360 mm radiator
 */
export function buildCase(kit: Kit, g: THREE.Group, shared: Shared): void {
  const { pm, box, rbox, edges, fan, inst, canvasTex, reg } = kit;
  const { D, H, W, t, fy, hy, hh } = shared;
  const cu = { part: 'case' } as PartTag;
  const shell = pm('case', 0x0d0d0e, { roughness: 0.7, metalness: 0.4 });
  const matte = pm('case', 0x121214, { roughness: 0.82, metalness: 0.3 });
  const dark = pm('case', 0x050505, { roughness: 0.85, metalness: 0.1 });
  const rubber = pm('case', 0x0a0a0a, { roughness: 0.95, metalness: 0 });
  const steel = pm('case', 0x3a3c41, { metalness: 0.85, roughness: 0.3 });
  const bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cg = (r: number, h: number, n = 14) => new THREE.CylinderGeometry(r, r, h, n);

  /** Staggered round-hole perforation (tile = tileMm square, holes on a ~tileMm/2 pitch), repeated over w x h mm. */
  function meshMat(w: number, h: number, tileMm: number, holeMm: number, base = '#1d1d20') {
    const tex = canvasTex(64, 64, function (c) {
      c.fillStyle = base; c.fillRect(0, 0, 64, 64);
      c.fillStyle = '#020203';
      const r = (holeMm / tileMm) * 64;
      for (let j = 0; j < 4; j++) for (let i = -1; i < 3; i++) {
        c.beginPath(); c.arc(16 + (j % 2) * 16 + i * 32, 8 + j * 16, r, 0, Math.PI * 2); c.fill();
      }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(w / tileMm, h / tileMm);
    return pm('case', 0xffffff, { map: tex, roughness: 0.75, metalness: 0.35 });
  }
  const plane = (w: number, h: number, mat: THREE.Material, x: number, y: number, z: number, ry = 0, rx = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); g.add(m); return reg(m, cu);
  };

  // ---- main shell: -z solid steel side, top (blank steel with a mesh field), floor, front and rear walls ----
  box(D, hh, t, shell, 0, hy, -W / 2 + t / 2, g, cu);
  box(D, t, W, shell, 0, fy + t / 2, 0, g, cu);
  // top: closed steel panel (photo 04/05); the perforated field below sits on it, the front strip keeps the I/O
  box(D, t, W, shell, 0, H - t / 2, 0, g, cu);
  box(t, hh, W, shell, D / 2 - t / 2, hy, 0, g, cu);
  box(t, hh, W, shell, -D / 2 + t / 2, hy, 0, g, cu);
  // top mesh field (photo 04/05): one continuous round-hole perforation from the rear almost to the front,
  // then a solid strip carrying the I/O. No separate intake slit is visible in any photo.
  const tmx0 = -212, tmx1 = 196;
  plane(tmx1 - tmx0, 188, meshMat(tmx1 - tmx0, 188, 16, 1.7), (tmx0 + tmx1) / 2, H + 0.2, 0, 0, -Math.PI / 2);
  inst(bx(tmx1 - tmx0 + 6, 0.8, 3), matte, [[(tmx0 + tmx1) / 2, H + 0.4, 96], [(tmx0 + tmx1) / 2, H + 0.4, -96]], g, cu);
  inst(bx(3, 0.8, 194), matte, [[tmx0 - 3, H + 0.4, 0], [tmx1 + 2, H + 0.4, 0]], g, cu);

  // feet: wide, low, rounded blocks at the four corners (photo 03/08), with rubber pads
  const feet = pm('case', 0x1a1a1b, {});
  inst(new RoundedBoxGeometry(60, fy, 30, 3, 3), feet, [[-188, fy / 2, -90], [-188, fy / 2, 90], [188, fy / 2, -90], [188, fy / 2, 90]], g, cu);

  // ---- tempered glass (+z): stops short of the front column, like photo 01/12; not pickable ----
  const gx1 = 190, gw = gx1 + D / 2, gcx = (gx1 - D / 2) / 2;
  const glass = pm('case', 0x1c232b, { transparent: true, opacity: 0.18, roughness: 0.1, metalness: 0, depthWrite: false });
  box(gw, hh, 2, glass, gcx, hy, W / 2 - 1, g, null);
  // front column of the +z side: solid steel with a vertical mesh air gap
  box(D / 2 - gx1, hh, 2, shell, (gx1 + D / 2) / 2, hy, W / 2 - 1, g, cu);
  // PSU shroud deck and front face
  box(D - 2 * t, 3, W - 2 * t, shell, 0, 125, 0, g, cu);
  const shroudFace = pm('case', 0x0d0d0e, { transparent: true, opacity: 0.5, depthWrite: false });
  box(D - 2 * t, 125 - fy, 2, shroudFace, 0, fy + (125 - fy) / 2, W / 2 - 6, g, null);
  edges(g, D, hh, W, 0, hy, 0, 0x3a3a3a);

  // ---- fans (kit spinners; positions fixed by the airflow model) ----
  const caseFan = { frame: pm('case', 0x161618, { roughness: 0.6 }), hub: pm('case', 0x202023, {}), blade: pm('case', 0x2a2a2e, { roughness: 0.5 }) };
  const rear = fan(55, 25, caseFan, cu, { square: 120, speed: 6 });
  rear.rotation.z = Math.PI / 2; rear.position.set(-D / 2 + t + 12.5, 369, 38); g.add(rear);
  [432, 310, 188].forEach(function (y) {
    const front = fan(55, 25, caseFan, cu, { square: 120, speed: 6 });
    front.rotation.z = Math.PI / 2; front.position.set(D / 2 - t - 12.5, y, 0); g.add(front);
  });
  // front fan bracket (photo 10/11): side rails and cross bars between the three 120 mm positions
  const ffx = D / 2 - t - 25;
  inst(bx(4, 372, 8), matte, [[ffx, 310, 67], [ffx, 310, -67]], g, cu);
  inst(bx(4, 5, 134), matte, [[ffx, 127, 0], [ffx, 249, 0], [ffx, 371, 0], [ffx, 493, 0]], g, cu);
  // top radiator rails
  inst(bx(D - 30, 8, 5), matte, [[0, H - t - 4, 92], [0, H - t - 4, -92]], g, cu);

  // cable-management bar: tall pillar beside the shroud, with its slot, band, cap and flared foot (photo 11, NZXT logo on the bar)
  box(55, 315, 30, pm('case', 0x111113, { roughness: 0.65, metalness: 0.4 }), 58, 282.5, -88, g, cu);
  inst(bx(5.5, 150, 0.8), dark, [[58, 330, -72.7]], g, cu);
  inst(bx(55.6, 22, 30.4), matte, [[58, 250, -88]], g, cu);
  inst(new RoundedBoxGeometry(63, 6, 38, 1.5, 2), matte, [[58, 442, -88]], g, cu);
  inst(new RoundedBoxGeometry(66, 10, 36, 1.5, 2), matte, [[58, 131, -88]], g, cu);
  const ties: number[][] = [];
  for (let i = 0; i < 8; i++) ties.push([58, 150 + i * 38, -72.6]);
  inst(bx(9, 8, 2.5), matte, ties, g, cu);
  inst(bx(5, 4, 2.2), dark, ties.map((p) => [p[0], p[1], p[2] + 0.5]), g, cu);

  // ---- rear (photo 09): 7 expansion slots, I/O cut-out, hex fan grille, top vent strip, PSU opening ----
  const rearMat = pm('case', 0x26272b, { metalness: 0.6, roughness: 0.4 });
  // slot block: photo 09 puts it at z about -28 (span about -85..28) and y about 145..275
  for (let si = 0; si < 7; si++) box(1.5, 14, 113, rearMat, -D / 2 - 0.8, 268 - si * 20.3, -28, g, cu);
  box(1.5, 160, 44, pm('case', 0x2f3136, { metalness: 0.5, roughness: 0.5 }), -D / 2 - 0.8, 365, -62, g, cu);
  for (let pi = 0; pi < 10; pi++) box(1, 6, 12, dark, -D / 2 - 1.6, 302 + pi * 13, -62, g, cu);
  // PSU opening (photo 09): about y 28..113 and z -72..76
  box(1.5, 85, 148, pm('case', 0x18191c, { metalness: 0.5, roughness: 0.5 }), -D / 2 - 0.8, 70, 2, g, cu);
  box(1, 22, 30, dark, -D / 2 - 1.6, 58, 40, g, cu);
  const hexTex = canvasTex(124, 124, function (c) {
    c.fillStyle = '#18181b'; c.beginPath(); c.arc(62, 62, 62, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#020203';
    for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) {
      const x = 62 + i * 8 + (j % 2) * 4, y = 62 + j * 6.93;
      if (Math.hypot(x - 62, y - 62) > 53) continue;
      c.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; c.lineTo(x + 3.5 * Math.cos(a), y + 3.5 * Math.sin(a)); }
      c.closePath(); c.fill();
    }
    c.strokeStyle = '#2a2b30'; c.lineWidth = 2.5; c.beginPath(); c.arc(62, 62, 58, 0, Math.PI * 2); c.stroke();
  });
  const grille = new THREE.Mesh(new THREE.CircleGeometry(60, 48), pm('case', 0xffffff, { map: hexTex, roughness: 0.7, metalness: 0.4, transparent: true }));
  grille.rotation.y = -Math.PI / 2; grille.position.set(-D / 2 - 1.8, 369, 38); g.add(grille); reg(grille, cu);
  inst(bx(1, 3, 12), dark, [[1, 1], [1, -1], [-1, 1], [-1, -1]].map((c) => [-D / 2 - 1.5, 369 + c[0] * 55, 38 + c[1] * 55, c[0] * c[1] * Math.PI / 4]), g, cu);
  plane(196, 22, meshMat(196, 22, 16, 1.7), -D / 2 - 0.9, 487, 0, -Math.PI / 2);
  inst(bx(1, 150, 6), dark, [[-D / 2 - 1.6, 207, 71]], g, cu);
  const vents: number[][] = [];
  for (let si = 0; si < 7; si++) for (let k = -2; k <= 2; k++) vents.push([-D / 2 - 1.7, 268 - si * 20.3, -28 + k * 18]);
  inst(bx(0.8, 8, 3), dark, vents, g, cu);
  const screws: number[][] = [];
  for (let si = 0; si < 7; si++) screws.push([-D / 2 - 1.8, 268 - si * 20.3, 32, 0, 0, Math.PI / 2]);
  inst(cg(3.5, 2.2, 16), steel, screws, g, cu);
  inst(bx(1.4, 168, 2), matte, [[-D / 2 - 1.3, 365, -39.5], [-D / 2 - 1.3, 365, -84.5]], g, cu);
  // PSU intake filter on the underside
  box(150, 1, 140, matte, -165, fy - 0.5, -10, g, cu);
  plane(144, 134, meshMat(144, 134, 6, 0.9), -165, fy - 1.1, -10, 0, Math.PI / 2);

  // ---- front (photo 03): blank steel plate, air enters through the vertical mesh gaps on the side panels ----
  rbox(2.5, hh - 8, W - 4, 1.5, shell, D / 2 + 1.25, hy - 1, 0, g, cu);
  inst(bx(1, hh - 14, 0.6), dark, [[D / 2 + 2.6, hy - 1, W / 2 - 3.5], [D / 2 + 2.6, hy - 1, -W / 2 + 3.5]], g, cu);
  inst(bx(1, 0.6, W - 14), dark, [[D / 2 + 2.6, fy + 4, 0], [D / 2 + 2.6, H - 8, 0]], g, cu);
  // side mesh gaps (photo 08): 36 x 465 mm, recessed behind a thin frame, on both sides near the front
  const sgx = 211, sgh = hh - 30;
  const sgMat = meshMat(34, sgh, 6, 0.9);
  [1, -1].forEach(function (k) {
    const zf = k * (W / 2);
    box(38, sgh + 4, 0.8, matte, sgx, hy, zf + k * 0.4, g, cu);
    plane(34, sgh, sgMat, sgx, hy, zf + k * 0.9, k > 0 ? 0 : Math.PI);
  });

  // ---- top-front I/O (photo 05): audio, USB-C, 2x USB-A and a round power button, flush on the top deck ----
  const ioX = 227, ioY = H + 1.2;
  // solid front strip across the full width, between the top mesh and the front edge (photo 04/05)
  rbox(18, 1.2, W - 10, 0.5, matte, ioX - 2, H + 0.6, 0, g, cu);
  // order along the front edge, glass side (+z) to solid side (-z): audio, USB-C, 2x USB-A, power (photo 05)
  inst(bx(4.5, 0.8, 8.5), dark, [[ioX, ioY, -17]], g, cu);
  inst(bx(5, 0.8, 13), dark, [[ioX, ioY, -33], [ioX, ioY, -49]], g, cu);
  inst(bx(3, 0.9, 10), pm('case', 0x2d2b66, { roughness: 0.5 }), [[ioX, ioY + 0.05, -33], [ioX, ioY + 0.05, -49]], g, cu);
  inst(cg(2.6, 1, 20), steel, [[ioX, ioY, -4]], g, cu);
  inst(cg(1.4, 1.1, 12), dark, [[ioX, ioY + 0.05, -4]], g, cu);
  inst(cg(6.5, 1.6, 32), matte, [[ioX, ioY + 0.4, -72]], g, cu);
  inst(new THREE.TorusGeometry(6.8, 0.4, 6, 32), dark, [[ioX, ioY + 0.3, -72, Math.PI / 2]], g, cu);

  // ---- PSU shroud (photo 10/12/13): perforated deck at the rear, raised front step, cut-outs, blank logo plate ----
  plane(280, 175, meshMat(280, 175, 16, 1.7), -92, 126.55, 0, 0, -Math.PI / 2);
  inst(bx(120, 0.6, 40), dark, [[-70, 126.7, 50]], g, cu);
  inst(bx(150, 0.6, 2), dark, [[-70, 126.8, 90], [-70, 126.8, 100], [-70, 126.8, 80]], g, cu);
  rbox(150, 10, 190, 2.5, matte, 160, 131.5, 0, g, cu);
  inst(bx(100, 0.6, 3), dark, [[160, 136.7, 60], [160, 136.7, -60]], g, cu);
  rbox(70, 26, 1.2, 2, matte, 58, 113, 110.4, g, cu);
  rbox(64, 20, 0.6, 1.5, dark, 58, 113, 111.1, g, cu);

  // ---- tray / inner face of the -z side (photo 10/12): CPU cut-out frame, grommet holes, cable slot ----
  const tz = -W / 2 + t + 0.3;
  rbox(150, 124, 0.6, 3, dark, -92, 354, tz, g, cu);
  rbox(156, 130, 0.5, 4, matte, -92, 354, tz - 0.1, g, cu);
  inst(cg(3, 0.8, 10), dark, [[-205, 440, tz, Math.PI / 2], [-92, 440, tz, Math.PI / 2], [10, 440, tz, Math.PI / 2], [-205, 220, tz, Math.PI / 2], [10, 220, tz, Math.PI / 2], [-205, 150, tz, Math.PI / 2], [-92, 150, tz, Math.PI / 2]], g, cu);
  inst(new RoundedBoxGeometry(6, 70, 0.8, 0.3, 2.6), dark, [[-31, 300, tz], [-31, 205, tz]], g, cu);
  inst(new RoundedBoxGeometry(14, 40, 2.5, 1, 1.2), rubber, [[140, 330, tz + 0.8], [140, 220, tz + 0.8], [-120, 470, tz + 0.8]], g, cu);

  // ---- edges: rolled corner posts, top rim, panel seams ----
  inst(new RoundedBoxGeometry(5, hh, 5, 3, 2.2), matte, [[D / 2, hy, W / 2 - 2], [D / 2, hy, -W / 2 + 2], [-D / 2, hy, W / 2 - 2], [-D / 2, hy, -W / 2 + 2]], g, cu);
  inst(new RoundedBoxGeometry(5, 5, W, 3, 2.2), matte, [[D / 2, H - 2.5, 0], [-D / 2, H - 2.5, 0]], g, cu);
  inst(new RoundedBoxGeometry(D, 5, 5, 3, 2.2), matte, [[0, H - 2.5, W / 2 - 2], [0, H - 2.5, -W / 2 + 2]], g, cu);
  const sz = -W / 2 - 0.15;
  inst(bx(D - 14, 0.5, 0.4), dark, [[0, H - 14, sz], [0, fy + 10, sz]], g, cu);
  inst(bx(0.5 + 0, hh - 24, 0.4), dark, [[-D / 2 + 7, hy, sz]], g, cu);

  // glass black frit border and rubber edge trim (no fasteners visible in the photos)
  const fritTex = canvasTex(gw, hh, function (c) {
    c.fillStyle = '#050506'; c.fillRect(0, 0, gw, hh);
    c.clearRect(18, 18, gw - 36, hh - 36);
    for (let i = 0; i < 700; i++) { const a = Math.random() * (gw - 36), b = Math.random() * (hh - 36); const e = Math.min(a, gw - 36 - a, b, hh - 36 - b); if (e < 14 && Math.random() < 0.5 * (1 - e / 14)) c.fillRect(18 + a, 18 + b, 1.6, 1.6); }
  });
  const frit = new THREE.Mesh(new THREE.PlaneGeometry(gw - 2, hh - 2), pm('case', 0xffffff, { map: fritTex, transparent: true, roughness: 0.2, metalness: 0, depthWrite: false }));
  frit.position.set(gcx, hy, W / 2 + 0.15); g.add(frit); reg(frit, null);
  inst(bx(gw, 1.5, 1.5), rubber, [[gcx, fy + 1, W / 2 + 0.6], [gcx, H - 1, W / 2 + 0.6]], g, cu);
  inst(bx(1.5, hh, 1.5), rubber, [[gx1 - 1, hy, W / 2 + 0.6], [-D / 2 + 1, hy, W / 2 + 0.6]], g, cu);
  inst(new RoundedBoxGeometry(54, 2.5, 24, 1, 1.2), rubber, [[-188, 1, -90], [-188, 1, 90], [188, 1, -90], [188, 1, 90]], g, cu);

  const lamp = new THREE.PointLight(0xe8efff, 0.5, 5);
  lamp.position.set(0, 330, 60);
  g.add(lamp);
}
