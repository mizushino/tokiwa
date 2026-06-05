import type { User } from 'firebase/auth';

export type SupportedLanguage = 'ja' | 'en';

const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

let cachedLanguage: SupportedLanguage = 'ja';
let initialized = false;
let hasStoredValue = false;
const listeners = new Set<(lang: SupportedLanguage) => void>();

function canUseStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function readFromStorage(): SupportedLanguage | null {
  if (!canUseStorage()) {
    return null;
  }

  const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (value === 'ja' || value === 'en') {
    hasStoredValue = true;
    return value;
  }

  return null;
}

function writeToStorage(lang: SupportedLanguage): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  hasStoredValue = true;
}

function ensureInitialized(): void {
  if (initialized) {
    return;
  }

  const stored = readFromStorage();
  if (stored) {
    cachedLanguage = stored;
  }

  initialized = true;
}

function notifyListeners(lang: SupportedLanguage): void {
  listeners.forEach((listener) => {
    try {
      listener(lang);
    } catch (error) {
      console.error('Preferred language listener failed:', error);
    }
  });
}

export function getPreferredLanguage(): SupportedLanguage {
  ensureInitialized();
  return cachedLanguage;
}

export function setPreferredLanguage(lang: SupportedLanguage): void {
  ensureInitialized();
  cachedLanguage = lang;
  writeToStorage(lang);
  notifyListeners(lang);
}

export function subscribePreferredLanguage(listener: (lang: SupportedLanguage) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key !== LANGUAGE_STORAGE_KEY) {
      return;
    }

    const newValue = event.newValue;
    if (newValue === 'ja' || newValue === 'en') {
      cachedLanguage = newValue;
      hasStoredValue = true;
      notifyListeners(cachedLanguage);
    }
  });

  // Safari bfcache から復元された際にモジュール変数と localStorage の整合性が崩れるため
  window.addEventListener('pageshow', (event: PageTransitionEvent) => {
    if (event.persisted) {
      const stored = readFromStorage();
      if (stored && stored !== cachedLanguage) {
        cachedLanguage = stored;
        notifyListeners(cachedLanguage);
      }
    }
  });
}

export function seedPreferredLanguageFromUser(user: User | null): void {
  if (hasStoredValue || !user?.displayName) {
    return;
  }

  const { language } = parseDisplayNameWithLanguage(user.displayName);
  cachedLanguage = language;
  writeToStorage(language);
  notifyListeners(language);
}

export function parseDisplayNameWithLanguage(raw: string | null): { name: string; language: SupportedLanguage } {
  if (!raw) {
    return { name: '', language: 'ja' };
  }

  const match = raw.match(/^(.*)\s\[(en|ja)\]$/i);
  if (match) {
    const name = match[1].trim();
    const suffix = match[2].toLowerCase();
    return { name, language: suffix === 'en' ? 'en' : 'ja' };
  }

  return { name: raw.trim(), language: 'ja' };
}

export function clearPreferredLanguageCache(): void {
  initialized = false;
  hasStoredValue = false;
  cachedLanguage = 'ja';
}
