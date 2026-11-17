import * as THREE from 'three';

type CanvasTex = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => THREE.CanvasTexture;

/** Procedural canvas textures used by the PC model. */
export function makeTextures(canvasTex: CanvasTex) {
  const radTex = canvasTex(512, 64, function (g) {
    g.fillStyle = '#141416'; g.fillRect(0, 0, 512, 64);
    g.fillStyle = '#26272b';
    for (let x = 0; x < 512; x += 4) g.fillRect(x, 0, 2, 64);
  });

  const finTex = canvasTex(256, 256, function (g) {
    g.fillStyle = '#16171a'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#5d6066';
    for (let x = 0; x < 256; x += 5) g.fillRect(x, 0, 2, 256);
    g.fillStyle = 'rgba(184,115,51,.85)';
    [40, 100, 160, 220].forEach(function (y) { g.fillRect(0, y, 256, 7); });
  });

  const boardTex = canvasTex(512, 640, function (g) {
    g.fillStyle = '#2a2c30'; g.fillRect(0, 0, 512, 640);
    let seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1.5;
    for (let i = 0; i < 140; i++) {
      const x = rnd() * 512, y = rnd() * 640, l = 20 + rnd() * 80;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.lineTo(x + l + 14, y + 14); g.lineTo(x + l + 14, y + 14 + l * 0.6); g.stroke();
    }
    g.strokeStyle = 'rgba(214,170,60,.35)'; g.lineWidth = 2;
    for (let j = 0; j < 14; j++) { let a = rnd() * 512, b = rnd() * 640; g.beginPath(); g.moveTo(a, b); g.lineTo(a + 60, b); g.lineTo(a + 80, b + 20); g.stroke(); }
    g.fillStyle = '#b9bcc2';
    [[14, 14], [498, 14], [14, 626], [498, 626], [256, 14], [256, 626], [14, 320], [498, 320]].forEach(function (h) { g.beginPath(); g.arc(h[0], h[1], 7, 0, Math.PI * 2); g.fill(); });
  });
  const perfTex = canvasTex(128, 128, function (g) {
    g.fillStyle = '#18181b'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#050506';
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      g.beginPath(); g.arc(8 + x * 16 + (y % 2) * 8, 8 + y * 16, 4.5, 0, Math.PI * 2); g.fill();
    }
  });
  perfTex.wrapS = perfTex.wrapT = THREE.RepeatWrapping;
  perfTex.repeat.set(30, 14);
    return { perfTex, finTex, boardTex, radTex };
}
