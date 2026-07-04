import { describe, expect, it } from 'vitest';

import { globalTranslations } from './translations';

/**
 * Guards translation completeness across every page's `page.json`.
 *
 * Each page may localize UI strings under `translations.{en,ja}`. The two
 * language maps must expose the same *content* keys so no string is left
 * untranslated at runtime. `title`/`description` are exempt because the `ja`
 * map overrides them while `en` intentionally falls back to the top-level
 * (English) metadata (see PageElement.setPageMetadata).
 */

interface PageJson {
  translations?: {
    en?: Record<string, string>;
    ja?: Record<string, string>;
  };
}

// Eagerly import every page.json under sites/ so newly added pages are covered automatically.
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
            // Empty strings are allowed only for the composed dropdown "feature_*" affixes.
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
    // Keys referenced via trans() that resolve through globalTranslations rather than page.json.
    const sharedKeys = ['cancel', 'delete', 'save', 'name', 'email', 'password', 'error', 'success', 'loading', 'logout'];
    for (const key of sharedKeys) {
      expect(globalTranslations.en[key], `en.${key}`).toBeTruthy();
      expect(globalTranslations.ja[key], `ja.${key}`).toBeTruthy();
    }
  });
});
