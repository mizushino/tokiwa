import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearPreferredLanguageCache,
  getPreferredLanguage,
  parseDisplayNameWithLanguage,
  seedPreferredLanguageFromUser,
  setPreferredLanguage,
  subscribePreferredLanguage,
  tGlobal,
} from './index';

describe('language preferences', () => {
  beforeEach(() => {
    clearPreferredLanguageCache();
    window.localStorage.clear();
  });

  afterEach(() => {
    clearPreferredLanguageCache();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to Japanese when nothing is stored', () => {
    expect(getPreferredLanguage()).toBe('ja');
  });

  it('stores updates and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = subscribePreferredLanguage(listener);

    setPreferredLanguage('en');

    expect(getPreferredLanguage()).toBe('en');
    expect(window.localStorage.getItem('preferredLanguage')).toBe('en');
    expect(listener).toHaveBeenCalledWith('en');

    unsubscribe();
    setPreferredLanguage('ja');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('updates the cache from storage events', () => {
    const listener = vi.fn();
    subscribePreferredLanguage(listener);

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'preferredLanguage',
        newValue: 'en',
      })
    );

    expect(getPreferredLanguage()).toBe('en');
    expect(listener).toHaveBeenCalledWith('en');
  });

  it('refreshes cached language on persisted pageshow', () => {
    setPreferredLanguage('ja');
    window.localStorage.setItem('preferredLanguage', 'en');

    const event = new Event('pageshow');
    Object.defineProperty(event, 'persisted', { value: true });
    window.dispatchEvent(event);

    expect(getPreferredLanguage()).toBe('en');
  });

  it('seeds preferred language from display name when nothing is stored', () => {
    const listener = vi.fn();
    subscribePreferredLanguage(listener);

    seedPreferredLanguageFromUser({ displayName: 'Alice [en]' } as never);

    expect(getPreferredLanguage()).toBe('en');
    expect(window.localStorage.getItem('preferredLanguage')).toBe('en');
    expect(listener).toHaveBeenCalledWith('en');
  });

  it('does not override an explicit stored language from the user profile', () => {
    setPreferredLanguage('ja');

    seedPreferredLanguageFromUser({ displayName: 'Alice [en]' } as never);

    expect(getPreferredLanguage()).toBe('ja');
  });

  it('parses display names with language suffixes and trims fallback names', () => {
    expect(parseDisplayNameWithLanguage('Alice [en]')).toEqual({ name: 'Alice', language: 'en' });
    expect(parseDisplayNameWithLanguage('太郎 [ja]')).toEqual({ name: '太郎', language: 'ja' });
    expect(parseDisplayNameWithLanguage('  Bob  ')).toEqual({ name: 'Bob', language: 'ja' });
    expect(parseDisplayNameWithLanguage(null)).toEqual({ name: '', language: 'ja' });
  });

  it('returns global translations and falls back to the code when missing', () => {
    expect(tGlobal('cancel', 'ja')).toBe('キャンセル');
    expect(tGlobal('cancel', 'en')).toBe('Cancel');
    expect(tGlobal('missing-key', 'ja')).toBe('missing-key');
  });
});
