import * as THREE from 'three';
import type { PartTag, Kit } from '../kit';
import type { Shared } from './shared';

// ASUS PRIME GeForce RTX 5080 16G OC (PRIME-RTX5080-O16G), measured from reference photos.
// Card is 304 x 126 x 50 mm: length along x from the I/O bracket (x -236) to the far end (x +68),
// height along z from the PCIe edge (z -69) to the top edge (z +57), thickness along y from the
// fan face (y 203) to the backplate (y 253). Fans sit at z 0 and x -183.5 / -84 / 15.5 (99.5 mm pitch).
const CORE_X = -130; // GPU core window centre (backplate photo)
const CORE_Z = -9;

export function buildGpu(kit: Kit, g: THREE.Group, shared: Shared): void {
  const { pm, reg, box, rbox, inst, rrShape, cyl, tube, fan, canvasTex } = kit;
  const { finTex } = shared;
  const gu = { part: 'gpu' } as PartTag;
  const gpuMat = pm('gpu', 0x18181b, { metalness: 0.45, roughness: 0.42 });
  pm('gpu', 0xffffff, { map: finTex, metalness: 0.6, roughness: 0.4 });

  // Fan shroud: 304 x 126 with three round openings (R 46). Shape y maps to -z after rotateX.
  const shs = rrShape(304, 126, 10);
  [-99.5, 0, 99.5].forEach(function (cx) { const h = new THREE.Path(); h.absarc(cx, -6, 46, 0, Math.PI * 2, true); shs.holes.push(h); });
  const shGeo = new THREE.ExtrudeGeometry(shs, { depth: 8, bevelEnabled: false, curveSegments: 96 });
  shGeo.rotateX(-Math.PI / 2);
  const shroud = new THREE.Mesh(shGeo, gpuMat); shroud.position.set(-84, 207, -6); g.add(shroud); reg(shroud, gu);
  // Shroud walls: bottom edge closed; top edge open over the fin stack except the ASUS cap at the far end
  rbox(304, 34, 5, 2, gpuMat, -84, 232, -66.5, g, gu);
  rbox(80, 34, 5, 2, gpuMat, 28, 232, 54.5, g, gu);
  box(5, 34, 116, gpuMat, -233.5, 232, -6, g, gu);
  box(5, 34, 116, gpuMat, 65.5, 232, -6, g, gu);

  // Heatsink: aluminium fin stack between two plates, copper heat pipes, exposed at the top edge
  const alu = pm('gpu', 0xb9bdc4, { metalness: 0.88, roughness: 0.32 });
  const finList = [];
  for (let fx = -229; fx <= 61; fx += 2.1) finList.push([fx, 231.5, -6]);
  inst(new THREE.BoxGeometry(0.45, 29, 112), alu, finList, g, gu);
  box(292, 1.6, 114, alu, -84, 217.6, -6, g, gu);
  box(292, 1.6, 114, alu, -84, 245.6, -6, g, gu);
  const pipe = pm('gpu', 0xb87333, { metalness: 0.9, roughness: 0.3 });
  [-36, -12, 12, 36].forEach(function (z) { const hp = cyl(3, 288, pipe, -84, 217.5, z - 6, g, gu, 12); hp.rotation.z = Math.PI / 2; });
  box(290, 1.6, 120, pm('gpu', 0x111214, { roughness: 0.6 }), -88, 248, -6, g, gu);

  // Backplate: brushed steel, full card length, GPU core window and a vent grille at the far end
  const brushed = canvasTex(512, 256, function (cx) {
    cx.fillStyle = '#2c2d31'; cx.fillRect(0, 0, 512, 256);
    for (let bY = 0; bY < 256; bY++) { cx.fillStyle = 'rgba(255,255,255,' + (0.012 + Math.random() * 0.05).toFixed(3) + ')'; cx.fillRect(0, bY, 512, 1); }
    for (let bL = 0; bL < 70; bL++) { cx.fillStyle = 'rgba(0,0,0,.07)'; cx.fillRect(Math.random() * 512, Math.random() * 256, 80 + Math.random() * 220, 1); }
  });
  brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping; brushed.repeat.set(1 / 304, 1 / 126);
  const bpMat = pm('gpu', 0xffffff, { map: brushed, metalness: 0.85, roughness: 0.36 });
  const bpShape = rrShape(304, 126, 10);
  // Core window x -156..-105, z -48..30 (shape x = world x + 84, shape y = -6 - z)
  const bwin = new THREE.Path(); bwin.moveTo(-72, -36); bwin.lineTo(-21, -36); bwin.lineTo(-21, 42); bwin.lineTo(-72, 42); bwin.lineTo(-72, -36);
  // Vent grille x 6..58, z -46..43
  const bvent = new THREE.Path(); bvent.moveTo(90, -49); bvent.lineTo(142, -49); bvent.lineTo(142, 40); bvent.lineTo(90, 40); bvent.lineTo(90, -49);
  bpShape.holes.push(bwin, bvent);
  const bpGeo = new THREE.ExtrudeGeometry(bpShape, { depth: 2.2, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 4, curveSegments: 24 });
  bpGeo.rotateX(-Math.PI / 2);
  const bpM = new THREE.Mesh(bpGeo, bpMat); bpM.position.set(-84, 250.3, -6); g.add(bpM); reg(bpM, gu);

  // Polished trim lines on the backplate
  const rimM = pm('gpu', 0x55585f, { metalness: 0.9, roughness: 0.25 });
  rbox(213, 0.9, 1.6, 0.4, rimM, -129.5, 253.4, 50.5, g, gu);
  rbox(178, 0.9, 1.6, 0.4, rimM, -112, 253.4, -55, g, gu);
  rbox(1.6, 0.9, 106, 0.4, rimM, -23, 253.4, -2.5, g, gu);

  // Vent grille: louvres seen through the backplate opening
  const louvreM = pm('gpu', 0x2a2b2f, { metalness: 0.7, roughness: 0.4 });
  const louvres: number[][] = [];
  for (let i = 0; i < 36; i++) louvres.push([32, 248.5, -44 + i * 2.5]);
  inst(new THREE.BoxGeometry(52, 2.6, 0.7), louvreM, louvres, g, gu);

  // Core window: X retention bracket, four bronze standoffs at the window corners, SMD capacitors behind the die
  const bracketM = pm('gpu', 0x141416, { metalness: 0.7, roughness: 0.35 });
  const xa = box(46, 1.6, 5, bracketM, CORE_X, 249.7, CORE_Z, g, gu); xa.rotation.y = 0.68;
  const xb = box(46, 1.6, 5, bracketM, CORE_X, 249.7, CORE_Z, g, gu); xb.rotation.y = -0.68;
  rbox(14, 1.9, 14, 1.2, bracketM, CORE_X, 249.8, CORE_Z, g, gu);
  const springM = pm('gpu', 0xb3b7bd, { metalness: 0.95, roughness: 0.25 });
  const grooveM = pm('gpu', 0x0b0b0c, { roughness: 0.75 });
  [[-25.5, -39], [25.5, -39], [-25.5, 39], [25.5, 39]].forEach(function (c) {
    const sx = CORE_X + c[0], sz = CORE_Z + c[1];
    cyl(2.4, 3.4, springM, sx, 251.2, sz, g, gu, 32);
    const sp = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.45, 12, 48), springM); sp.rotation.x = Math.PI / 2; sp.position.set(sx, 250.2, sz); g.add(sp); reg(sp, gu);
    box(3.4, 0.4, 0.6, grooveM, sx, 252.95, sz, g, gu);
  });
  const capL: number[][] = [];
  for (let cxI = 0; cxI < 13; cxI++) for (let czI = 0; czI < 12; czI++) {
    const ccx = CORE_X - 24 + cxI * 4, ccz = CORE_Z - 30 + czI * 5;
    if (Math.abs(ccx - CORE_X) < 7 && Math.abs(ccz - CORE_Z) < 7) continue;
    capL.push([ccx, 249.2, ccz]);
  }
  inst(new THREE.BoxGeometry(1.6, 0.9, 1), pm('gpu', 0x8c6a3c, { metalness: 0.6, roughness: 0.4 }), capL, g, gu);

  // Serial label near the PCIe edge, with a barcode
  const labelTex = canvasTex(300, 24, function (cx) {
    cx.fillStyle = '#ececea'; cx.fillRect(0, 0, 300, 24);
    cx.fillStyle = '#111';
    let bx = 6; while (bx < 290) { const bw = 1 + Math.floor(Math.random() * 2); cx.fillRect(bx, 3, bw, 13); bx += bw + 1 + Math.floor(Math.random() * 2); }
    cx.fillStyle = '#555'; cx.fillRect(40, 19, 120, 2); cx.fillRect(170, 19, 90, 2);
  });
  box(75, 0.25, 6, pm('gpu', 0xffffff, { map: labelTex, roughness: 0.85, metalness: 0 }), -122, 253.05, -63.5, g, gu);
  // Mode switch on the backplate edge (MODE label in the photo)
  box(11, 0.4, 4.4, grooveM, -169, 253.05, 47, g, gu);
  rbox(3.8, 1.8, 3.2, 0.6, pm('gpu', 0x8f949b, { metalness: 0.9, roughness: 0.3 }), -169, 253.6, 47, g, gu);
  // Backplate screws: window corners plus the rim row
  const screwM = pm('gpu', 0x8f9399, { metalness: 0.95, roughness: 0.25 });
  const scList: number[][] = [];
  [-228, -190, -150, -110, -70, -30].forEach(function (x) { scList.push([x, 253.4, 47]); scList.push([x, 253.4, -62]); });
  inst(new THREE.CylinderGeometry(2.2, 2.2, 1, 32), screwM, scList, g, gu);

  // Brass labels: ASUS and GEFORCE RTX markings on the fan face, as canvas textures
  const asusTex = canvasTex(176, 40, function (cx) {
    cx.fillStyle = '#e8e9ec'; cx.font = 'italic 700 30px Helvetica, Arial, sans-serif'; cx.textBaseline = 'middle';
    cx.fillText('ASUS', 8, 21);
  });
  // lie flat on the shroud top (normal +y); the shroud top is at y 215
  const asusLogo = new THREE.Mesh(new THREE.PlaneGeometry(22, 5).rotateX(-Math.PI / 2), pm('gpu', 0xffffff, { map: asusTex, transparent: true, roughness: 0.5, metalness: 0.3 }));
  asusLogo.position.set(-130, 215.6, -45); g.add(asusLogo); reg(asusLogo, gu);
  const brandTex = canvasTex(194, 16, function (cx) {
    cx.fillStyle = '#d9dce0'; cx.font = '700 12px Helvetica, Arial, sans-serif'; cx.textBaseline = 'middle';
    cx.fillText('GEFORCE RTX', 4, 8);
  });
  const brandPlate = new THREE.Mesh(new THREE.PlaneGeometry(97, 8).rotateX(-Math.PI / 2), pm('gpu', 0xffffff, { map: brandTex, transparent: true, roughness: 0.5, metalness: 0.3 }));
  brandPlate.position.set(-167.5, 215.6, 54); g.add(brandPlate); reg(brandPlate, gu);
  // PRIME wordmark on the top-right of the shroud and a PRIME badge on each fan hub (photo: front view)
  const primeTex = canvasTex(512, 48, function (cx) {
    cx.fillStyle = '#2b2d33'; cx.font = 'italic 800 40px Helvetica, Arial, sans-serif'; cx.textBaseline = 'middle';
    cx.fillText('PRIME', 8, 26);
  });
  const primeWord = new THREE.Mesh(new THREE.PlaneGeometry(150, 14).rotateX(-Math.PI / 2), pm('gpu', 0xffffff, { map: primeTex, transparent: true, roughness: 0.6, metalness: 0.4 }));
  primeWord.position.set(-14, 215.6, 58); g.add(primeWord); reg(primeWord, gu);
  const badgeTex = canvasTex(128, 128, function (cx) {
    cx.fillStyle = '#16171b'; cx.beginPath(); cx.arc(64, 64, 62, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = '#8f949b'; cx.lineWidth = 6; cx.beginPath(); cx.arc(64, 64, 52, 0, Math.PI * 2); cx.stroke();
    cx.fillStyle = '#d9dce0'; cx.font = 'bold 22px Helvetica, Arial, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText('PRIME', 64, 64);
  });
  [-183.5, -84, 15.5].forEach(function (x) {
    const badge = new THREE.Mesh(new THREE.CircleGeometry(15, 40).rotateX(-Math.PI / 2), pm('gpu', 0xffffff, { map: badgeTex, transparent: true, roughness: 0.4, metalness: 0.6 }));
    badge.position.set(x, 216.4, 0); g.add(badge); reg(badge, gu);
  });

  // Fan openings: dividers and top separator, trims on the shroud face
  const rimAcc = pm('gpu', 0x3a3c42, { metalness: 0.75, roughness: 0.28 });
  const fanX = [-183.5, -84, 15.5];
  fanX.forEach(function (x) { kit.torus(47, 1.1, rimAcc, g, gu).position.set(x, 207.4, 0); });
  [-134.5, -33.5].forEach(function (x) { rbox(6, 1.2, 80, 0.5, rimAcc, x, 206.6, 0, g, gu); });
  rbox(290, 1.2, 3, 0.5, rimAcc, -84, 206.6, 41, g, gu);

  // Fans: 90 mm rotors with a barrier ring, hub trim and frame ring
  const gpuFan = { frame: gpuMat, hub: pm('gpu', 0x202024, {}), cap: pm('gpu', 0x9fa3aa, { metalness: 0.9, roughness: 0.2 }), blade: pm('gpu', 0x1c1d20, { roughness: 0.5 }) };
  fanX.forEach(function (x) {
    const f = fan(45, 9, gpuFan, gu, { blades: 9, speed: 7 });
    f.position.set(x, 212, 0); g.add(f);
    const rotor = f.children.find(function (c) { return c.type === 'Group'; }) as THREE.Group;
    kit.torus(43.1, 0.9, gpuFan.blade, rotor, gu); // barrier ring joining the blade tips
    kit.torus(14.5, 0.7, gpuFan.cap, rotor, gu).position.y = -3.6; // hub trim ring
    kit.torus(44.5, 0.6, rimAcc, f, gu).position.y = -4.4;
  });

  // I/O bracket: 50 x 126 mm stainless plate with 3 DisplayPort-style and 1 HDMI-style openings
  const bracket = pm('gpu', 0x9a9ea5, { metalness: 0.85, roughness: 0.3 });
  box(2, 50, 126, bracket, -237.5, 230, -6, g, gu);
  const port = pm('gpu', 0x050505, {});
  const portZ = [-51, -28, -6, 14];
  portZ.forEach(function (z) { box(1, 9, 16, port, -239, 244.6, z, g, gu); });
  // Ventilation slots above the ports (7 + 2 in the photo, here 9 evenly spaced)
  const slotZ: number[] = [];
  for (let i = 0; i < 9; i++) slotZ.push(-56 + i * 9);
  inst(new THREE.BoxGeometry(0.8, 15, 4.5), port, slotZ.map(function (z) { return [-239, 221, z]; }), g, gu);
  // Screws on the bracket face
  inst(new THREE.CylinderGeometry(1.6, 1.6, 0.8, 24), screwM, [[-239.3, 239.5, -62, 0, 0, Math.PI / 2], [-239.3, 239.5, 46, 0, 0, Math.PI / 2]], g, gu);

  // 12V-2x6 connector near the far end, mouth facing the top edge: 2 x 6 power pins plus 4 sense pins
  const pinHole = pm('gpu', 0x020202, { roughness: 0.9 });
  const pinList: number[][] = [];
  for (let pc = 0; pc < 6; pc++) { pinList.push([-60.9 + pc * 2.3, 238.2, 63.1]); pinList.push([-60.9 + pc * 2.3, 241.2, 63.1]); }
  inst(new THREE.BoxGeometry(1.7, 2.1, 0.4), pinHole, pinList, g, gu);
  inst(new THREE.BoxGeometry(1, 0.8, 0.4), pinHole, [[-52, 243.6, 63.1], [-50, 243.6, 63.1], [-46, 243.6, 63.1], [-44, 243.6, 63.1]], g, gu);
  // Heat pipes curving up into the fin stack at both ends
  [-36, -12, 12, 36].forEach(function (z) {
    tube([[-228, 217.5, z - 6], [-234, 222, z - 6], [-232, 236, z - 6], [-226, 240, z - 6]], 3, pipe, g, gu);
    tube([[60, 217.5, z - 6], [64, 224, z - 6], [62, 238, z - 6], [56, 241, z - 6]], 3, pipe, g, gu);
  });
  // GPU die contact plate under the pipes
  box(60, 3, 60, pm('gpu', 0xc58a4a, { metalness: 0.95, roughness: 0.28 }), CORE_X, 215.8, CORE_Z, g, gu);

  // PCIe x16 gold fingers: 89 mm edge with the key notch splitting 11.65 mm and 75 mm runs
  const gold = pm('gpu', 0xd4a640, { metalness: 0.95, roughness: 0.28 });
  const fg: number[][] = [];
  for (let i = 0; i < 11; i++) { fg.push([-194 + i, 248.9, -71.5]); fg.push([-194 + i, 247.1, -71.5]); }
  for (let i = 0; i < 75; i++) { fg.push([-180.2 + i, 248.9, -71.5]); fg.push([-180.2 + i, 247.1, -71.5]); }
  inst(new THREE.BoxGeometry(0.62, 0.12, 7), gold, fg, g, gu);
  box(2, 1.7, 7, pm('gpu', 0x15191a, { roughness: 0.6 }), -181.4, 248, -71.5, g, gu); // key notch fill

  // Standoffs and VRM chokes / SMD parts near the power connector
  const hex = new THREE.CylinderGeometry(2.6, 2.6, 2, 6);
  inst(hex, screwM, [[-30, 253.6, 20, 0, 0, 0], [-230, 253.6, -30], [-230, 253.6, 20], [-60, 253.6, -50]], g, gu);
  const chokes: number[][] = [];
  for (let i = 0; i < 8; i++) chokes.push([-60 + i * 7, 246.6, 40]);
  inst(new THREE.BoxGeometry(5, 2.4, 5), pm('gpu', 0x26272a, { metalness: 0.5, roughness: 0.4 }), chokes, g, gu);
  const smd: number[][] = [];
  for (let i = 0; i < 14; i++) smd.push([-70 + i * 3.4, 246.9, 30 + (i % 2) * 2]);
  inst(new THREE.BoxGeometry(1.4, 0.7, 0.8), pm('gpu', 0x9a8a6a, { metalness: 0.5, roughness: 0.45 }), smd, g, gu);

  // 12V-2x6 housing: keyed lip with a latch ridge
  const plugM = pm('gpu', 0x0e0e10, { roughness: 0.55 });
  rbox(25, 13.5, 2, 0.6, plugM, -48, 240, 62.2, g, gu);
  rbox(8, 1.4, 4, 0.4, plugM, -48, 247.3, 61, g, gu);
  box(2, 3, 2, plugM, -37, 236, 63, g, gu);

  // DisplayPort-style chamfered steel shells and an HDMI shell around the I/O openings
  const screwShell = pm('gpu', 0x8f9399, { metalness: 0.95, roughness: 0.25 });
  const dp = new THREE.Shape(), dw = 17.6, dh = 6.4;
  dp.moveTo(-dw / 2, -dh / 2); dp.lineTo(dw / 2, -dh / 2); dp.lineTo(dw / 2, dh / 2 - 2.2); dp.lineTo(dw / 2 - 2.2, dh / 2); dp.lineTo(-dw / 2, dh / 2); dp.lineTo(-dw / 2, -dh / 2);
  const dpHole = new THREE.Path(); const iw = dw - 1.4, ih = dh - 1.4;
  dpHole.moveTo(-iw / 2, -ih / 2); dpHole.lineTo(-iw / 2, ih / 2); dpHole.lineTo(iw / 2 - 1.8, ih / 2); dpHole.lineTo(iw / 2, ih / 2 - 1.8); dpHole.lineTo(iw / 2, -ih / 2); dpHole.lineTo(-iw / 2, -ih / 2);
  dp.holes.push(dpHole);
  const dpGeo = new THREE.ExtrudeGeometry(dp, { depth: 0.8, bevelEnabled: false }); dpGeo.rotateY(-Math.PI / 2);
  inst(dpGeo, screwShell, [[-239.7, 244.6, -51], [-239.7, 244.6, -28], [-239.7, 244.6, -6]], g, gu);
  const hd = new THREE.Shape(), hw = 15.6, hh = 6.2;
  hd.moveTo(-hw / 2, -hh / 2); hd.lineTo(hw / 2, -hh / 2); hd.lineTo(hw / 2, hh / 2 - 1.6); hd.lineTo(hw / 2 - 2, hh / 2); hd.lineTo(-hw / 2 + 2, hh / 2); hd.lineTo(-hw / 2, hh / 2 - 1.6); hd.lineTo(-hw / 2, -hh / 2);
  const hHole = new THREE.Path(); hHole.moveTo(-6.3, -2.4); hHole.lineTo(-6.3, 2.2); hHole.lineTo(6.3, 2.2); hHole.lineTo(6.3, -2.4); hHole.lineTo(-6.3, -2.4);
  hd.holes.push(hHole);
  const hGeo = new THREE.ExtrudeGeometry(hd, { depth: 0.8, bevelEnabled: false }); hGeo.rotateY(-Math.PI / 2);
  inst(hGeo, screwShell, [[-239.7, 244.6, 14]], g, gu);
  // Port cage tongues and the port bodies
  const portBody = pm('gpu', 0x111113, { roughness: 0.6 });
  const tongue = pm('gpu', 0x2a2b30, { roughness: 0.5 });
  portZ.forEach(function (z, i) {
    const w = i === 3 ? 15 : 17;
    rbox(3, 7, w, 1, portBody, -239.6, 244.6, z, g, gu);
    box(1, 2, w - 6, tongue, -240.8, 244.6, z, g, gu);
  });
}
