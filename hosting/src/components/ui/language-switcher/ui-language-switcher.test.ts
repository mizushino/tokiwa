import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { clearPreferredLanguageCache, getPreferredLanguage, setPreferredLanguage } from '@app/i18n';
import { proxyShadowQueries } from '@app/../test/query-shadow-root';

import type { UiLanguageSwitcher } from './ui-language-switcher';
import type { UiButton } from '@components/ui/button/ui-button';

import './ui-language-switcher';

describe('UiLanguageSwitcher', () => {
  let element: UiLanguageSwitcher;
  let container: HTMLElement;

  beforeEach(async () => {
    await clearPreferredLanguageCache();
    container = document.createElement('div');
    document.body.appendChild(container);
    element = proxyShadowQueries(document.createElement('ui-language-switcher') as UiLanguageSwitcher);
    container.appendChild(element);
  });

  afterEach(async () => {
    container.remove();
    await clearPreferredLanguageCache();
  });

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element.variant).toBe('secondary');
    expect(element.fullWidth).toBe(false);
  });

  it('shows the other language name (Japanese when current is en)', async () => {
    await element.updateComplete;
    const button = element.querySelector('ui-button');
    expect(button?.textContent?.trim()).toBe('日本語');
  });

  it('shows English when current language is ja', async () => {
    await setPreferredLanguage('ja');
    await element.updateComplete;
    const button = element.querySelector('ui-button');
    expect(button?.textContent?.trim()).toBe('English');
  });

  it('switches the preferred language on click', async () => {
    await element.updateComplete;
    const button = element.querySelector('ui-button') as UiButton;
    button.click();
    await vi.waitFor(() => expect(getPreferredLanguage()).toBe('ja'));
  });

  it('re-renders when the preferred language changes externally', async () => {
    await element.updateComplete;
    await setPreferredLanguage('ja');
    await element.updateComplete;
    const button = element.querySelector('ui-button');
    expect(button?.textContent?.trim()).toBe('English');
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
    await setPreferredLanguage('ja');
    expect(element.isUpdatePending).toBe(false);
  });
});
