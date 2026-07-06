import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  getPreferredLanguage,
  setPreferredLanguage,
  subscribePreferredLanguage,
  type SupportedLanguage,
} from '@app/i18n';
import type { ButtonVariant } from '@components/ui/button/ui-button';

import '@components/ui/button/ui-button';

/**
 * Language switcher that toggles the preferred language between Japanese and English.
 *
 * Shows the name of the OTHER language (the one a click switches to) and re-renders
 * itself whenever the preferred language changes.
 *
 * Usage:
 * ```ts
 * html`<ui-language-switcher></ui-language-switcher>`
 * html`<ui-language-switcher variant="soft"></ui-language-switcher>`
 * html`<ui-language-switcher variant="secondary" fullWidth></ui-language-switcher>`
 * ```
 */
@customElement('ui-language-switcher')
export class UiLanguageSwitcher extends LitElement {
  @property({ type: String })
  variant: ButtonVariant = 'secondary';

  @property({ type: Boolean })
  fullWidth = false;

  private unsubscribeLanguage?: () => void;

  public override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribeLanguage = subscribePreferredLanguage(() => this.requestUpdate());
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribeLanguage?.();
    this.unsubscribeLanguage = undefined;
  }

  protected override render(): TemplateResult {
    const target: SupportedLanguage = getPreferredLanguage() === 'en' ? 'ja' : 'en';
    const label = target === 'ja' ? '日本語' : 'English';
    return html`
      <ui-button size="sm" variant=${this.variant} ?fullWidth=${this.fullWidth} @click=${() => setPreferredLanguage(target)}
        >${label}</ui-button
      >
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-language-switcher': UiLanguageSwitcher;
  }
}
