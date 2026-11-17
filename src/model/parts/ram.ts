import * as THREE from 'three';
import type { PartTag, Kit } from '../kit';
import type { Shared } from './shared';

/** 4 x DDR4 module: black anodised two-piece spreader (stepped top edge, recessed channel, blank label), PCB, gold fingers, ICs. */
export function buildRam(kit: Kit, g: THREE.Group, _shared: Shared): void {
  const { pm, reg, box, inst, canvasTex } = kit;
  const ru = { part: 'ram' } as PartTag;
  const ramPcb = pm('ram', 0x0f2a1c, { roughness: 0.55, metalness: 0.2 });
  const ramInset = pm('ram', 0x2a2b2f, { metalness: 0.6, roughness: 0.32 });
  const ramEdge = pm('ram', 0x8d9097, { metalness: 0.9, roughness: 0.2 });
  const ramChip = pm('ram', 0x0b0b0c, { roughness: 0.45 });
  const blkR = pm('ram', 0x0c0c0d, { roughness: 0.7 });
  const gold = pm('ram', 0xc9a24a, { metalness: 0.95, roughness: 0.25 });
  const pad = pm('ram', 0x8a8f96, { metalness: 0.1, roughness: 0.85 });
  const smdM = pm('ram', 0x6b6358, { metalness: 0.6, roughness: 0.4 });
  const label = canvasTex(128, 56, (c) => {
    c.fillStyle = '#d9dbde'; c.fillRect(0, 0, 128, 56);
    c.fillStyle = '#2b2d31';
    c.fillRect(6, 6, 52, 5); c.fillRect(6, 15, 36, 3); c.fillRect(6, 21, 44, 3); c.fillRect(6, 27, 30, 3);
    for (let i = 0; i < 34; i++) c.fillRect(66 + i * 1.7, 32, i % 3 ? 0.8 : 1.3, 18);
    c.fillRect(100, 6, 22, 22);
    c.fillStyle = '#d9dbde';
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if ((i * 3 + j * 5) % 4 < 2) c.fillRect(102 + i * 4, 8 + j * 4, 3, 3);
  });
  const labelM = pm('ram', 0xffffff, { map: label, roughness: 0.6, metalness: 0.05 });

  // Spreader plate: shape x = module length (-> y), shape y = module height (-> z), extruded along thickness (-> x).
  const prof = new THREE.Shape();
  prof.moveTo(-66.5, 0); prof.lineTo(66.5, 0); prof.lineTo(66.5, 27); prof.lineTo(61, 31);
  prof.lineTo(48, 31); prof.lineTo(42, 33.5); prof.lineTo(12, 33.5); prof.lineTo(6, 30);
  prof.lineTo(-20, 30); prof.lineTo(-26, 33.5); prof.lineTo(-48, 33.5); prof.lineTo(-54, 31);
  prof.lineTo(-61, 31); prof.lineTo(-66.5, 27); prof.lineTo(-66.5, 0);
  const slot = new THREE.Path();
  slot.moveTo(-56, 8); slot.lineTo(-56, 13); slot.lineTo(56, 13); slot.lineTo(56, 8); slot.lineTo(-56, 8);
  prof.holes.push(slot);
  const plateGeo = new THREE.ExtrudeGeometry(prof, { depth: 2.4, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2, curveSegments: 4 });
  plateGeo.translate(0, 0, -1.2);
  plateGeo.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));

  const fingerGeo = new THREE.BoxGeometry(0.06, 1.2, 2.4);
  const chipGeo = new THREE.BoxGeometry(0.9, 11, 5.5);
  const smdGeo = new THREE.BoxGeometry(0.4, 1.0, 0.5);
  const padGeo = new THREE.BoxGeometry(0.5, 112, 1);
  const stripGeo = new THREE.BoxGeometry(0.4, 96, 0.8);
  const topGeo = new THREE.BoxGeometry(0.4, 30, 0.6);
  const notchGeo = new THREE.BoxGeometry(1.4, 2.2, 1.8);
  const latchGeo = new THREE.BoxGeometry(1.3, 1.4, 3);
  const blockGeo = new THREE.BoxGeometry(6.8, 5, 9);
  const keyY = -9.7;
  const anod = [0x17181a, 0x181a1c, 0x161719, 0x191a1c];
  const rough = [0.48, 0.52, 0.46, 0.5];
  const seat = [0, -0.2, 0.15, -0.1];

  [-48, -38, -24, -14].forEach((x, n) => {
    const s = new THREE.Group();
    s.position.set(x, 355, seat[n]);
    g.add(s);
    const plateM = pm('ram', anod[n], { metalness: 0.55, roughness: rough[n] });
    box(1.2, 133.35, 31, ramPcb, 0, 0, -63, s, ru);

    // Gold fingers (both faces), skipping the DDR4 key notch
    const f: number[][] = [];
    for (let i = 0; i < 70; i++) {
      const y = -64.5 + i * 1.85;
      if (Math.abs(y - keyY) < 2.2) continue;
      f.push([0.63, y, -77.2], [-0.63, y, -77.2]);
    }
    inst(fingerGeo, gold, f, s, ru);
    inst(notchGeo, ramChip, [[0, keyY, -77.6]], s, ru);
    inst(latchGeo, blkR, [[0, -66.2, -76.6], [0, 66.2, -76.6]], s, ru);

    // Memory ICs (visible through the slot), thermal pad edge, SMD parts on the lower PCB strip
    const ch: number[][] = [];
    for (let ci = 0; ci < 8; ci++) { const y = -55 + ci * 15.7; ch.push([1.05, y, -65.5], [-1.05, y, -65.5]); }
    inst(chipGeo, ramChip, ch, s, ru);
    inst(padGeo, pad, [[0.95, 0, -69.2], [-0.95, 0, -69.2]], s, ru);
    const sm: number[][] = [];
    for (let i = 0; i < 14; i++) { const y = -58 + i * 8.3 + (i % 3) * 0.7; sm.push([0.8, y, -74.6 + (i % 2) * 0.6], [-0.8, y, -74.4 - (i % 2) * 0.5]); }
    inst(smdGeo, smdM, sm, s, ru);

    // Heat spreader halves, channel inset, edge highlights
    [-1, 1].forEach((sd) => {
      const pl = new THREE.Mesh(plateGeo, plateM);
      pl.position.set(sd * 1.9, 0, -76);
      s.add(pl); reg(pl, ru);
      box(0.4, 96, 11, ramInset, sd * 3.7, 0, -54, s, ru);
    });
    inst(stripGeo, ramEdge, [[3.85, 0, -48], [3.85, 0, -60], [-3.85, 0, -48], [-3.85, 0, -60]], s, ru);
    inst(topGeo, ramEdge, [[3.6, 27, -42.8], [-3.6, 27, -42.8], [3.6, -37, -42.8], [-3.6, -37, -42.8]], s, ru);
    box(0.12, 60, 14, labelM, 3.95, 0, -54, s, ru);
    inst(blockGeo, blkR, [[0, 71.5, -73], [0, -71.5, -73]], s, ru);
  });
}
