import type { Build, Swap } from '../catalog';

/** The build with a what-if change applied. Pure: returns a new build, the original is untouched. */
export function applySwap(build: Build, swap: Swap): Build {
  const parts = { ...build.parts };
  if (swap.gpu) parts.gpu = [{ spec: swap.gpu, qty: 1 }];
  if (swap.cpu) parts.cpu = [{ spec: swap.cpu, qty: 1 }];
  if (swap.board) parts.board = [{ spec: swap.board, qty: 1 }];
  if (swap.psu) parts.psu = [{ spec: swap.psu, qty: 1 }];
  if (swap.ram) parts.ram = [{ ...swap.ram }];
  if (swap.addSsd) parts.ssd = [...parts.ssd, { spec: swap.addSsd, qty: 1 }];
  return { ...build, parts };
}
