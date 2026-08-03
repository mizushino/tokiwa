import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';

import type { UserLanguage } from '@firestore/types/user.js';
import { saveUserLanguage, subscribeToUserDocument } from '@models/user';

import { getLocale, setLocale } from './localization';

export type SupportedLanguage = UserLanguage;

let cachedLanguage = getLocale() as SupportedLanguage;
let siteDefaultLanguage = cachedLanguage;
let siteDefaultSeeded = false;
let activeUid: string | null = null;
let hasUserLanguage = false;
let userGeneration = 0;
let unsubscribeUser: Unsubscribe | undefined;

const listeners = new Set<(language: SupportedLanguage) => void>();

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return value === 'en' || value === 'ja';
}

function notifyListeners(language: SupportedLanguage): void {
  listeners.forEach((listener) => {
    try {
      listener(language);
    } catch (error) {
      console.error('Preferred language listener failed:', error);
    }
  });
}

async function applyLanguage(language: SupportedLanguage): Promise<void> {
  if (getLocale() !== language) {
    await setLocale(language);
  }

  cachedLanguage = language;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
  notifyListeners(language);
}

export function getPreferredLanguage(): SupportedLanguage {
  return cachedLanguage;
}

export async function setPreferredLanguage(language: SupportedLanguage): Promise<void> {
  await applyLanguage(language);

  const uid = activeUid;
  if (uid) {
    await saveUserLanguage(uid, language);
  }
}

export function subscribePreferredLanguage(listener: (language: SupportedLanguage) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function seedPreferredLanguageIfUnset(language: SupportedLanguage): void {
  siteDefaultLanguage = language;
  if (siteDefaultSeeded || hasUserLanguage) {
    return;
  }

  siteDefaultSeeded = true;
  void applyLanguage(language);
}

export function syncPreferredLanguageFromUser(user: User | null): void {
  userGeneration += 1;
  const generation = userGeneration;

  unsubscribeUser?.();
  unsubscribeUser = undefined;
  activeUid = user?.uid ?? null;
  hasUserLanguage = false;

  if (!user) {
    void applyLanguage(siteDefaultLanguage);
    return;
  }

  unsubscribeUser = subscribeToUserDocument(user.uid, (userData) => {
    if (generation !== userGeneration || !isSupportedLanguage(userData?.lang)) {
      return;
    }

    hasUserLanguage = true;
    void applyLanguage(userData.lang);
  });
}

export async function clearPreferredLanguageCache(): Promise<void> {
  userGeneration += 1;
  unsubscribeUser?.();
  unsubscribeUser = undefined;
  activeUid = null;
  hasUserLanguage = false;
  siteDefaultLanguage = 'en';
  siteDefaultSeeded = false;
  listeners.clear();
  await applyLanguage('en');
}
