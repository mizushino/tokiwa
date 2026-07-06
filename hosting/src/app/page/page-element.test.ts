import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clearPreferredLanguageCache, setPreferredLanguage } from '@app/i18n';

import { PageElement, type PageMetadata } from './page-element';

const metadata: PageMetadata = {
  title: 'Test - EN',
  description: 'English description',
  translations: {
    en: { greeting: 'Hello' },
    ja: { title: 'テスト - JA', description: '日本語の説明', greeting: 'こんにちは' },
  },
};

@customElement('test-i18n-page')
class TestI18nPage extends PageElement {
  protected pageMetadata = metadata;

  protected override renderContents(): TemplateResult {
    return html`<span id="greeting">${this.trans('greeting')}</span>`;
  }
}

describe('PageElement i18n', () => {
  let element: TestI18nPage;

  beforeEach(() => {
    clearPreferredLanguageCache();
    window.localStorage.clear();
    element = document.createElement('test-i18n-page') as TestI18nPage;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
    clearPreferredLanguageCache();
    window.localStorage.clear();
  });

  const greeting = (): string | undefined => element.shadowRoot?.querySelector('#greeting')?.textContent ?? undefined;

  it('renders trans() in the default language and localizes the document title', async () => {
    await element.updateComplete;
    expect(greeting()).toBe('こんにちは');
    expect(document.title).toBe('テスト - JA');
  });

  it('re-renders and re-applies metadata when the language changes', async () => {
    await element.updateComplete;

    setPreferredLanguage('en');
    await element.updateComplete;

    expect(greeting()).toBe('Hello');
    expect(document.title).toBe('Test - EN');
  });

  it('unsubscribes on disconnect so later language changes do not update it', async () => {
    await element.updateComplete;
    element.remove();

    setPreferredLanguage('en');
    await element.updateComplete;

    expect(greeting()).toBe('こんにちは');
  });

  it('resolves trans() through page → global → code fallback', async () => {
    await element.updateComplete;
    const trans = (code: string): string => (element as unknown as { trans(code: string): string }).trans(code);

    expect(trans('greeting')).toBe('こんにちは');
    expect(trans('cancel')).toBe('キャンセル');
    expect(trans('__does_not_exist__')).toBe('__does_not_exist__');
  });
});
