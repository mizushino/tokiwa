import { describe, expect, it } from 'vitest';

import { globalTranslations } from './translations';

interface PageJson {
  translations?: {
    en?: Record<string, string>;
    ja?: Record<string, string>;
  };
}

const modules = import.meta.glob<{ default: PageJson }>('../../sites/**/page.json', { eager: true });

const META_KEYS = new Set(['title', 'description']);
const contentKeys = (map: Record<string, string> = {}): string[] =>
  Object.keys(map)
    .filter((key) => !META_KEYS.has(key))
    .sort();

describe('page.json translations', () => {
  it('discovers page.json files', () => {
    expect(Object.keys(modules).length).toBeGreaterThan(0);
  });

  for (const [path, mod] of Object.entries(modules)) {
    const translations = mod.default.translations;
    if (!translations) {
      continue;
    }

    describe(path, () => {
      it('defines both en and ja maps', () => {
        expect(translations.en, 'missing en translations').toBeDefined();
        expect(translations.ja, 'missing ja translations').toBeDefined();
      });

      it('has matching content keys across en and ja', () => {
        expect(contentKeys(translations.ja)).toEqual(contentKeys(translations.en));
      });

      it('has no blank translation values', () => {
        for (const map of [translations.en, translations.ja]) {
          for (const [key, value] of Object.entries(map ?? {})) {
            if (value === '' && key.startsWith('feature_')) continue;
            expect(value, `${key} is blank`).not.toBe('');
          }
        }
      });
    });
  }
});

describe('globalTranslations', () => {
  it('exposes the shared labels the pages rely on in both languages', () => {
    const sharedKeys = ['cancel', 'delete', 'save', 'name', 'email', 'password', 'error', 'success', 'loading', 'logout'];
    for (const key of sharedKeys) {
      expect(globalTranslations.en[key], `en.${key}`).toBeTruthy();
      expect(globalTranslations.ja[key], `ja.${key}`).toBeTruthy();
    }
  });
});
