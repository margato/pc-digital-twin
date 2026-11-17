import * as THREE from 'three';
import type { PartTag, Kit } from '../kit';
import type { Shared } from './shared';

export function buildCooler(kit: Kit, g: THREE.Group, shared: Shared): void {
  const { pm, box, rbox, cyl, torus, tube, fan, inst, canvasTex } = kit;
  const { radTex } = shared;
  // Cooler Master MasterLiquid PL360 Flux style AIO: pump head, braided hoses, 360 mm radiator, three 120 mm fans
  const cl = { part: 'cooler' } as PartTag;
  const coolMat = pm('cooler', 0x121214, { roughness: 0.5, metalness: 0.4 });
  const matte = pm('cooler', 0x17171a, { roughness: 0.78, metalness: 0.25 });
  const gloss = pm('cooler', 0x0b0b0d, { roughness: 0.12, metalness: 0.55 });
  const metal = pm('cooler', 0x8d9199, { roughness: 0.35, metalness: 0.9 });
  const rubber = pm('cooler', 0x0d0d0e, { roughness: 0.95, metalness: 0 });
  const glow = pm('cooler', 0x52a8ff, { emissive: 0x52a8ff, emissiveIntensity: 1.4, roughness: 0.4, metalness: 0 });

  // ---- pump head: two-tone housing, infinity-mirror cap ----
  // pump 75 mm across, 40 mm tall (spec sheet), resting on the CPU: z -72.3 to -32.3
  const pump = cyl(37.5, 40, matte, -110, 355, -52.3, g, cl);
  pump.rotation.x = Math.PI / 2;
  const band = cyl(38.5, 5, gloss, -110, 355, -37.3, g, cl); band.rotation.x = Math.PI / 2;
  const base = cyl(36, 4, coolMat, -110, 355, -72, g, cl); base.rotation.x = Math.PI / 2;
  // thin ARGB ring around the rim of the top (photo: PL360 Flux pump)
  const pr = torus(35.6, 1.1, glow, g, cl); pr.rotation.x = 0; pr.position.set(-110, 355, -31.8);
  const capTex = canvasTex(128, 128, function (c) {
    c.fillStyle = '#05070b'; c.fillRect(0, 0, 128, 128);
    const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(60,110,190,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
    // fine lathe grooves across the top (photo: concentric machining lines, no glow rings)
    for (let i = 0; i < 40; i++) {
      c.strokeStyle = i % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.5)'; c.lineWidth = 0.7;
      c.beginPath(); c.arc(64, 64, 4 + i * 1.4, 0, Math.PI * 2); c.stroke();
    }
    // hexagon logo at the centre of the head (photo: PL360 Flux top)
    c.strokeStyle = 'rgba(160,210,255,0.9)'; c.lineWidth = 2.5; c.beginPath();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; c.lineTo(64 + 20 * Math.cos(a), 64 + 20 * Math.sin(a)); }
    c.closePath(); c.stroke();
  });
  const cap = cyl(31, 2.5, pm('cooler', 0xffffff, { map: capTex, metalness: 0.6, roughness: 0.1 }), -110, 355, -32.6, g, cl);
  cap.rotation.x = Math.PI / 2;

  // ---- LGA1700 backplate with spring screws ----
  rbox(84, 84, 4, 3, pm('cooler', 0x2a2b2f, { metalness: 0.7, roughness: 0.3 }), -110, 355, -72, g, cl);
  const corners: number[][] = [];
  [-1, 1].forEach(function (sx) { [-1, 1].forEach(function (sy) { corners.push([-110 + sx * 36, 355 + sy * 36, -77]); }); });
  inst(new THREE.CylinderGeometry(3.6, 3.6, 6, 14), metal, corners, g, cl);
  inst(new THREE.CylinderGeometry(4.8, 4.8, 3, 14), rubber, corners.map(function (p) { return [p[0], p[1], p[2] - 4.5, Math.PI / 2]; }), g, cl);
  inst(new THREE.CylinderGeometry(2.2, 2.2, 8, 10), metal, corners.map(function (p) { return [p[0], p[1], p[2] + 1, Math.PI / 2]; }), g, cl);

  // ---- radiator ----
  const radMat = pm('cooler', 0xffffff, { map: radTex, roughness: 0.7, metalness: 0.3 });
  const tankMat = pm('cooler', 0x1c1c1f, { metalness: 0.5, roughness: 0.4 });
  box(364, 27.2, 119.6, radMat, -5, 488.4, 5, g, cl);
  const finTex = canvasTex(64, 32, function (c) {
    c.fillStyle = '#6e737b'; c.fillRect(0, 0, 64, 32);
    c.strokeStyle = '#2b2e33'; c.lineWidth = 1.2; c.beginPath();
    for (let i = 0; i <= 16; i++) { c.lineTo(i * 4, i % 2 ? 4 : 28); }
    c.stroke();
    c.beginPath(); for (let i = 0; i <= 16; i++) { c.lineTo(i * 4, i % 2 ? 28 : 4); } c.stroke();
  });
  finTex.wrapS = THREE.RepeatWrapping; finTex.repeat.set(7, 1);
  const finMat = pm('cooler', 0xffffff, { map: finTex, roughness: 0.6, metalness: 0.5 });
  box(364, 24, 0.4, finMat, -5, 488.4, 64.9, g, cl);
  box(364, 24, 0.4, finMat, -5, 488.4, -54.9, g, cl);
  rbox(15, 27.2, 119.6, 4, tankMat, -5 - 189.5, 488.4, 5, g, cl);
  rbox(15, 27.2, 119.6, 4, tankMat, -5 + 189.5, 488.4, 5, g, cl);
  // end tank ribs and fill-port screws
  const ribs: number[][] = [];
  [-194.5, 184.5].forEach(function (x) { [-30, 5, 40].forEach(function (z) { ribs.push([x, 502.2, z]); }); });
  inst(new THREE.BoxGeometry(11, 0.8, 2), metal, ribs, g, cl);
  const screws: number[][] = [[-194.5, 502.5, 52], [-194.5, 502.5, -42]];
  inst(new THREE.CylinderGeometry(3.4, 3.4, 2.4, 14), metal, screws, g, cl);
  inst(new THREE.BoxGeometry(4.6, 0.6, 1), gloss, screws.map(function (p) { return [p[0], p[1] + 1.3, p[2]]; }), g, cl);

  // ---- fans: 9 blades, ARGB ring, rubber corner pads ----
  const aioFan = { frame: coolMat, hub: pm('cooler', 0xcfd6e3, { emissive: 0x4f6fa8, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0 }), blade: pm('cooler', 0x9aa0a8, { transparent: true, opacity: 0.6, roughness: 0.35, metalness: 0, depthWrite: false }) };
  const pads: number[][] = [];
  [-125, -5, 115].forEach(function (x) {
    const f = fan(55, 25, aioFan, cl, { square: 120, glow: glow, speed: 10, blades: 9 });
    f.position.set(x, 462.3, 5); g.add(f);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (c) { pads.push([x + c[0] * 52.5, 449.4, 5 + c[1] * 52.5]); });
  });
  inst(new THREE.CylinderGeometry(4.6, 4.6, 1.2, 14), rubber, pads, g, cl);

  // ---- braided hoses with swivel fittings and rubber sleeves ----
  const braid = canvasTex(32, 32, function (c) {
    c.fillStyle = '#111113'; c.fillRect(0, 0, 32, 32);
    c.strokeStyle = '#2a2b2f'; c.lineWidth = 3;
    for (let i = -32; i < 64; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 32, 32); c.stroke(); }
    c.strokeStyle = '#08080a'; c.lineWidth = 1.5;
    for (let i = -32; i < 64; i += 8) { c.beginPath(); c.moveTo(i + 32, 0); c.lineTo(i, 32); c.stroke(); }
  });
  braid.wrapS = braid.wrapT = THREE.RepeatWrapping; braid.repeat.set(70, 3);
  const hose = pm('cooler', 0xffffff, { map: braid, roughness: 0.9, metalness: 0 });
  // A: left pump port to radiator tank (z -40); B: right pump port to tank (z -10)
  // two hoses leave the pump's +x edge sideways (photo), then climb to the radiator's near tank
  // hoses and fittings run at z -40: above the RAM slots (their top is at z -47), so they never cross a DIMM
  tube([[-47, 343, -40], [-25, 360, -40], [-15, 405, -40], [-30, 436, -40], [-40, 441, -40], [60, 441, -40], [150, 441, -40], [168, 441.5, -40], [180, 446, -40], [186, 456, -40], [186, 466, -40]], 5.5, hose, g, cl);
  tube([[-47, 367, -40], [-25, 380, -40], [-12, 415, -40], [-20, 434, -30], [40, 428, -14], [120, 428, -10], [165, 428, -10], [180, 435, -10], [186, 450, -10], [186, 466, -10]], 5.5, hose, g, cl);
  // pump-side swivel fittings, horizontal out of the pump's +x edge (photo)
  [343, 367].forEach(function (y) {
    const f = cyl(8, 10, metal, -67, y, -40, g, cl, 24); f.rotation.z = Math.PI / 2;
    const s = cyl(6.9, 12, rubber, -55, y, -40, g, cl, 24); s.rotation.z = Math.PI / 2;
    const r = torus(7.4, 1.4, metal, g, cl); r.rotation.y = Math.PI / 2; r.position.set(-62, y, -40);
  });
  // radiator-side fittings (hose points down into the tank)
  [-40, -10].forEach(function (z) {
    cyl(8, 11, metal, 186, 469.3, z, g, cl, 24);
    cyl(6.9, 14, rubber, 186, 458, z, g, cl, 24);
    torus(7.4, 1.4, metal, g, cl).position.set(186, 463.5, z);
  });

  // ---- cables: fan daisy chain, then to the pump; pump cable to the board header ----
  const cable = pm('cooler', 0x0c0c0d, { roughness: 0.85, metalness: 0 });
  tube([[115, 452, -57], [90, 446, -62], [30, 446, -62], [-5, 452, -57]], 1.5, cable, g, cl);
  tube([[-5, 452, -57], [-30, 446, -62], [-95, 446, -62], [-125, 452, -57]], 1.5, cable, g, cl);
  tube([[-125, 452, -57], [-132, 430, -62], [-118, 402, -64], [-100, 384, -62], [-90, 372, -60]], 1.5, cable, g, cl);
  // pump lead to the board header: routed left of the RAM slots (x < -50), then above them (y 440 > slot top 422)
  tube([[-82, 345, -62], [-62, 360, -66], [-58, 400, -62], [-58, 440, -62], [-32, 440, -66]], 1.5, cable, g, cl);
  box(8, 14, 5, pm('cooler', 0xe8e4d8, { roughness: 0.6, metalness: 0 }), -32, 437, -66, g, cl);
}
