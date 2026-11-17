import * as THREE from 'three';
import type { PartTag, Kit } from '../kit';
import type { Shared } from './shared';

export function buildBoard(kit: Kit, g: THREE.Group, _shared: Shared): void {
  const { pm, box, rbox, inst, cyl, tube, canvasTex } = kit;
  const bu = { part: 'board' } as PartTag;
  let seed = 4242;
  function rn() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  // ---- Textures (canvas px = board mm: px = X + 222, py = 440 - Y) ----
  const OL = '#8a8140';
  const pcbTex = canvasTex(244, 305, function (c) {
    c.fillStyle = '#17191c'; c.fillRect(0, 0, 244, 305);
    // solder-mask variation: slightly warmer / cooler patches
    for (let i = 0; i < 26; i++) {
      c.fillStyle = rn() > 0.5 ? 'rgba(40,44,38,0.28)' : 'rgba(8,10,14,0.3)';
      c.fillRect(rn() * 244, rn() * 305, 20 + rn() * 70, 15 + rn() * 60);
    }
    // trace bundles with 45 degree jogs
    for (let b = 0; b < 70; b++) {
      let x = rn() * 244, y = rn() * 305;
      const n = 3 + Math.floor(rn() * 4), horiz = rn() > 0.5, len = 25 + rn() * 70;
      for (let k = 0; k < n; k++) {
        c.strokeStyle = k % 2 ? 'rgba(52,58,62,0.55)' : 'rgba(34,38,42,0.8)'; c.lineWidth = 0.7;
        c.beginPath();
        const o = k * 1.6;
        if (horiz) { c.moveTo(x, y + o); c.lineTo(x + len * 0.5, y + o); c.lineTo(x + len * 0.5 + 6, y + o + 6); c.lineTo(x + len, y + o + 6); }
        else { c.moveTo(x + o, y); c.lineTo(x + o, y + len * 0.5); c.lineTo(x + o + 6, y + len * 0.5 + 6); c.lineTo(x + o + 6, y + len); }
        c.stroke();
      }
    }
    // vias
    for (let v = 0; v < 700; v++) {
      const vx = rn() * 244, vy = rn() * 305;
      c.fillStyle = 'rgba(70,76,70,0.7)'; c.beginPath(); c.arc(vx, vy, 0.9, 0, 7); c.fill();
      c.fillStyle = '#050607'; c.beginPath(); c.arc(vx, vy, 0.35, 0, 7); c.fill();
    }
    // muted olive printed outlines: socket keep-out, DIMM bank, PCIe lanes, M.2 slots
    c.strokeStyle = OL; c.globalAlpha = 0.55; c.lineWidth = 0.9;
    const R = (x0: number, x1: number, y0: number, y1: number) => c.strokeRect(x0 + 222, 440 - y1, x1 - x0, y1 - y0);
    R(-140, -80, 325, 385); R(-54, -8, 280, 432); R(-158, -58, 255, 265); R(-198, -102, 170, 180);
    R(-166, -54, 270, 300); R(-181, -69, 129, 151); R(-171, -59, 206, 230);
    c.setLineDash([3, 2]); R(-222 + 2, 20, 136, 436); c.setLineDash([]);
    // hazard hatch along the lower edge
    c.beginPath();
    for (let h = 0; h < 244; h += 6) { c.moveTo(h, 303); c.lineTo(h + 4, 296); }
    c.stroke(); c.globalAlpha = 1;
    // copper rings around mounting holes
    [[-215, 432], [-110, 432], [15, 432], [-215, 300], [15, 300], [-215, 145], [-150, 145], [15, 145], [-60, 300]].forEach(function (h) {
      c.strokeStyle = '#b08a4a'; c.lineWidth = 1.4; c.beginPath(); c.arc(h[0] + 222, 440 - h[1], 6.5, 0, 7); c.stroke();
    });
  });
  const hazTex = canvasTex(32, 32, function (c) {
    c.fillStyle = '#16170f'; c.fillRect(0, 0, 32, 32); c.fillStyle = '#7d7638';
    for (let i = -32; i < 64; i += 12) { c.beginPath(); c.moveTo(i, 32); c.lineTo(i + 6, 32); c.lineTo(i + 38, 0); c.lineTo(i + 32, 0); c.fill(); }
  });
  const chipTex = canvasTex(128, 128, function (c) {
    c.fillStyle = '#1a1b1c'; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = '#6f6a37'; c.lineWidth = 2; c.strokeRect(6, 6, 116, 116);
    c.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) { // chevrons
      c.beginPath(); c.moveTo(18, 40 + i * 14); c.lineTo(64, 24 + i * 14); c.lineTo(110, 40 + i * 14); c.stroke();
    }
    c.strokeStyle = 'rgba(111,106,55,0.5)';
    for (let i = 14; i < 128; i += 16) { c.beginPath(); c.moveTo(i, 8); c.lineTo(i, 14); c.moveTo(i, 114); c.lineTo(i, 120); c.stroke(); }
    c.beginPath(); c.arc(64, 64, 10, 0, 7); c.stroke();
  });

  // ---- Materials ----
  const sink = pm('board', 0x151618, { metalness: 0.6, roughness: 0.4 });
  const sinkHi = pm('board', 0x474b51, { metalness: 0.78, roughness: 0.32 });
  const blk = pm('board', 0x0c0c0d, { roughness: 0.7 });
  const slotMat = pm('board', 0x0e0e0f, { roughness: 0.7 });
  const grey = pm('board', 0x2b2d31, { roughness: 0.6 });
  const steel = pm('board', 0xaeb2b8, { metalness: 0.92, roughness: 0.28 });
  const gold = pm('board', 0xd6a948, { metalness: 0.95, roughness: 0.25 });
  const whiteH = pm('board', 0xcfcdc6, { roughness: 0.6 });
  const hazM = pm('board', 0xffffff, { map: hazTex, metalness: 0.3, roughness: 0.55 });
  const dark2 = pm('board', 0x050506, { roughness: 0.85, metalness: 0.1 });
  const padM = pm('board', 0x9fb0bd, { roughness: 0.9, metalness: 0 });

  // Motherboard (ATX 305 x 244)
  box(244, 305, 2, pm('board', 0xffffff, { map: pcbTex, roughness: 0.72, metalness: 0.2 }), -100, 287.5, -80, g, bu);

  // ---- Rear I/O armour with port cut-outs behind it ----
  box(30, 140, 42, sink, -207, 365, -58, g, bu);
  const ioY = [310, 326, 342, 358, 374, 392, 410];
  inst(new THREE.BoxGeometry(1, 13, 17), dark2, ioY.map((y) => [-222.2, y, -66]), g, bu);
  inst(new THREE.BoxGeometry(2, 11, 15), steel, ioY.map((y) => [-221, y, -66]), g, bu);
  inst(new THREE.BoxGeometry(1.2, 3, 12), blk, ioY.map((y) => [-220, y, -66]), g, bu);
  inst(new THREE.BoxGeometry(1, 13, 11), dark2, [[-222.2, 428, -66], [-222.2, 436, -50]], g, bu);
  box(1, 60, 12, hazM, -222.3, 360, -44, g, bu);
  const facet = [];
  for (let ff = 0; ff < 6; ff++) facet.push([-207, 305 + ff * 22, -36.6, 0, 0, 0.55]);
  inst(new THREE.BoxGeometry(26, 3, 0.8), sinkHi, facet, g, bu);

  // ---- VRM heatsinks ----
  const finMain = [];
  for (let fi = 0; fi < 6; fi++) finMain.push([-181, 305 + fi * 20, -65]);
  inst(new THREE.BoxGeometry(22, 6, 30), sinkHi, finMain, g, bu);
  const finMid = [];
  for (let fi = 0; fi < 6; fi++) finMid.push([-181, 315 + fi * 20, -65]);
  inst(new THREE.BoxGeometry(22, 2.2, 24), sinkHi, finMid, g, bu);
  box(22, 116, 24, sink, -181, 355, -67, g, bu);
  box(90, 26, 28, sink, -140, 418, -65, g, bu);
  const finTop = [];
  for (let vf = 0; vf < 10; vf++) finTop.push([-180 + vf * 9, 418, -49.5]);
  inst(new THREE.BoxGeometry(4.5, 26, 4), sinkHi, finTop, g, bu);
  const finTop2 = [];
  for (let vf = 0; vf < 9; vf++) finTop2.push([-175.5 + vf * 9, 418, -52]);
  inst(new THREE.BoxGeometry(2, 24, 3), sink, finTop2, g, bu);
  box(34, 26, 0.5, hazM, -113, 418, -50.8, g, bu);
  box(0.5, 20, 22, hazM, -192.3, 355, -66, g, bu);

  // ---- Chipset heatsink with printed pattern ----
  box(64, 64, 8, sink, -35, 195, -75, g, bu);
  box(56, 56, 0.5, pm('board', 0xffffff, { map: chipTex, metalness: 0.4, roughness: 0.5 }), -35, 195, -70.7, g, bu);
  const cg2 = [];
  for (let cgi = 0; cgi < 8; cgi++) cg2.push([-60 + cgi * 7, 195, -70.4, 0, 0, 0.6]);
  inst(new THREE.BoxGeometry(2.2, 56, 0.4), dark2, cg2, g, bu);
  inst(new THREE.CylinderGeometry(2.4, 2.4, 1.2, 20), steel, [[-64, 163, -70.4, Math.PI / 2, 0, 0], [-6, 227, -70.4, Math.PI / 2, 0, 0], [-6, 163, -70.4, Math.PI / 2, 0, 0], [-64, 227, -70.4, Math.PI / 2, 0, 0]], g, bu);

  // ---- M.2 heatsinks with thermal pad, hazard end-cap and screw ----
  const m2 = [[-110, 285], [-125, 140], [-115, 218]];
  m2.forEach(function (m) {
    box(110, 26, 7, sink, m[0], m[1], -73, g, bu);
    const gr = [];
    for (let gi = 0; gi < 5; gi++) gr.push([m[0] - 36 + gi * 14, m[1], -69.3]);
    inst(new THREE.BoxGeometry(8, 22, 0.6), dark2, gr, g, bu);
    box(16, 22, 0.5, hazM, m[0] + 40, m[1], -69.3, g, bu);
    box(3, 21, 2.2, padM, m[0] - 56, m[1], -75.6, g, bu); // pad squeezing out
    inst(new THREE.CylinderGeometry(2.2, 2.2, 1.2, 24), steel, [[m[0] + 51, m[1], -69.2, Math.PI / 2, 0, 0]], g, bu);
    box(3.6, 0.7, 0.4, dark2, m[0] + 51, m[1], -68.5, g, bu);
    box(6, 20, 6, blk, m[0] + 58, m[1], -76.5, g, bu); // M.2 connector body
  });

  // ---- DIMM slots: single latch, keyed channel with contacts ----
  const dx = [-48, -38, -24, -14];
  dx.forEach(function (x) { box(6.5, 142, 6, blk, x, 355, -76, g, bu); });
  inst(new THREE.BoxGeometry(2.4, 138, 0.5), grey, dx.map((x) => [x, 355, -72.8]), g, bu);
  inst(new THREE.BoxGeometry(1.8, 124, 0.3), gold, dx.map((x) => [x, 352, -72.5]), g, bu);
  inst(new THREE.BoxGeometry(6.2, 1.2, 3.5), blk, dx.map((x) => [x, 355 + 11, -73.8]), g, bu); // key notch
  inst(new THREE.BoxGeometry(7, 7, 9), grey, dx.map((x) => [x, 355 + 74, -74.5]), g, bu); // latch
  inst(new THREE.BoxGeometry(2.5, 3, 3), steel, dx.map((x) => [x, 355 + 76, -69.6]), g, bu);
  inst(new THREE.BoxGeometry(7, 4, 9), blk, dx.map((x) => [x, 355 - 73, -74.5]), g, bu); // fixed end

  // ---- PCIe slots ----
  [260, 175].forEach(function (y) {
    box(89, 7.5, 9.5, slotMat, -150, y, -75.3, g, bu);
    if (y === 260) rbox(91, 9, 10.5, 0.8, steel, -150, y, -75.2, g, bu);
    else box(91, 8.2, 10, blk, -150, y, -75.2, g, bu);
    box(86, 1.4, 0.4, grey, -150, y, -70.4, g, bu);
    box(70, 0.6, 0.3, gold, -156, y, -70.2, g, bu);
    box(1.4, 7.4, 1, blk, -150 - 89 / 2 + 22, y, -70.2, g, bu); // key gap
    box(6, 9.5, 11, grey, -100, y, -75, g, bu); // retention latch
    box(2, 9.8, 3, blk, -98, y, -69.6, g, bu);
  });
  [220, 120].forEach(function (y) {
    box(25, 7, 9, slotMat, -195, y, -75.5, g, bu);
    box(22, 1.2, 0.3, gold, -195, y, -70.9, g, bu);
    box(3, 7.2, 1, blk, -195 + 4, y, -70.8, g, bu);
  });

  // ---- Power stage: chokes, MOSFET rows, caps ----
  const choke = pm('board', 0x4a4d52, { metalness: 0.7, roughness: 0.4 });
  const chList = [], chL = [], fet = [];
  for (let ck = 0; ck < 7; ck++) { chList.push([-120 + ck * 12, 409, -75.5]); fet.push([-120 + ck * 12, 398, -78.5]); }
  for (let ck = 0; ck < 6; ck++) { chL.push([-148, 320 + ck * 12, -75.5]); fet.push([-138, 320 + ck * 12, -78.5, 0, 0, Math.PI / 2]); }
  inst(new THREE.BoxGeometry(9.5, 9.5, 7), choke, chList, g, bu);
  inst(new THREE.BoxGeometry(9.5, 9.5, 7), choke, chL, g, bu);
  inst(new THREE.BoxGeometry(5, 6, 1.6), blk, fet, g, bu);
  const capM = pm('board', 0x34363b, { metalness: 0.75, roughness: 0.3 });
  const capPos = [[-160, 322], [-160, 337], [-160, 352], [-160, 367], [-160, 382], [-142, 306], [-126, 306], [-110, 306], [-94, 306], [-78, 306]];
  inst(new THREE.CylinderGeometry(3.2, 3.2, 8, 16), capM, capPos.map((c) => [c[0], c[1], -75, Math.PI / 2, 0, 0]), g, bu);
  inst(new THREE.CylinderGeometry(3.3, 3.3, 0.5, 16), gold, capPos.map((c) => [c[0], c[1], -71, Math.PI / 2, 0, 0]), g, bu);

  // CMOS battery in holder
  inst(new THREE.CylinderGeometry(11.5, 11.5, 4, 32), blk, [[-60, 150, -77.8, Math.PI / 2, 0, 0]], g, bu);
  const cmos = cyl(10, 3, pm('board', 0xc9ccd1, { metalness: 0.9, roughness: 0.25 }), -60, 150, -76.5, g, bu, 32); cmos.rotation.x = Math.PI / 2;
  box(5, 3, 2.5, steel, -60, 162, -75.5, g, bu);

  // USB / small headers on the right edge
  [[0, 250], [0, 230], [0, 210]].forEach(function (h) { box(8, 14, 8, blk, h[0], h[1], -74, g, bu); });
  // 24-pin ATX body with latch ridge and pin cells
  box(15, 52, 16, blk, 14, 345, -71, g, bu);
  box(2, 46, 3, grey, 21, 345, -62, g, bu);
  const cells = [];
  for (let ar = 0; ar < 12; ar++) for (let ac = 0; ac < 2; ac++) cells.push([12 + ac * 4.4, 345 - 23 + ar * 4.2, -62.8]);
  inst(new THREE.BoxGeometry(3.4, 3.2, 0.5), grey, cells, g, bu);
  box(20, 10, 14, blk, -185, 432, -72, g, bu);
  box(14, 10, 14, blk, -160, 432, -72, g, bu);
  const ecells = [];
  for (let er = 0; er < 4; er++) for (let ec = 0; ec < 2; ec++) ecells.push([-192 + er * 4.2, 432 - 2.5 + ec * 4.2 - 2, -64.8]);
  inst(new THREE.BoxGeometry(3, 3, 0.5), grey, ecells, g, bu);

  // ---- Bottom-edge headers (gold pins) ----
  const hdrBases = [[-200, 141], [-170, 141], [-140, 141], [-110, 141], [-60, 141], [-20, 141]];
  const pins: number[][] = [], shroud: number[][] = [];
  hdrBases.forEach(function (hb) {
    shroud.push([hb[0], hb[1], -77.7]);
    for (let pc2 = 0; pc2 < 5; pc2++) for (let pr2 = 0; pr2 < 2; pr2++) pins.push([hb[0] - 5.08 + pc2 * 2.54, hb[1] - 1.27 + pr2 * 2.54, -73.5, Math.PI / 2, 0, 0]);
  });
  inst(new THREE.BoxGeometry(13, 6, 2.5), blk, shroud, g, bu);
  inst(new THREE.BoxGeometry(0.64, 6, 0.64), gold, pins, g, bu);
  // 4-pin fan headers
  const fh = [[-185, 437], [-30, 437], [10, 300], [10, 200], [-90, 141]];
  inst(new THREE.BoxGeometry(10, 5, 6), whiteH, fh.map((f) => [f[0], f[1], -76]), g, bu);
  inst(new THREE.BoxGeometry(8, 1, 1.2), dark2, fh.map((f) => [f[0], f[1], -72.6]), g, bu);

  // ---- SATA ports (right-angle) ----
  const sat = [], satT = [];
  for (let sa = 0; sa < 6; sa++) {
    const sy = 152 + (sa % 3) * 9, sz = -75 + Math.floor(sa / 3) * 7;
    sat.push([14, sy, sz]); satT.push([17, sy, sz]);
  }
  inst(new THREE.BoxGeometry(14, 7.5, 6), blk, sat, g, bu);
  inst(new THREE.BoxGeometry(6, 3.5, 4), gold, satT, g, bu);

  // ---- Standoff screws with washers ----
  const mh = [[-215, 432], [-110, 432], [15, 432], [-215, 300], [15, 300], [-215, 145], [-150, 145], [15, 145], [-60, 300]];
  inst(new THREE.CylinderGeometry(3.6, 3.6, 1.6, 40), steel, mh.map((h) => [h[0], h[1], -78.4, Math.PI / 2, 0, 0]), g, bu);
  inst(new THREE.CylinderGeometry(5.2, 5.2, 0.4, 40), gold, mh.map((h) => [h[0], h[1], -79.1, Math.PI / 2, 0, 0]), g, bu);
  inst(new THREE.BoxGeometry(4.4, 0.7, 0.4), dark2, mh.map((h) => [h[0], h[1], -77.5]), g, bu);

  // ---- Audio codec shield, audio caps, SMD scatter ----
  rbox(22, 22, 2.5, 0.8, steel, -200, 175, -77.6, g, bu);
  const acap = [];
  for (let a = 0; a < 6; a++) acap.push([-212 + a * 4.4, 158, -76.5, Math.PI / 2, 0, 0]);
  inst(new THREE.CylinderGeometry(1.8, 1.8, 5, 12), gold, acap, g, bu);
  const smdList: number[][] = [];
  for (let si2 = 0; si2 < 520; si2++) {
    const sx = -218 + rn() * 236, sy = 138 + rn() * 298;
    if (sx > -160 && sx < -60 && sy > 300 && sy < 410) continue;
    if (sx > -55 && sx < -8 && sy > 280 && sy < 430) continue;
    smdList.push([sx, sy, -78.7, 0, 0, rn() > 0.5 ? Math.PI / 2 : 0]);
  }
  inst(new THREE.BoxGeometry(1.6, 0.8, 0.5), pm('board', 0x3b3226, { roughness: 0.6 }), smdList, g, bu);

  // ---- 24-pin ATX and 8-pin EPS sleeved cable bundles ----
  const sleeve2 = pm('board', 0x0d0d0e, { roughness: 0.85, metalness: 0 });
  for (let ar = 0; ar < 12; ar++) for (let ac = 0; ac < 2; ac++) {
    const yy = 345 - 23 + ar * 4.2, zz = -74 + ac * 4.2;
    tube([[21.5, yy, zz], [34, yy, zz], [48, yy * 0.98 + 6, -90 + ac * 3], [58, yy * 0.97 + 10, -112]], 1.15, sleeve2, g, bu);
  }
  for (let er = 0; er < 4; er++) for (let ec = 0; ec < 2; ec++) {
    const ex = -192 + er * 4.2, ez = -75 + ec * 4.2;
    tube([[ex, 437, ez], [ex, 446, ez], [ex + 2, 452, -96], [ex + 4, 452, -113]], 1.15, sleeve2, g, bu);
  }
}
