import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clearPreferredLanguageCache, setPreferredLanguage } from '@app/i18n';

import { PageElement, type PageMetadata } from './page-element';

const metadata: PageMetadata = {
  title: 'Hello World - Sample Site',
  description: 'A simple Hello World example demonstrating basic Lit components.',
  localizationId: 'default.helloworld',
};

@customElement('test-i18n-page')
class TestI18nPage extends PageElement {
  protected pageMetadata = metadata;

  protected override renderContents(): TemplateResult {
    return html`<span id="greeting">${this.trans('hero_title')}</span>`;
  }
}

describe('PageElement i18n', () => {
  let element: TestI18nPage;

  beforeEach(async () => {
    await clearPreferredLanguageCache();
    element = document.createElement('test-i18n-page') as TestI18nPage;
    document.body.appendChild(element);
  });

  afterEach(async () => {
    element.remove();
    await clearPreferredLanguageCache();
  });

  const greeting = (): string | undefined => element.shadowRoot?.querySelector('#greeting')?.textContent ?? undefined;

  it('renders trans() in the default language and localizes the document title', async () => {
    await element.updateComplete;
    expect(greeting()).toBe('Hello, World!');
    expect(document.title).toBe('Hello World - Sample Site');
  });

  it('re-renders and re-applies metadata when the language changes', async () => {
    await element.updateComplete;

    await setPreferredLanguage('ja');
    await element.updateComplete;

    expect(greeting()).toBe('こんにちは、世界！');
    expect(document.title).toBe('Hello World - サンプルサイト');
  });

  it('unsubscribes on disconnect so later language changes do not update it', async () => {
    await element.updateComplete;
    element.remove();

    await setPreferredLanguage('ja');
    await element.updateComplete;

    expect(greeting()).toBe('Hello, World!');
  });

  it('resolves trans() through page → global → code fallback', async () => {
    await element.updateComplete;
    const trans = (code: string): string => (element as unknown as { trans(code: string): string }).trans(code);

    expect(trans('hero_title')).toBe('Hello, World!');
    expect(trans('cancel')).toBe('Cancel');
    expect(trans('__does_not_exist__')).toBe('__does_not_exist__');
  });
});
