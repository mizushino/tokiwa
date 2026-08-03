import { describe, expect, it } from 'vite-plus/test';

import { messageIds } from './messages';
import { templates as japaneseTemplates } from '../../generated/locales/ja';

interface PageJson {
  localizationId: string;
  title: string;
  description: string;
  translations?: unknown;
}

const modules = import.meta.glob<{ default: PageJson }>('../../sites/**/page.json', { eager: true });

describe('Lit Localize messages', () => {
  it('discovers page.json files with unique localization IDs', () => {
    const pages = Object.values(modules).map((module) => module.default);
    expect(pages.length).toBeGreaterThan(0);
    expect(new Set(pages.map((page) => page.localizationId)).size).toBe(pages.length);
  });

  for (const [path, module] of Object.entries(modules)) {
    it(`${path} delegates translations to Lit Localize`, () => {
      const page = module.default;
      expect(page.localizationId).toBeTruthy();
      expect(page.translations).toBeUndefined();
      expect(messageIds).toContain(`${page.localizationId}.title`);
      expect(messageIds).toContain(`${page.localizationId}.description`);
    });
  }

  it('provides a Japanese template for every source message', () => {
    expect(Object.keys(japaneseTemplates).sort()).toEqual([...messageIds].sort());
  });

  it('contains the shared messages used by components', () => {
    for (const key of [
      'cancel',
      'delete',
      'save',
      'name',
      'email',
      'password',
      'error',
      'success',
      'loading',
      'logout',
    ]) {
      expect(messageIds).toContain(`global.${key}`);
    }
  });
});
