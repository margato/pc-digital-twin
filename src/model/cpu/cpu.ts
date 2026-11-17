import * as THREE from 'three';
import type { PartTag, Kit } from '../kit';

/** i7-12700K (LGA1700 package 45 x 37.5 mm: 37.5 across x, 45 along y) in its socket with ILM. Case mm.
 *  Self-contained: needs only the kit, so it can be built or replaced without the case shared values. */
export function buildCpu(kit: Kit, g: THREE.Group): void {
  const { pm, reg, box, rbox, inst, rrShape, cyl, canvasTex } = kit;
  const cpuU = { part: 'cpu' } as PartTag;
  const cpuFocus = { part: 'cpu', focus: true } as PartTag; // package: substrate, SMD ring, IHS
  const cpuCover = { part: 'cpu', cover: true } as PartTag; // ILM frame, load plate, lever: hidden/ghosted when isolated
  const X = -110, Y = 355;
  const socketMat = pm('cpu', 0x101012, { roughness: 0.7 });
  const socketFloor = pm('cpu', 0x1c1c20, { roughness: 0.8, metalness: 0.1 });
  const ilmMat = pm('cpu', 0x9da1a8, { metalness: 0.9, roughness: 0.32 });
  const darkMetal = pm('cpu', 0x4a4d53, { metalness: 0.9, roughness: 0.4 });
  const gold = pm('cpu', 0xd4a84a, { metalness: 1, roughness: 0.3 });
  const rubber = pm('cpu', 0x1a1a1c, { roughness: 0.85, metalness: 0 });

  // Socket body: plastic frame with a rectangular cavity, contact floor and pin ring
  const body = rrShape(52, 58, 2.5);
  const cav = new THREE.Path();
  cav.moveTo(-21, -24.5); cav.lineTo(21, -24.5); cav.lineTo(21, 24.5); cav.lineTo(-21, 24.5); cav.lineTo(-21, -24.5);
  body.holes.push(cav);
  const bodyM = new THREE.Mesh(new THREE.ExtrudeGeometry(body, { depth: 3.5, bevelEnabled: false, curveSegments: 8 }), socketMat);
  bodyM.position.set(X, Y, -79); g.add(bodyM); reg(bodyM, cpuU);
  box(42.2, 49.2, 0.5, socketFloor, X, Y, -78.75, g, cpuU);
  // contact pins visible in the gap around the substrate (two rows per side)
  const pins: number[][] = [];
  for (let y = -23; y <= 23.01; y += 1.7) { pins.push([X - 19.9, Y + y, -77.4], [X + 19.9, Y + y, -77.4]); }
  for (let x = -18; x <= 18.01; x += 1.7) { pins.push([X + x, Y - 23.6, -77.4], [X + x, Y + 23.6, -77.4]); }
  for (let y = -21; y <= 21.01; y += 1.7) { pins.push([X - 18.9, Y + y, -77.6], [X + 18.9, Y + y, -77.6]); }
  inst(new THREE.BoxGeometry(0.55, 0.55, 2.2), gold, pins, g, cpuU);
  // socket cover keying: asymmetric alignment tabs on the outer rim
  inst(new THREE.BoxGeometry(3, 1.4, 1.2), socketMat, [[X - 9, Y + 29.5, -76.6], [X + 12, Y + 29.5, -76.6], [X - 26.5, Y + 7, -76.6, 0, 0, Math.PI / 2], [X + 26.5, Y - 10, -76.6, 0, 0, Math.PI / 2]], g, cpuU);
  // ILM hinge/frame rails
  box(64, 4, 1.4, ilmMat, X, Y + 33, -75, g, cpuCover);
  box(64, 4, 1.4, ilmMat, X, Y - 33, -75, g, cpuCover);
  box(4, 62, 1.4, ilmMat, X - 30, Y, -75, g, cpuCover);
  box(4, 62, 1.4, ilmMat, X + 30, Y, -75, g, cpuCover);
  // screws: washers, heads and slots merged
  const sc: number[][] = [[-30, 33], [30, 33], [-30, -33], [30, -33]].map((c) => [X + c[0], Y + c[1], -74.6]);
  const headGeo = new THREE.CylinderGeometry(2.4, 2.4, 2.2, 24); headGeo.rotateX(Math.PI / 2);
  const washGeo = new THREE.CylinderGeometry(3.3, 3.3, 0.4, 24); washGeo.rotateX(Math.PI / 2);
  inst(headGeo, ilmMat, sc, g, cpuCover);
  inst(washGeo, darkMetal, sc.map((p) => [p[0], p[1], -75.5]), g, cpuCover);
  inst(new THREE.BoxGeometry(3.6, 0.5, 0.4), darkMetal, sc.map((p, i) => [p[0], p[1], -73.45, 0, 0, i * 0.7 + 0.3]), g, cpuCover);

  // Substrate: green PCB, gold land pads along the sides, orientation triangle and keying notches
  const subTex = canvasTex(150, 180, function (cx) {
    cx.fillStyle = '#1f5a32'; cx.fillRect(0, 0, 150, 180);
    cx.strokeStyle = 'rgba(160,220,170,.16)'; cx.lineWidth = 0.6;
    for (let t = 0; t < 30; t++) { cx.beginPath(); cx.moveTo(0, t * 6); cx.lineTo(150, t * 6 + 20); cx.stroke(); }
    cx.fillStyle = '#c8a24a';
    for (let c = 0; c < 18; c++) { cx.fillRect(3, 14 + c * 8.8, 6, 3.2); cx.fillRect(141, 14 + c * 8.8, 6, 3.2); }
    for (let c = 0; c < 12; c++) { cx.fillRect(22 + c * 9, 3, 4, 5); cx.fillRect(22 + c * 9, 172, 4, 5); }
    // corner marker bottom-left (canvas top = +y), mounting notches on the top and bottom edges (photo: Intel i7-12700K top view)
    cx.fillStyle = '#d9d2c0'; cx.beginPath(); cx.moveTo(4, 176); cx.lineTo(12, 176); cx.lineTo(4, 168); cx.fill();
    cx.fillStyle = '#101012';
    [51, 118].forEach(function (nx) {
      cx.beginPath(); cx.arc(nx, 0, 3, 0, Math.PI); cx.fill();
      cx.beginPath(); cx.arc(nx, 180, 3, Math.PI, Math.PI * 2); cx.fill();
    });
  });
  box(37.5, 45, 1.3, pm('cpu', 0xffffff, { map: subTex, roughness: 0.55, metalness: 0.1 }), X, Y, -74.8, g, cpuFocus);
  // Photo mapping (45.07 px per mm, image centre = package centre). Top view: +x right, +y up.
  // Bottom view is seen from below, so it is mirrored in x and y.
  const topMm = (px: number, py: number): number[] => [X + (px - 880) / 45.07, Y - (py - 1050) / 45.07];
  const botMm = (px: number, py: number): number[] => [X - (px - 880) / 45.07, Y - (py - 1050) / 45.07];
  const capBody = pm('cpu', 0x8a6a3a, { metalness: 0.2, roughness: 0.5 });
  const capSilver = pm('cpu', 0xc9ccd1, { metalness: 1, roughness: 0.3 });
  // top side (+z): eight small chip caps, four along the left edge and four along the bottom edge
  const topCaps: number[][] = [[125, 1460], [125, 1520], [125, 1612], [125, 1680], [1140, 1978], [1215, 1978], [1290, 1978], [1440, 1978]]
    .map(function (p) { const xy = topMm(p[0], p[1]); return [xy[0], xy[1], -73.8]; });
  inst(new THREE.BoxGeometry(1.1, 0.5, 0.7), capSilver, topCaps, g, cpuFocus);
  // bottom side (-z, socket side): 18 large MLCCs in three columns, then a field of small SMD parts in the central cutout
  const big: number[][] = [];
  [530, 728, 880, 1030, 1180, 1340].forEach(function (py) {
    [875, 918, 960].forEach(function (px) { const xy = botMm(px, py); big.push([xy[0], xy[1], -75.75]); });
  });
  inst(new THREE.BoxGeometry(0.9, 1.3, 0.6), capBody, big, g, cpuFocus);
  const small: number[][] = [];
  const rowsAt = function (xs: number[], py0: number, py1: number) {
    xs.forEach(function (px) { for (let py = py0; py <= py1; py += 28) { const xy = botMm(px, py); small.push([xy[0], xy[1], -75.58]); } });
  };
  rowsAt([720, 760, 800, 830], 520, 660);
  rowsAt([720, 760, 800, 830], 830, 1250);
  rowsAt([1005, 1040, 1075, 1110], 520, 1250);
  for (let py = 830; py <= 1440; py += 14) { [638, 690].forEach(function (px) { const xy = botMm(px, py); small.push([xy[0], xy[1], -75.58]); }); }
  inst(new THREE.BoxGeometry(0.35, 0.5, 0.25), capSilver, small, g, cpuFocus);
  // LGA land grid on the bottom face: 0.85 mm pitch, gold pads, central cutout left open
  const pads: number[][] = [];
  for (let i = -21; i <= 21; i++) for (let j = -25; j <= 25; j++) {
    const x = i * 0.85, y = j * 0.85;
    if (Math.abs(x) > 17.5 || Math.abs(y) > 20.9) continue;
    if (Math.abs(x) < 8 && y > -12.6 && y < 14.3) continue;
    pads.push([X + x, Y + y, -75.51]);
  }
  inst(new THREE.BoxGeometry(0.6, 0.6, 0.12), gold, pads, g, cpuFocus);

  // IHS: rounded body 28.7 x 39.6 mm with side ears out to 36.6 mm across, plus a raised brushed-nickel plateau (photo: i7-12700K)
  const ihsTex = canvasTex(128, 128, function (cx) {
    cx.fillStyle = '#c4c7cc'; cx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 1) { const a = Math.random(); cx.fillStyle = a > 0.5 ? 'rgba(255,255,255,' + (a * 0.14).toFixed(3) + ')' : 'rgba(80,84,90,' + ((1 - a) * 0.12).toFixed(3) + ')'; cx.fillRect(0, y, 128, 1); }
  });
  const nickel = pm('cpu', 0xffffff, { map: ihsTex, metalness: 1, roughness: 0.26, envMapIntensity: 0.9 });
  const ihsMat = pm('cpu', 0xb8bcc2, { metalness: 1, roughness: 0.35, envMapIntensity: 0.85 });
  const ihsOpts = { depth: 0.8, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.6, bevelSegments: 3, curveSegments: 8 };
  [rrShape(28.7, 39.6, 2.2), rrShape(36.6, 14.6, 2.5)].forEach(function (sh) {
    const part = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, ihsOpts), ihsMat);
    part.position.set(X, Y, -74.2); g.add(part); reg(part, cpuFocus);
  });
  const plat = new THREE.Shape();
  plat.moveTo(-13.4, -17.8); plat.lineTo(13.4, -17.8); plat.lineTo(13.4, -11.6); plat.lineTo(14.4, -10.8); plat.lineTo(14.4, 10.8); plat.lineTo(13.4, 11.6);
  plat.lineTo(13.4, 17.8); plat.lineTo(-13.4, 17.8); plat.lineTo(-13.4, 11.6); plat.lineTo(-14.4, 10.8); plat.lineTo(-14.4, -10.8); plat.lineTo(-13.4, -11.6); plat.lineTo(-13.4, -17.8);
  const ihsGeo = new THREE.ExtrudeGeometry(plat, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 3, curveSegments: 8 });
  const ihsM = new THREE.Mesh(ihsGeo, nickel);
  ihsM.position.set(X, Y, -73.45); g.add(ihsM); reg(ihsM, cpuFocus);

  // printed marking on the IHS (photo: top view): Intel logo, "INTEL R CORE TM i7", "i7-12700K", lot codes, e4 mark, orientation triangle.
  // Plane is 28 x 36 mm, 36 px per mm, origin at the IHS centre, canvas top = +y. Sits just above the nickel plate (top at z -72.3).
  const printTex = canvasTex(1008, 1296, function (c) {
    const s = 36;
    const px = function (u: number) { return (u + 14) * s; };
    const py = function (v: number) { return (18 - v) * s; };
    c.fillStyle = '#16171b'; c.strokeStyle = '#16171b'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(px(-7.4), py(12.4), 1.3 * s, 0.8 * s, -0.35, 0, Math.PI * 1.8); c.stroke();
    c.font = 'bold 56px Helvetica, Arial, sans-serif';
    c.fillText('INTEL', px(-8.9), py(10.0));
    c.beginPath(); c.arc(px(-3.2), py(10.0) - 0.5 * s, 0.9 * s, 0, Math.PI * 2); c.stroke();
    c.font = 'bold 30px Helvetica, Arial, sans-serif'; c.textAlign = 'center';
    c.fillText('R', px(-3.2), py(10.0) - 0.5 * s + 10);
    c.textAlign = 'left';
    c.font = 'bold 56px Helvetica, Arial, sans-serif';
    c.fillText('CORE', px(-0.2), py(10.0));
    c.font = 'bold 22px Helvetica, Arial, sans-serif';
    c.fillText('TM', px(6.4), py(10.0) - 26);
    c.font = 'bold 56px Helvetica, Arial, sans-serif';
    c.fillText('i7', px(6.9), py(10.0));
    c.font = 'bold 60px ui-monospace, Menlo, monospace';
    c.fillText('i7-12700K', px(-8.9), py(6.9));
    c.fillText('SRL4N', px(-8.9), py(3.3));
    c.fillText('V135I077', px(-8.9), py(0.1));
    c.beginPath(); c.arc(px(1.67), py(0.1), 1.0 * s, 0, Math.PI * 2); c.stroke();
    c.font = 'bold 34px ui-monospace, Menlo, monospace'; c.textAlign = 'center';
    c.fillText('e4', px(1.67), py(0.1) + 12);
    c.textAlign = 'left';
    c.beginPath(); c.moveTo(px(-12.3), py(-16.6)); c.lineTo(px(-12.3), py(-13.7)); c.lineTo(px(-9.3), py(-16.6)); c.closePath(); c.stroke();
  });
  const printMesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 36), pm('cpu', 0xffffff, { map: printTex, transparent: true, roughness: 0.45, metalness: 0.3, depthWrite: false }));
  printMesh.position.set(X, Y, -72.22); g.add(printMesh); reg(printMesh, cpuFocus);

  // Load plate with window, tongue and cam-lever pad
  const lp = rrShape(47, 60, 2.5);
  const lw = new THREE.Path(); lw.moveTo(-14.5, -18); lw.lineTo(14.5, -18); lw.lineTo(14.5, 18); lw.lineTo(-14.5, 18); lw.lineTo(-14.5, -18); lp.holes.push(lw);
  const lpGeo = new THREE.ExtrudeGeometry(lp, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 3, curveSegments: 16 });
  const lpm = new THREE.Mesh(lpGeo, ilmMat); lpm.position.set(X, Y, -72.9); g.add(lpm); reg(lpm, cpuCover);
  rbox(12, 7, 0.8, 0.3, ilmMat, X, Y - 33, -72.5, g, cpuCover);
  rbox(34, 4, 2.4, 0.8, ilmMat, X, Y + 31.5, -74, g, cpuCover);
  // lever: shaft, bent handle with rubber grip, cam and retention hook
  cyl(1.1, 62, ilmMat, X + 35, Y, -75.5, g, cpuCover, 16);
  const hook = cyl(1.1, 10, ilmMat, X + 30, Y + 31, -75.5, g, cpuCover, 16); hook.rotation.z = Math.PI / 2;
  const handle = cyl(1.1, 14, ilmMat, X + 35, Y - 31 - 6, -75.5, g, cpuCover, 16); handle.rotation.set(0, 0, Math.PI / 2); handle.position.set(X + 40, Y - 31, -75.5);
  const grip = cyl(1.6, 9, rubber, X + 44.5, Y - 31, -75.5, g, cpuCover, 16); grip.rotation.z = Math.PI / 2;
  cyl(1.7, 6, darkMetal, X + 35, Y + 30.5, -75.5, g, cpuCover, 16);
}
