import { useEffect, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import { BsCpu } from 'react-icons/bs';
import { MdBolt, MdEdit, MdTrendingUp, MdTune } from 'react-icons/md';
import { DEFAULT_ID } from '../builds';
import { FEATURES } from '../config/features';
import { localize, useT } from '../i18n';
import { useApp, type Section } from '../state/store';
import PartsSection from './PartsSection';
import PowerSection from './PowerSection';
import UpgradesSection from './UpgradesSection';
import WhatIfSection from './WhatIfSection';

const ICON: Record<Section, IconType> = {
  parts: BsCpu,
  power: MdBolt,
  upgrades: MdTrendingUp,
  whatif: MdTune
};
const SECTIONS = (['parts', 'power', 'upgrades', 'whatif'] as Section[]).filter((id) => id !== 'upgrades' || FEATURES.upgradesTab);

/** Text that edits in place: commits on blur or Enter, Escape (or an empty value when `required`) puts the old text back. */
function EditableText({ value, label, placeholder, required, onCommit }: {
  value: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    const next = draft.trim();
    if (required && !next) setDraft(value);
    else if (next !== value) onCommit(next);
  };
  return (
    <span className="p-editwrap">
      <input
        className="p-edit"
        value={draft}
        aria-label={label}
        placeholder={placeholder}
        maxLength={80}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          else if (e.key === 'Escape') { setDraft(value); e.currentTarget.blur(); }
        }}
      />
      <MdEdit className="p-pencil" aria-hidden="true" />
    </span>
  );
}

export default function Panel() {
  const t = useT();
  const section = useApp((s) => s.section);
  const setSection = useApp((s) => s.setSection);
  const build = useApp((s) => s.build);
  const updateBuild = useApp((s) => s.updateBuild);
  const editable = build.id !== DEFAULT_ID;
  const body = useRef<HTMLDivElement>(null);
  const toTop = () => {
    if (body.current) body.current.scrollTop = 0;
  };
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    toTop();
    // Move focus into the new section so keyboard and screen-reader users land on it.
    body.current?.focus({ preventScroll: true });
  }, [section]);

  return (
    <>
      <div className="p-head">
        <h2>
          {editable ? <EditableText value={build.name} label={t('panel.edit.name')} required onCommit={(name) => updateBuild({ name })} /> : build.name}
        </h2>
        <p className="sub">
          {editable ? (
            <EditableText value={localize(build.description)} label={t('panel.edit.description')} placeholder={t('panel.edit.descriptionHint')} onCommit={(description) => updateBuild({ description })} />
          ) : (
            localize(build.description)
          )}
        </p>
      </div>
      <div className="ptabs" role="group" aria-label={t('panel.sections.label')}>
        {SECTIONS.map((id) => {
          const Icon = ICON[id];
          return (
          <button key={id} type="button" id={'sec-' + id} aria-pressed={section === id} onClick={() => setSection(id)}>
            <Icon aria-hidden="true" />
            <span>{t(`panel.tabs.${id}` as const)}</span>
          </button>
          );
        })}
      </div>
      <div ref={body} tabIndex={-1} className="panel-body">
        <div className="fade" key={section}>
          {section === 'parts' ? <PartsSection /> : section === 'power' ? <PowerSection /> : section === 'upgrades' ? <UpgradesSection onTry={toTop} /> : <WhatIfSection />}
        </div>
      </div>
    </>
  );
}
