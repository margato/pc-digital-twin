import { useEffect, useState } from 'react';
import { MdAdd, MdClose, MdKeyboardArrowDown, MdSettings } from 'react-icons/md';
import { FEATURES } from '../config/features';
import { isDefaultHome, useHome } from '../state/home';
import { MAX_DEVICES, outletSafeW, outletW } from '../sim/home';
import type { HomeDevice } from '../catalog';
import { MAX_PLAY_HOURS, formatKwhPrice, useSettings } from '../state/settings';
import Modal from './Modal';
import { LANGS, localeOf, useLang, useT, type Lang } from '../i18n';

const FPS_OPTIONS = [30, 60, 120, null];
/** Each language is named in itself, so it can be found whatever the current language is. */
const LANG_NAMES: Record<Lang, string> = { en: 'English', pt: 'Português' };

interface SegmentedProps<V extends string> {
  id: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
}

function Segmented<V extends string>({ id, value, options, onChange }: SegmentedProps<V>) {
  return (
    <div className="settings-seg" role="radiogroup" aria-labelledby={id}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className="settings-seg-opt"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Common values as buttons, plus "Other" that reveals a number field for anything else. */
function PresetField({ id, value, presets, step, max, otherLabel, onChange }: { id: string; value: number; presets: number[]; step: number; max: number; otherLabel: string; onChange: (n: number) => void }) {
  const [custom, setCustom] = useState(!presets.includes(value));
  const selected = custom ? 'custom' : String(value);
  return (
    <div className="settings-preset">
      <Segmented
        id={id}
        value={selected}
        options={[...presets.map((p) => ({ value: String(p), label: String(p) })), { value: 'custom', label: otherLabel }]}
        onChange={(v) => {
          if (v === 'custom') setCustom(true);
          else {
            setCustom(false);
            onChange(Number(v));
          }
        }}
      />
      {custom ? <NumberField id={id} value={value} step={step} max={max} onChange={onChange} /> : null}
    </div>
  );
}

/** Number input that keeps what is being typed ("0.", "") and commits only valid values. */
function NumberField({ id, value, onChange, step = 0.001, max }: { id: string; value: number; onChange: (n: number) => void; step?: number; max?: number }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="number"
      inputMode="decimal"
      className="settings-input"
      aria-labelledby={id}
      min={0}
      max={max}
      step={step}
      value={draft ?? String(value)}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = e.target.valueAsNumber;
        if (Number.isFinite(n) && n >= 0 && (max === undefined || n <= max)) onChange(n);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

/** Number box for a device row: keeps what is being typed, an empty box commits `undefined` when `optional`. */
function DeviceNumber({ id, label, value, optional, onChange }: { id: string; label: string; value: number | undefined; optional?: boolean; onChange: (n: number | undefined) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="home-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className="settings-input"
        min={0}
        step={1}
        value={draft ?? (value === undefined ? '' : String(value))}
        onChange={(e) => {
          setDraft(e.target.value);
          if (e.target.value === '') {
            if (optional) onChange(undefined);
            return;
          }
          const n = e.target.valueAsNumber;
          if (Number.isFinite(n) && n >= 0) onChange(n);
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}

/** Name box that commits on blur or Enter. */
function DeviceName({ id, label, placeholder, value, onCommit }: { id: string; label: string; placeholder: string; value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <label className="home-field home-field-name" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="text"
        className="settings-input"
        maxLength={40}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </label>
  );
}

/** The other devices on the PC's outlet, plus the reset of the whole home spec. */
/** Capacity of the outlet and the continuous limit, so the two numbers the checks use are visible while editing. */
function HomeSummary() {
  const t = useT();
  const home = useHome((s) => s.home);
  const fmt = (w: number) => `${Math.round(w).toLocaleString(localeOf())} W`;
  return (
    <dl className="settings-specgrid">
      <div>
        <dt>{t('menu.settings.homeCapacity')}</dt>
        <dd>{fmt(outletW(home))}</dd>
      </div>
      <div>
        <dt>{t('menu.settings.homeSafe', { pct: Math.round(home.safeFraction * 100) })}</dt>
        <dd className="accent">{fmt(outletSafeW(home))}</dd>
      </div>
    </dl>
  );
}

function HomeDevices() {
  const t = useT();
  const devices = useHome((s) => s.home.devices);
  const addDevice = useHome((s) => s.addDevice);
  const updateDevice = useHome((s) => s.updateDevice);
  const removeDevice = useHome((s) => s.removeDevice);
  const reset = useHome((s) => s.reset);
  const pristine = useHome((s) => isDefaultHome(s.home));
  // Two clicks to reset: the first arms the button, which disarms itself after a few seconds or when it loses focus.
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const id = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(id);
  }, [confirming]);
  const patch = (id: string, p: Partial<Omit<HomeDevice, 'id'>>) => updateDevice(id, p);
  return (
    <div className="settings-group home-devices">
      <div className="settings-label">
        <span className="settings-idx" aria-hidden="true">
          03
        </span>
        <div className="settings-label-text">
          <span className="settings-label-title">{t('menu.settings.devices')}</span>
          <span className="settings-label-desc">{t('menu.settings.devicesDesc')}</span>
        </div>
        <span className="settings-readout">
          {devices.length} / {MAX_DEVICES}
        </span>
      </div>
      <ul className="home-list">
        {devices.map((d) => (
          <li className="home-device" key={d.id}>
            <DeviceName id={`dev-name-${d.id}`} label={t('menu.settings.deviceName')} placeholder={t('menu.settings.deviceNameHint')} value={d.name} onCommit={(name) => patch(d.id, { name })} />
            <DeviceNumber id={`dev-w-${d.id}`} label={t('menu.settings.deviceWatts')} value={d.watts} onChange={(n) => patch(d.id, { watts: n ?? 0 })} />
            <DeviceNumber id={`dev-i-${d.id}`} label={t('menu.settings.deviceIdle')} value={d.idleWatts} optional onChange={(n) => patch(d.id, { idleWatts: n })} />
            <button type="button" className="home-remove" aria-label={t('menu.settings.deviceRemove', { name: d.name || t('menu.settings.deviceNameHint') })} onClick={() => removeDevice(d.id)}>
              <MdClose size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="home-add" disabled={devices.length >= MAX_DEVICES} onClick={() => addDevice()}>
        <MdAdd size={16} aria-hidden="true" />
        {t('menu.settings.deviceAdd')}
      </button>
      <button
        type="button"
        className={'ghost home-reset' + (confirming && !pristine ? ' confirm' : '')}
        disabled={pristine}
        onClick={() => (confirming ? (setConfirming(false), reset()) : setConfirming(true))}
        onBlur={() => setConfirming(false)}
      >
        {t(confirming && !pristine ? 'menu.settings.homeResetConfirm' : 'menu.settings.homeReset')}
      </button>
    </div>
  );
}

type SectionId = 'general' | 'graphics' | 'energy' | 'home';
const SECTIONS: SectionId[] = ['general', 'graphics', 'energy', 'home'];

type SettingsRow = { section: SectionId; id: string; title: string; desc: string; readout: string } & (
  | { kind: 'segmented'; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }
  | { kind: 'number'; value: number; step?: number; max?: number; onChange: (n: number) => void }
  | { kind: 'preset'; value: number; presets: number[]; step: number; max: number; onChange: (n: number) => void }
);

const CURRENCIES = ['BRL', 'USD', 'EUR'];
/** Mains voltages and outlet ratings found in homes around the world; anything else goes through "Other". */
const VOLT_PRESETS = [100, 120, 127, 220, 230, 240];
const AMP_PRESETS = [10, 13, 15, 16, 20];

export default function Settings() {
  const t = useT();
  const [open, setOpen] = useState(false);
  // Accordion: every section starts closed and opening one closes the other.
  const [expanded, setExpanded] = useState<SectionId | null>(null);
  const toggle = (sec: SectionId) => setExpanded((cur) => (cur === sec ? null : sec));
  const fpsLimit = useSettings((s) => s.fpsLimit);
  const setFpsLimit = useSettings((s) => s.setFpsLimit);
  const kwhPrice = useSettings((s) => s.kwhPrice);
  const setKwhPrice = useSettings((s) => s.setKwhPrice);
  const currency = useSettings((s) => s.currency);
  const playHours = useSettings((s) => s.playHours);
  const setPlayHours = useSettings((s) => s.setPlayHours);
  const setCurrency = useSettings((s) => s.setCurrency);
  const lang = useLang((s) => s.lang);
  const langAuto = useLang((s) => s.auto);
  const setLang = useLang((s) => s.setLang);
  const setLangAuto = useLang((s) => s.setAuto);

  const rows: SettingsRow[] = [];
  if (FEATURES.languageSetting) {
    const options = [
      { value: 'auto', label: t('menu.settings.langAuto') },
      ...LANGS.map((l) => ({ value: l as string, label: LANG_NAMES[l] })),
    ];
    const value = langAuto ? 'auto' : lang;
    rows.push({
      section: 'general',
      kind: 'segmented',
      id: 'language',
      title: t('menu.settings.language'),
      desc: t('menu.settings.languageDesc'),
      readout: options.find((o) => o.value === value)?.label ?? '',
      value,
      options,
      onChange: (v) => (v === 'auto' ? setLangAuto() : setLang(v as Lang)),
    });
  }
  if (FEATURES.fpsLimit) {
    const options = FPS_OPTIONS.map((fps) => ({
      value: String(fps ?? 'null'),
      label: fps === null ? t('menu.settings.unlimited') : `${fps}`,
    }));
    const value = String(fpsLimit ?? 'null');
    rows.push({
      section: 'graphics',
      kind: 'segmented',
      id: 'fps-limit',
      title: t('menu.settings.fpsLimit'),
      desc: t('menu.settings.fpsDesc'),
      readout: options.find((o) => o.value === value)?.label ?? '',
      value,
      options,
      onChange: (v) => setFpsLimit(v === 'null' ? null : Number(v)),
    });
  }
  rows.push({
    section: 'energy',
    kind: 'number',
    id: 'kwh-price',
    title: t('menu.settings.kwhPrice'),
    desc: t('menu.settings.kwhPriceDesc'),
    readout: t('menu.settings.kwhPriceUnit', { price: formatKwhPrice(kwhPrice, currency) }),
    value: kwhPrice,
    onChange: setKwhPrice,
  });
  rows.push({
    section: 'energy',
    kind: 'number',
    id: 'play-hours',
    title: t('menu.settings.playHours'),
    desc: t('menu.settings.playHoursDesc'),
    readout: t('menu.settings.playHoursUnit', { hours: playHours.toLocaleString(localeOf()) }),
    value: playHours,
    step: 1,
    max: MAX_PLAY_HOURS,
    onChange: setPlayHours,
  });
  rows.push({
    section: 'general',
    kind: 'segmented',
    id: 'currency',
    title: t('menu.settings.currency'),
    desc: t('menu.settings.currencyDesc'),
    readout: currency,
    value: currency,
    options: (CURRENCIES.includes(currency) ? CURRENCIES : [...CURRENCIES, currency]).map((c) => ({ value: c, label: c })),
    onChange: setCurrency,
  });

  const home = useHome((s) => s.home);
  const setOutlet = useHome((s) => s.setOutlet);
  rows.push({
    section: 'home',
    kind: 'preset',
    id: 'home-volts',
    title: t('menu.settings.volts'),
    desc: t('menu.settings.voltsDesc'),
    readout: t('menu.settings.voltsUnit', { volts: home.volts.toLocaleString(localeOf()) }),
    value: home.volts,
    presets: VOLT_PRESETS,
    step: 1,
    max: 400,
    onChange: (n) => setOutlet({ volts: n }),
  });
  rows.push({
    section: 'home',
    kind: 'preset',
    id: 'home-amps',
    title: t('menu.settings.amps'),
    desc: t('menu.settings.ampsDesc', { watts: outletW(home).toLocaleString(localeOf()) }),
    readout: t('menu.settings.ampsUnit', { amps: home.amps.toLocaleString(localeOf()) }),
    value: home.amps,
    presets: AMP_PRESETS,
    step: 1,
    max: 100,
    onChange: (n) => setOutlet({ amps: n }),
  });

  return (
    <>
      <button type="button" className="settingsbtn surf" id="settingsBtn" onClick={() => {
          setExpanded(null);
          setOpen(true);
        }} title={t('menu.settings.title')}>
        <MdSettings size={16} />
        {t('menu.settings.title')}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('menu.settings.title')}
        icon={<MdSettings size={16} />}
        closeLabel={t('menu.settings.close')}
        className="settings-modal"
      >
        {SECTIONS.map((sec) => {
          const items = rows.filter((r) => r.section === sec);
          if (!items.length) return null;
          return (
            <section className="settings-section" key={sec} aria-labelledby={'sec-' + sec}>
              <h3 id={'sec-' + sec}>
                <button type="button" className="settings-toggle" aria-expanded={expanded === sec} aria-controls={'sec-body-' + sec} onClick={() => toggle(sec)}>
                  <span>{t(`menu.settings.section.${sec}` as const)}</span>
                  <MdKeyboardArrowDown size={18} aria-hidden="true" />
                </button>
              </h3>
              <div id={'sec-body-' + sec} className="settings-body" data-open={expanded === sec}>
                <div className="settings-body-in" {...(expanded === sec ? {} : ({ inert: '' } as object))}>
              {sec === 'home' ? <HomeSummary /> : null}
              {items.map((r, i) => (
                <div className="settings-group" key={r.id}>
                  <div className="settings-label">
                    <span className="settings-idx" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="settings-label-text">
                      <span className="settings-label-title" id={r.id}>
                        {r.title}
                      </span>
                      <span className="settings-label-desc">{r.desc}</span>
                    </div>
                    <span className="settings-readout">{r.readout}</span>
                  </div>
                  {r.kind === 'number' ? (
                    <NumberField id={r.id} value={r.value} step={r.step} max={r.max} onChange={r.onChange} />
                  ) : r.kind === 'preset' ? (
                    <PresetField id={r.id} value={r.value} presets={r.presets} step={r.step} max={r.max} otherLabel={t('menu.settings.other')} onChange={r.onChange} />
                  ) : (
                    <Segmented id={r.id} value={r.value} options={r.options} onChange={r.onChange} />
                  )}
                </div>
              ))}
              {sec === 'home' ? <HomeDevices /> : null}
                </div>
              </div>
            </section>
          );
        })}
      </Modal>
    </>
  );
}
