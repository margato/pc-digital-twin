import { useState } from 'react';
import { getSpec, specsOf, type BuildItem, type PartSpec } from '../../catalog';
import type { PartId } from '../../data/parts';
import { localeOf, useT } from '../../i18n';
import { first, keySpecs, kindLabel, matches, type Candidate } from './model';

const MAX_DRIVE_QTY = 8;

interface Props {
  kind: PartId;
  parts: Candidate;
  onChange: (kind: PartId, items: BuildItem[]) => void;
}

/** One wizard step: search and tap-to-select cards for a kind, plus memory and storage controls. */
export function PickStep({ kind, parts, onChange }: Props) {
  const t = useT();
  const [query, setQuery] = useState('');
  const label = kindLabel(kind);
  const specs: PartSpec[] = specsOf(kind);
  const shown = specs.filter((s) => matches(s, query));
  const chosen = parts[kind] ?? [];
  const slots = first(parts, 'board')?.ramSlots ?? 4;
  const isDrive = kind === 'ssd';
  const isMemory = kind === 'ram';
  const mem = isMemory ? chosen[0] : undefined;
  const memSpec = mem ? getSpec('ram', mem.spec) : undefined;
  const usedM2 = chosen.reduce((n, i) => n + i.qty, 0);
  const m2Slots = first(parts, 'board')?.m2Slots;

  const pick = (s: PartSpec) => {
    if (isDrive) {
      const has = chosen.some((i) => i.spec === s.id);
      onChange(kind, has ? chosen.filter((i) => i.spec !== s.id) : [...chosen, { spec: s.id, qty: 1 }]);
    } else if (isMemory) {
      onChange(kind, [{ spec: s.id, qty: mem?.qty ?? Math.min(2, slots) }]);
    } else {
      onChange(kind, [{ spec: s.id, qty: 1 }]);
    }
  };

  const setQty = (spec: string, qty: number) =>
    onChange(kind, chosen.map((i) => (i.spec === spec ? { ...i, qty } : i)));

  const intro = isDrive
    ? t('onboarding.pick.introDrive')
    : isMemory
      ? t('onboarding.pick.introMemory')
      : t('onboarding.pick.introOne', { label: label.toLowerCase() });

  const driveCount =
    m2Slots !== undefined
      ? t(usedM2 === 1 ? 'onboarding.pick.drive.oneSlots' : 'onboarding.pick.drive.otherSlots', { count: usedM2, slots: m2Slots })
      : t(usedM2 === 1 ? 'onboarding.pick.drive.one' : 'onboarding.pick.drive.other', { count: usedM2 });

  return (
    <section className="ob-pick">
      <p className="ob-lead">{intro}</p>

      {memSpec && mem && (
        <div className="ob-tools">
          <Qty
            label={t('onboarding.pick.modules', { name: memSpec.name })}
            value={mem.qty}
            min={1}
            max={slots}
            onChange={(n) => setQty(mem.spec, n)}
          />
          <span className="ob-count">
            {t('onboarding.pick.memorySummary', {
              qty: mem.qty,
              gb: memSpec.moduleGB,
              total: (mem.qty * memSpec.moduleGB).toLocaleString(localeOf()),
              slots
            })}
          </span>
        </div>
      )}

      <label className="ob-field">
        <span className="ob-sr">{t('onboarding.pick.search', { label })}</span>
        <input
          type="search"
          className="ob-input"
          placeholder={t('onboarding.pick.searchPlaceholder', { label: label.toLowerCase() })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <p className="ob-count" aria-live="polite">
        {t('onboarding.pick.shown', { shown: shown.length, total: specs.length })}
      </p>
      <p className="ob-note">{t('onboarding.pick.notListed')}</p>

      {shown.length === 0 ? (
        <p className="ob-note">{t('onboarding.pick.noMatch', { label: label.toLowerCase(), query: query.trim() })}</p>
      ) : (
        <ul className="ob-grid">
          {shown.map((s) => {
            const selected = chosen.some((i) => i.spec === s.id);
            return (
              <li key={s.id}>
                <button type="button" className="ob-card" aria-pressed={selected} onClick={() => pick(s)}>
                  <span className="ob-card-top">
                    <span className="ob-mfr">{s.manufacturer}</span>
                    {s.estimated && <span className="ob-badge">{t('onboarding.pick.estimated')}</span>}
                  </span>
                  <span className="ob-card-name">{s.name}</span>
                  <span className="ob-specs">
                    {keySpecs(s).map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </span>
                  {selected && <span className="ob-tick">{isDrive ? t('onboarding.pick.inBuild') : t('onboarding.pick.selected')}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {isDrive && (
        <section className="ob-drives" aria-label={t('onboarding.pick.drivesRegion')}>
          <p className="ob-count">
            {driveCount}
          </p>
          {usedM2 > (m2Slots ?? Infinity) && (
            <p className="ob-errors">{t('onboarding.pick.drive.overM2')}</p>
          )}
          {chosen.length > 0 && (
            <ul className="ob-drive-list">
              {chosen.map((i) => {
                const s = getSpec('ssd', i.spec);
                return (
                  <li key={i.spec}>
                    <span className="ob-drive-name">
                      {s.manufacturer} {s.name}
                    </span>
                    <Qty
                      label={t('onboarding.pick.drive.quantity', { name: s.name })}
                      value={i.qty}
                      min={1}
                      max={MAX_DRIVE_QTY}
                      onChange={(n) => setQty(i.spec, n)}
                    />
                    <button
                      type="button"
                      className="ob-link"
                      onClick={() => onChange(kind, chosen.filter((c) => c.spec !== i.spec))}
                    >
                      {t('onboarding.pick.remove')}
                      <span className="ob-sr"> {s.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </section>
  );
}

function Qty({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const t = useT();
  return (
    <span className="ob-qty" role="group" aria-label={label}>
      <button type="button" className="ob-btn ob-qty-b" aria-label={t('onboarding.qty.fewer', { label })} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" className="ob-btn ob-qty-b" aria-label={t('onboarding.qty.more', { label })} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </span>
  );
}
