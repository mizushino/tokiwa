import type { User } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  clearPreferredLanguageCache,
  getPreferredLanguage,
  seedPreferredLanguageIfUnset,
  setPreferredLanguage,
  subscribePreferredLanguage,
  syncPreferredLanguageFromUser,
  tGlobal,
} from './index';

const userMocks = vi.hoisted(() => ({
  saveUserLanguage: vi.fn().mockResolvedValue(undefined),
  subscribeToUserDocument: vi.fn(),
  callback: undefined as ((user: { lang: 'en' | 'ja' } | null) => void) | undefined,
  unsubscribe: vi.fn(),
}));

vi.mock('@models/user', () => ({
  saveUserLanguage: userMocks.saveUserLanguage,
  subscribeToUserDocument: userMocks.subscribeToUserDocument,
}));

describe('language preferences', () => {
  beforeEach(async () => {
    await clearPreferredLanguageCache();
    vi.clearAllMocks();
    userMocks.callback = undefined;
    userMocks.subscribeToUserDocument.mockImplementation((_uid, callback) => {
      userMocks.callback = callback;
      return userMocks.unsubscribe;
    });
  });

  afterEach(async () => {
    await clearPreferredLanguageCache();
    vi.restoreAllMocks();
  });

  it('uses the source locale when no site or user preference is set', () => {
    expect(getPreferredLanguage()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('updates the locale and notifies subscribers without local persistence', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribePreferredLanguage(listener);

    await setPreferredLanguage('ja');

    expect(getPreferredLanguage()).toBe('ja');
    expect(document.documentElement.lang).toBe('ja');
    expect(listener).toHaveBeenCalledWith('ja');
    expect(userMocks.saveUserLanguage).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('loads the signed-in user preference from Firestore', async () => {
    syncPreferredLanguageFromUser({ uid: 'user-1' } as User);

    expect(userMocks.subscribeToUserDocument).toHaveBeenCalledWith('user-1', expect.any(Function));
    userMocks.callback?.({ lang: 'ja' });

    await vi.waitFor(() => expect(getPreferredLanguage()).toBe('ja'));
  });

  it('saves explicit changes to the signed-in user preference', async () => {
    syncPreferredLanguageFromUser({ uid: 'user-1' } as User);

    await setPreferredLanguage('ja');

    expect(userMocks.saveUserLanguage).toHaveBeenCalledWith('user-1', 'ja');
  });

  it('uses a soft site default until Firestore provides a preference', async () => {
    seedPreferredLanguageIfUnset('ja');
    await vi.waitFor(() => expect(getPreferredLanguage()).toBe('ja'));

    syncPreferredLanguageFromUser({ uid: 'user-1' } as User);
    userMocks.callback?.({ lang: 'en' });

    await vi.waitFor(() => expect(getPreferredLanguage()).toBe('en'));
  });

  it('does not overwrite the site default when the user has no lang field', async () => {
    seedPreferredLanguageIfUnset('ja');
    await vi.waitFor(() => expect(getPreferredLanguage()).toBe('ja'));

    syncPreferredLanguageFromUser({ uid: 'user-1' } as User);
    userMocks.callback?.(null);

    expect(getPreferredLanguage()).toBe('ja');
    expect(userMocks.saveUserLanguage).not.toHaveBeenCalled();
  });

  it('returns to the site default after sign-out', async () => {
    seedPreferredLanguageIfUnset('ja');
    syncPreferredLanguageFromUser({ uid: 'user-1' } as User);
    userMocks.callback?.({ lang: 'en' });
    await vi.waitFor(() => expect(getPreferredLanguage()).toBe('en'));

    syncPreferredLanguageFromUser(null);

    await vi.waitFor(() => expect(getPreferredLanguage()).toBe('ja'));
    expect(userMocks.unsubscribe).toHaveBeenCalled();
  });

  it('uses Lit Localize messages and falls back to the code when missing', async () => {
    expect(tGlobal('cancel')).toBe('Cancel');

    await setPreferredLanguage('ja');

    expect(tGlobal('cancel')).toBe('キャンセル');
    expect(tGlobal('missing-key')).toBe('missing-key');
  });
});
