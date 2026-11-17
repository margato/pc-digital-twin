import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { PartTag, Kit } from '../kit';
import type { Shared } from './shared';

/**
 * M.2 2280 NVMe SSD (single-sided, 80 x 22 mm), centred at (-110, 285) on the board plane.
 * Local layout "u" runs along the card: u = -40 gold edge connector, u = +40 mounting notch.
 * PCB occupies z -79..-78.2; packages are 1.0 mm tall (top -77.2); label + thermal pads top out at -76.8.
 */
export function buildSsd(kit: Kit, g: THREE.Group, _shared: Shared): void {
  const { pm, inst, canvasTex, reg } = kit;
  const su = { part: 'ssd' } as PartTag;
  const CX = -110, CY = 285;
  const ZP0 = -79, ZP1 = -78.2; // PCB bottom / top
  const ZPK = -77.2; // package top
  const KEY_Y = -5;

  // seeded pseudo random (deterministic texture detail)
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // ---- PCB with M-key notch and screw notch ----
  const sh = new THREE.Shape();
  sh.moveTo(-40, -11);
  sh.lineTo(-40, KEY_Y - 0.7);
  sh.lineTo(-37.6, KEY_Y - 0.7);
  sh.absarc(-37.6, KEY_Y, 0.7, -Math.PI / 2, Math.PI / 2, true);
  sh.lineTo(-40, KEY_Y + 0.7);
  sh.lineTo(-40, 11);
  sh.lineTo(38.4, 11);
  sh.absarc(40, 0, 1.6, Math.PI / 2 + 0.9, -Math.PI / 2 - 0.9, true);
  sh.lineTo(38.4, -11);
  sh.lineTo(-40, -11);
  const pcbGeo = new THREE.ExtrudeGeometry(sh, { depth: ZP1 - ZP0, bevelEnabled: false, curveSegments: 20 });
  const pcb = new THREE.Mesh(pcbGeo, pm('ssd', 0x16181b, { roughness: 0.55, metalness: 0.1 }));
  pcb.position.set(CX, CY, ZP0);
  g.add(pcb); reg(pcb, su);

  // ---- solder mask plane with traces, vias and silkscreen (alpha-cut at the notch) ----
  const MU0 = -36, MW = 76, PX = 4;
  const maskTex = canvasTex(MW * PX, 22 * PX, (c) => {
    const W = MW * PX, H = 22 * PX;
    c.fillStyle = '#15181a'; c.fillRect(0, 0, W, H);
    const X = (u: number) => (u - MU0) * PX, Y = (y: number) => (11 - y) * PX;
    // traces
    c.strokeStyle = 'rgba(120,135,140,0.10)'; c.lineWidth = 0.7;
    for (let i = 0; i < 70; i++) {
      const y0 = -10 + rnd() * 20, u0 = -36 + rnd() * 70, len = 3 + rnd() * 12;
      c.beginPath(); c.moveTo(X(u0), Y(y0)); c.lineTo(X(u0 + len), Y(y0));
      c.lineTo(X(u0 + len + 1.5), Y(y0 + (rnd() - 0.5) * 3)); c.stroke();
    }
    // vias
    c.fillStyle = 'rgba(160,170,165,0.22)';
    for (let i = 0; i < 120; i++) { c.beginPath(); c.arc(X(-35 + rnd() * 72), Y(-10.4 + rnd() * 20.8), 0.8, 0, 7); c.fill(); }
    // component pad outlines
    c.strokeStyle = 'rgba(210,215,210,0.35)'; c.lineWidth = 1;
    c.strokeRect(X(-25.3), Y(5.8), 8.6 * PX, 11.6 * PX);
    c.strokeRect(X(-13.2), Y(6.2), 12.4 * PX, 12.4 * PX);
    // silkscreen marks
    c.fillStyle = 'rgba(225,228,222,0.55)';
    c.fillRect(X(-33.2), Y(10.3), 3 * PX, 0.3 * PX);
    c.fillRect(X(31), Y(-9.5), 4 * PX, 0.4 * PX);
    c.fillRect(X(31), Y(-9.5), 0.4 * PX, 1.6 * PX);
    c.beginPath(); c.arc(X(-1), Y(-9), 0.7 * PX, 0, 7); c.fill();
    // cut-outs (alpha) for the screw notch
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.arc(X(40), Y(0), 1.6 * PX, 0, 7); c.fill();
    c.globalCompositeOperation = 'source-over';
  });
  const mask = new THREE.Mesh(new THREE.PlaneGeometry(MW, 22),
    pm('ssd', 0xffffff, { map: maskTex, alphaTest: 0.5, roughness: 0.5, metalness: 0.08 }));
  mask.position.set(CX + MU0 + MW / 2, CY, ZP1 + 0.01);
  g.add(mask); reg(mask, su);

  // ---- gold edge connector: 33 fingers on top, 34 underneath (67 total), M-key gap ----
  const fy: number[] = [];
  for (let y = -10.25; y <= 10.3 && fy.length < 40; y += 0.5) if (Math.abs(y - KEY_Y) > 1.2) fy.push(y);
  const topY = fy.slice(0, 33), botY = fy.slice(0, 34);
  const gold = pm('ssd', 0xd2ab47, { metalness: 0.95, roughness: 0.28 });
  const fgeo = new THREE.BoxGeometry(3.6, 0.3, 0.05);
  inst(fgeo, gold, topY.map((y) => [CX - 38, CY + y, ZP1 + 0.015]), g, su);
  inst(fgeo, gold, botY.map((y) => [CX - 38, CY + y, ZP0 - 0.025]), g, su);

  // ---- packages: controller (under label cut-out), DRAM, 2 x NAND ----
  const epoxy = pm('ssd', 0x131417, { roughness: 0.42, metalness: 0.12 });
  const ctrl = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 1.0), epoxy);
  ctrl.position.set(CX - 7, CY, (ZP1 + ZPK) / 2);
  g.add(ctrl); reg(ctrl, su);
  const dram = new THREE.Mesh(new THREE.BoxGeometry(8, 11, 0.9), epoxy);
  dram.position.set(CX - 21, CY, ZP1 + 0.45);
  g.add(dram); reg(dram, su);
  inst(new THREE.BoxGeometry(11.5, 13.5, 1.0), epoxy,
    [[CX + 7, CY, (ZP1 + ZPK) / 2], [CX + 20, CY, (ZP1 + ZPK) / 2]], g, su);

  // laser markings on controller and DRAM (marks only, no text)
  const chipTex = (w: number, h: number) => canvasTex(w * 8, h * 8, (c) => {
    const W = w * 8, H = h * 8;
    c.fillStyle = '#17181b'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(190,195,200,0.10)'; c.lineWidth = 1; c.strokeRect(3, 3, W - 6, H - 6);
    c.fillStyle = 'rgba(200,205,210,0.45)';
    c.beginPath(); c.arc(12, H - 12, 3, 0, 7); c.fill();
    for (let i = 0; i < 4; i++) c.fillRect(W * 0.18, H * (0.3 + i * 0.12), W * (0.64 - (i === 3 ? 0.3 : 0)), 3);
  });
  const mk = (w: number, h: number, x: number, z: number) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, h - 0.4),
      pm('ssd', 0xffffff, { map: chipTex(w - 0.4, h - 0.4), roughness: 0.45, metalness: 0.1 }));
    p.position.set(x, CY, z); g.add(p); reg(p, su);
  };
  mk(12, 12, CX - 7, ZPK + 0.01);
  mk(8, 11, CX - 21, ZP1 + 0.91);

  // ---- graphene-style aluminium heat-spreader label: cut around controller, ends past NAND #1 ----
  const SU0 = -15.5, SU1 = 23.5, SW = SU1 - SU0, SH = 21, SUC = (SU0 + SU1) / 2;
  const stTex = canvasTex(SW * 8, SH * 8, (c) => {
    const W = SW * 8, H = SH * 8;
    const gr = c.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, '#b9bec4'); gr.addColorStop(0.5, '#d5d9dd'); gr.addColorStop(1, '#a8adb4');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(80,90,100,0.10)'; c.lineWidth = 1;
    for (let i = 0; i < 90; i++) { const y = rnd() * H; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y + (rnd() - 0.5) * 4); c.stroke(); }
    // honeycomb accents
    c.strokeStyle = 'rgba(60,70,80,0.22)'; c.lineWidth = 1.2;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) {
      const cx = W - 20 - k * 13 - (r % 2) * 6.5, cy = 18 + r * 11.5;
      c.beginPath();
      for (let a = 0; a < 6; a++) c.lineTo(cx + 7 * Math.cos(a * Math.PI / 3), cy + 7 * Math.sin(a * Math.PI / 3));
      c.closePath(); c.stroke();
    }
    // blank generic spec label with barcode marks
    c.fillStyle = '#eceeef'; c.fillRect(W - 150, H - 68, 134, 54);
    c.fillStyle = '#2a2d31';
    for (let i = 0; i < 34; i++) c.fillRect(W - 140 + i * 3.6, H - 36, 1 + (i % 3), 18);
    c.fillStyle = 'rgba(40,44,50,0.55)';
    c.fillRect(W - 140, H - 60, 70, 3); c.fillRect(W - 140, H - 52, 40, 3);
    c.fillStyle = '#6b7078'; c.fillRect(8, H - 14, W * 0.18, 3);
  });
  stTex.repeat.set(1 / SW, 1 / SH); stTex.offset.set(0.5, 0.5);
  const sSh = kit.rrShape(SW, SH, 1.2);
  const hole = new THREE.Path(), hc = -7 - SUC, hs = 6.3;
  hole.moveTo(hc - hs, -hs); hole.lineTo(hc - hs, hs); hole.lineTo(hc + hs, hs); hole.lineTo(hc + hs, -hs); hole.closePath();
  sSh.holes.push(hole);
  const sticker = new THREE.Mesh(new THREE.ExtrudeGeometry(sSh, { depth: 0.15, bevelEnabled: false, curveSegments: 6 }),
    pm('ssd', 0xffffff, { map: stTex, metalness: 0.7, roughness: 0.38 }));
  sticker.position.set(CX + SUC, CY, ZPK);
  g.add(sticker); reg(sticker, su);

  // ---- thin thermal pads on controller and NAND ----
  const pg = [
    new THREE.BoxGeometry(10, 10, 0.4).translate(CX - 7, CY, ZPK + 0.2),
    new THREE.BoxGeometry(9.5, 11.5, 0.25).translate(CX + 7, CY, -76.925),
    new THREE.BoxGeometry(9.5, 11.5, 0.25).translate(CX + 20, CY, -76.925),
  ];
  const pads = new THREE.Mesh(mergeGeometries(pg, false), pm('ssd', 0x8e99a8, { roughness: 0.9, metalness: 0 }));
  g.add(pads); reg(pads, su);

  // ---- SMD passives and PMIC ----
  const pm0 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.8), epoxy);
  pm0.position.set(CX - 30.5, CY + 3, ZP1 + 0.4);
  g.add(pm0); reg(pm0, su);
  const zc = (h: number) => ZP1 + h / 2;
  inst(new THREE.BoxGeometry(2, 1.6, 1.0), pm('ssd', 0x6c7077, { metalness: 0.6, roughness: 0.4 }),
    [[CX - 29, CY - 8, zc(1)], [CX - 29, CY + 8.5, zc(1)]], g, su);
  inst(new THREE.BoxGeometry(1.6, 0.8, 0.7), pm('ssd', 0x9d8660, { roughness: 0.55, metalness: 0.2 }),
    [[-34, -8], [-34, -3.5], [-34, 0.5], [-34, 6], [-34, 9], [-27.5, -9.5], [-27.5, 9.5], [-27.5, 0], [-16.5, -9], [-16.5, 9], [29, 0], [34, -6.5]]
      .map((p, i) => [CX + p[0], CY + p[1], zc(0.7), 0, 0, i % 3 === 0 ? Math.PI / 2 : 0]), g, su);
  inst(new THREE.BoxGeometry(1.0, 0.5, 0.32), pm('ssd', 0x303236, { roughness: 0.5, metalness: 0.2 }),
    [[-36, -9.5], [-36, 4], [-32, -5.5], [-32, 8], [-32, -9.8], [-25.5, 8.5], [-25.5, -8], [-17, 3], [-17, -3], [30, -8], [30, 8], [33, 4], [33, -9], [35, 8.5], [27.5, 5], [27.5, -5]]
      .map((p, i) => [CX + p[0], CY + p[1], zc(0.32), 0, 0, i % 2 ? Math.PI / 2 : 0]), g, su);

  // ---- mounting notch: screw head, cross slot and brass standoff below ----
  const head = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.5, 24), pm('ssd', 0xaeb3b9, { metalness: 0.85, roughness: 0.3 }));
  head.rotation.x = Math.PI / 2; head.position.set(CX + 40, CY, ZP1 + 0.25);
  g.add(head); reg(head, su);
  inst(new THREE.BoxGeometry(2.4, 0.35, 0.12), pm('ssd', 0x2a2c30, { roughness: 0.6 }),
    [[CX + 40, CY, ZP1 + 0.5, 0, 0, 0], [CX + 40, CY, ZP1 + 0.5, 0, 0, Math.PI / 2]], g, su);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 1.2, 6), pm('ssd', 0xb5883a, { metalness: 0.9, roughness: 0.32 }));
  stand.rotation.x = Math.PI / 2; stand.position.set(CX + 40, CY, ZP0 - 0.6);
  g.add(stand); reg(stand, su);
}
