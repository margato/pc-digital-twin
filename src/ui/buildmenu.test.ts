import { describe, expect, it } from 'vitest';
import { buildJson, confirmText, exportFileName, hasUserBuilds, isDefaultBuild, slugify } from './buildMenuHelpers';

const base = { version: 1 as const, id: 'x', name: 'Mi PC', parts: {} as never };

describe('build menu helpers', () => {
  it('slugifies names for file names', () => {
    expect(slugify('Mi PC Gamer!')).toBe('mi-pc-gamer');
    expect(slugify('  Oficina — Señor  ')).toBe('oficina-senor');
    expect(slugify('***')).toBe('pc');
  });

  it('builds the export file name', () => {
    expect(exportFileName({ name: 'Sala 4K' })).toBe('sala-4k.pc.json');
  });

  it('exports pretty JSON of the whole build', () => {
    expect(buildJson(base)).toBe(JSON.stringify(base, null, 2));
  });

  it('writes the confirm questions', () => {
    expect(confirmText('delete', 'Oficina')).toBe('Delete "Oficina"?');
    expect(confirmText('reset')).toBe('This deletes all your saved PCs.');
  });

  it('knows the default build and when reset is useful', () => {
    expect(isDefaultBuild({ id: 'default' })).toBe(true);
    expect(isDefaultBuild({ id: 'x' })).toBe(false);
    expect(hasUserBuilds([{ id: 'default' }])).toBe(false);
    expect(hasUserBuilds([{ id: 'default' }, { id: 'x' }])).toBe(true);
  });
});
