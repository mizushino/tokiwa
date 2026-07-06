import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clearPreferredLanguageCache, getPreferredLanguage, setPreferredLanguage } from '@app/i18n';
import { proxyShadowQueries } from '@app/../test/query-shadow-root';

import type { UiLanguageSwitcher } from './ui-language-switcher';
import type { UiButton } from '@components/ui/button/ui-button';

import './ui-language-switcher';

describe('UiLanguageSwitcher', () => {
  let element: UiLanguageSwitcher;
  let container: HTMLElement;

  beforeEach(() => {
    window.localStorage.clear();
    clearPreferredLanguageCache();
    container = document.createElement('div');
    document.body.appendChild(container);
    element = proxyShadowQueries(document.createElement('ui-language-switcher') as UiLanguageSwitcher);
    container.appendChild(element);
  });

  afterEach(() => {
    container.remove();
    window.localStorage.clear();
    clearPreferredLanguageCache();
  });

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element.variant).toBe('secondary');
    expect(element.fullWidth).toBe(false);
  });

  it('shows the other language name (English when current is ja)', async () => {
    await element.updateComplete;
    const button = element.querySelector('ui-button');
    expect(button?.textContent?.trim()).toBe('English');
  });

  it('shows 日本語 when current language is en', async () => {
    setPreferredLanguage('en');
    await element.updateComplete;
    const button = element.querySelector('ui-button');
    expect(button?.textContent?.trim()).toBe('日本語');
  });

  it('switches the preferred language on click', async () => {
    await element.updateComplete;
    const button = element.querySelector('ui-button') as UiButton;
    button.click();
    expect(getPreferredLanguage()).toBe('en');
  });

  it('re-renders when the preferred language changes externally', async () => {
    await element.updateComplete;
    setPreferredLanguage('en');
    await element.updateComplete;
    const button = element.querySelector('ui-button');
    expect(button?.textContent?.trim()).toBe('日本語');
  });

  it('passes variant and fullWidth to the inner button', async () => {
    element.variant = 'soft';
    element.fullWidth = true;
    await element.updateComplete;
    const button = element.querySelector('ui-button') as UiButton;
    expect(button.variant).toBe('soft');
    expect(button.fullWidth).toBe(true);
  });

  it('stops listening for language changes after disconnect', async () => {
    await element.updateComplete;
    element.remove();
    setPreferredLanguage('en');
    expect(element.isUpdatePending).toBe(false);
  });
});
