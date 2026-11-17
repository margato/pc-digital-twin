import { describe, expect, it } from 'vitest';
import { detectLang, getLang, localeOf, localize, setLang, t, useLang } from './index';
import { MESSAGES } from './messages';

describe('detectLang', () => {
  it('picks Portuguese for any pt variant and English otherwise', () => {
    expect(detectLang({ languages: ['pt-BR', 'en'] })).toBe('pt');
    expect(detectLang({ languages: ['pt-PT'] })).toBe('pt');
    expect(detectLang({ languages: ['en-US', 'pt-BR'] })).toBe('en');
    expect(detectLang({ languages: ['fr-FR', 'pt-BR'] })).toBe('pt');
    expect(detectLang({ languages: ['ja'] })).toBe('en');
    expect(detectLang({ language: 'PT-br' })).toBe('pt');
    expect(detectLang(undefined)).toBe('en');
    expect(detectLang({})).toBe('en');
  });
});

describe('messages', () => {
  it('have the same keys and placeholders in every language, and no empty text', () => {
    const en = MESSAGES.en, pt = MESSAGES.pt;
    expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort());
    const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    for (const k of Object.keys(en)) {
      expect(en[k].trim(), k).not.toBe('');
      expect(pt[k].trim(), k).not.toBe('');
      expect(holes(pt[k]), `${k} placeholders`).toBe(holes(en[k]));
    }
  });
});

describe('t / localize', () => {
  it('localizes plain and per-language text, falling back to English', () => {
    expect(localize('same')).toBe('same');
    expect(localize({ en: 'Hello', pt: 'Olá' }, 'pt')).toBe('Olá');
    expect(localize({ en: 'Hello' }, 'pt')).toBe('Hello');
    expect(localize(undefined)).toBe('');
  });
  it('switches language at runtime and formats the locale', () => {
    expect(getLang()).toBe('en');
    setLang('pt');
    expect([getLang(), localeOf()]).toEqual(['pt', 'pt-BR']);
    setLang('en');
    expect(localeOf()).toBe('en-US');
  });
  it('returns the key itself for an unknown message', () => {
    expect(t('nope.nothing' as never)).toBe('nope.nothing');
  });
});

describe('auto mode', () => {
  it('an explicit choice turns auto off; setAuto follows the browser again', () => {
    setLang('pt');
    expect(useLang.getState().auto).toBe(false);
    useLang.getState().setAuto();
    expect(useLang.getState().auto).toBe(true);
    expect(getLang()).toBe(detectLang());
  });
});
