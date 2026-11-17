import { displayName } from '../catalog';
import { fmtGB, type PartItem, type PartRow } from '../data/parts';
import type { Dimensions, RamSpec } from '../catalog';
import { localeOf, t } from '../i18n';
import type { ResolvedBuild } from './resolve';

/** "ASUS Prime GeForce RTX 5080 OC": the maker goes first unless the name already starts with it. */

const mm3 = (d: Dimensions) => `${d.w} × ${d.h} × ${d.d} mm`;
const mm2 = (d: Dimensions) => `${d.w} × ${d.h} mm`;
const socket = (s: string) => s.replace(/^LGA(\d+)/, 'LGA $1');
const effLabel = (s: string) => s.replace('80+', '80 Plus');
const grouped = (n: number) => n.toLocaleString(localeOf());
/** Decimal numbers in the active locale (2.5 -> "2,5" in Portuguese). */
const dec = (n: number, digits = 1) => n.toLocaleString(localeOf(), { minimumFractionDigits: 0, maximumFractionDigits: digits });
const fixed1 = (n: number) => n.toLocaleString(localeOf(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Memory module: one item per stick, so four sticks give four items. */
function ramItem(spec: RamSpec): PartItem {
  return {
    spec: spec.id,
    // The sheet name already carries capacity and speed, which the detail line shows; keep the row title to maker + line.
    name: spec.brand === spec.manufacturer
      ? t('rows.ram.name', { maker: spec.manufacturer, memType: spec.memType })
      : `${spec.manufacturer} ${spec.brand}`,
    detail: `${spec.moduleGB} GB · ${spec.memType}-${spec.speedMT} · CL${spec.cl}`,
    specs: [
      { k: t('rows.ram.capacity'), v: `${spec.moduleGB} GB` },
      { k: t('rows.ram.type'), v: spec.memType },
      { k: t('rows.ram.speed'), v: `${spec.speedMT} MHz` },
      { k: t('rows.ram.latency'), v: `CL${spec.cl}` }
    ],
    gb: spec.moduleGB
  };
}

/** The Parts list for a resolved build, in the dock order. Memory and drives expand by quantity. */
export function partRows(r: ResolvedBuild): PartRow[] {
  const { gpu, cpu, cooler, board, psu, case: kase } = r;
  return [
    {
      part: 'gpu', k: t('rows.k.gpu'), type: t('rows.type.gpu'),
      items: [{
        spec: gpu.id, name: displayName(gpu),
        detail: t('rows.gpu.detail', { vram: gpu.vramGB, vramType: gpu.vramType, slots: dec(gpu.slots), connector: gpu.connector }),
        specs: [
          { k: t('rows.gpu.chip'), v: gpu.chip },
          { k: t('rows.gpu.vram'), v: `${gpu.vramGB} GB` },
          { k: t('rows.gpu.memory'), v: gpu.vramType },
          { k: t('rows.gpu.slots'), v: dec(gpu.slots) },
          { k: t('rows.gpu.power'), v: `${gpu.powerW} W` },
          { k: t('rows.gpu.connector'), v: gpu.connector }
        ],
        dims: gpu.dims ? mm3(gpu.dims) : undefined
      }]
    },
    {
      part: 'cpu', k: t('rows.k.cpu'), type: t('rows.type.cpu'),
      items: [{
        spec: cpu.id, name: displayName(cpu),
        detail: t('rows.cpu.detail', { cores: cpu.cores, threads: cpu.threads, ghz: fixed1(cpu.boostClockGHz), socket: socket(cpu.socket) }),
        specs: [
          { k: t('rows.cpu.cores'), v: String(cpu.cores) },
          { k: t('rows.cpu.threads'), v: String(cpu.threads) },
          { k: t('rows.cpu.boost'), v: `${fixed1(cpu.boostClockGHz)} GHz` },
          { k: t('rows.cpu.base'), v: `${fixed1(cpu.baseClockGHz)} GHz` },
          { k: t('rows.cpu.power'), v: `${cpu.maxPowerW} W` },
          { k: t('rows.cpu.socket'), v: socket(cpu.socket) }
        ]
      }]
    },
    {
      part: 'cooler', k: t('rows.k.cooler'), type: t('rows.type.cooler'),
      items: [{
        spec: cooler.id, name: displayName(cooler),
        detail: cooler.radiatorMm
          ? t('rows.cooler.fansRadiator', { count: cooler.fanCount, mm: cooler.fanMm, radiator: cooler.radiatorMm })
          : t('rows.cooler.fans', { count: cooler.fanCount, mm: cooler.fanMm }),
        specs: [
          { k: t('rows.cooler.type'), v: t(cooler.type === 'aio' ? 'rows.cooler.typeAio' : 'rows.cooler.typeAir') },
          ...(cooler.radiatorMm ? [{ k: t('rows.cooler.radiator'), v: `${cooler.radiatorMm} mm` }] : []),
          { k: t('rows.cooler.fansLabel'), v: `${cooler.fanCount} × ${cooler.fanMm} mm` },
          { k: t('rows.cooler.power'), v: `${cooler.powerW} W` }
        ],
        dims: cooler.dims ? (cooler.type === 'aio' ? t('rows.cooler.radiatorDims', { dims: mm3(cooler.dims) }) : mm3(cooler.dims)) : undefined
      }]
    },
    {
      part: 'ram', k: t('rows.k.ram'), type: t('rows.type.ram'),
      items: r.ram.flatMap((m) => Array.from({ length: m.qty }, () => ramItem(m.spec)))
    },
    {
      part: 'board', k: t('rows.k.board'), type: t('rows.type.board'),
      items: [{
        spec: board.id, name: displayName(board),
        detail: t('rows.board.detail', { chipset: board.chipset, memType: board.memType, m2: board.m2Slots }),
        specs: [
          { k: t('rows.board.chipset'), v: board.chipset },
          { k: t('rows.board.socket'), v: socket(board.socket) },
          { k: t('rows.board.form'), v: board.formFactor },
          { k: t('rows.board.memory'), v: board.memType },
          { k: t('rows.board.ramSlots'), v: String(board.ramSlots) },
          { k: t('rows.board.m2'), v: String(board.m2Slots) }
        ],
        dims: board.dims ? `${board.formFactor} ${mm2(board.dims)}` : undefined
      }]
    },
    {
      part: 'ssd', k: t('rows.k.ssd'), type: t('rows.type.ssd'),
      items: r.ssd.flatMap((d) => Array.from({ length: d.qty }, (): PartItem => {
        const s = d.spec;
        const link = s.iface === 'NVMe' && s.pcieGen ? `NVMe PCIe ${s.pcieGen}.0` : s.iface;
        return {
          spec: s.id, name: displayName(s),
          detail: `${fmtGB(s.capacityGB)} · ${link} · ${grouped(s.readMBs)} / ${grouped(s.writeMBs)} MB/s`,
          specs: [
            { k: t('rows.ssd.capacity'), v: fmtGB(s.capacityGB) },
            { k: t('rows.ssd.link'), v: link },
            { k: t('rows.ssd.read'), v: `${grouped(s.readMBs)} MB/s` },
            { k: t('rows.ssd.write'), v: `${grouped(s.writeMBs)} MB/s` }
          ],
          dims: s.dims ? `${s.formFactor} · ${mm2(s.dims)}` : undefined,
          gb: s.capacityGB
        };
      }))
    },
    {
      part: 'psu', k: t('rows.k.psu'), type: t('rows.type.psu'),
      items: [{
        spec: psu.id, name: displayName(psu),
        detail: `${grouped(psu.wattage)} W · ${effLabel(psu.efficiency)} · ${psu.atx}`,
        specs: [
          { k: t('rows.psu.power'), v: `${grouped(psu.wattage)} W` },
          { k: t('rows.psu.efficiency'), v: effLabel(psu.efficiency) },
          { k: t('rows.psu.atx'), v: psu.atx },
          { k: t('rows.psu.native'), v: t(psu.native12v2x6 ? 'rows.yes' : 'rows.no') }
        ],
        dims: psu.dims ? mm3(psu.dims) : undefined
      }]
    },
    {
      part: 'case', k: t('rows.k.case'), type: t('rows.type.case'),
      items: [{
        spec: kase.id, name: displayName(kase),
        detail: t('rows.case.detail', { forms: kase.formFactors.join(' / '), front: kase.frontFans, rear: kase.rearFans }),
        specs: [
          { k: t('rows.case.forms'), v: kase.formFactors.join(' / ') },
          { k: t('rows.case.gpuMax'), v: `${kase.gpuMaxLenMm} mm` },
          { k: t('rows.case.slots'), v: String(kase.expansionSlots) },
          { k: t('rows.case.fans'), v: `${kase.frontFans} / ${kase.rearFans}` }
        ],
        dims: kase.dims ? t('rows.case.dims', { dims: mm3(kase.dims) }) : undefined
      }]
    }
  ];
}

/** Memory limits of the build: the lower of the board's and the CPU's maximum. */
export function ramLimits(r: ResolvedBuild) {
  const maxGB = Math.min(r.board.maxRamGB, r.cpu.maxRamGB);
  const slots = r.board.ramSlots;
  return {
    maxGB,
    slots,
    perSlotMaxGB: maxGB / slots,
    limitedBy: t('rows.ram.limitedBy', { board: r.board.name, cpu: r.cpu.name })
  };
}

/** Memory profile. XMP/EXPO is assumed on: the kit runs at its rated speed. JEDEC is the fallback speed. */
export function ramProfile(r: ResolvedBuild) {
  const first = r.ram[0].spec;
  return {
    enabled: true,
    ratedMHz: first.speedMT,
    jedecMHz: first.memType === 'DDR4' ? 2133 : 4800
  };
}
