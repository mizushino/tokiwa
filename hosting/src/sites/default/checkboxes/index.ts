import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { PageElement, pageCard, pageContainer, pageHero, pageSection } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/checkbox/ui-checkbox';

@customElement('default-checkboxes')
export class DefaultCheckboxes extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private checkboxStates: Record<string, boolean> = {};

  private handleCheckboxChange(id: string, e: CustomEvent): void {
    this.checkboxStates = {
      ...this.checkboxStates,
      [id]: e.detail.checked,
    };
  }

  private renderSizes(): TemplateResult {
    return html`
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-600 dark:text-gray-400">SM:</span>
          <ui-checkbox size="sm">${this.trans('small_checkbox')}</ui-checkbox>
          <ui-checkbox size="sm" checked>${this.trans('small_checked')}</ui-checkbox>
          <ui-checkbox size="sm" disabled>${this.trans('small_disabled')}</ui-checkbox>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-600 dark:text-gray-400">MD:</span>
          <ui-checkbox size="md">${this.trans('medium_checkbox')}</ui-checkbox>
          <ui-checkbox size="md" checked>${this.trans('medium_checked')}</ui-checkbox>
          <ui-checkbox size="md" disabled>${this.trans('medium_disabled')}</ui-checkbox>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-600 dark:text-gray-400">LG:</span>
          <ui-checkbox size="lg">${this.trans('large_checkbox')}</ui-checkbox>
          <ui-checkbox size="lg" checked>${this.trans('large_checked')}</ui-checkbox>
          <ui-checkbox size="lg" disabled>${this.trans('large_disabled')}</ui-checkbox>
        </div>
      </div>
    `;
  }

  private renderStates(): TemplateResult {
    return html`
      <div class="space-y-4">
        <ui-checkbox>${this.trans('normal_checkbox')}</ui-checkbox>
        <ui-checkbox checked>${this.trans('checked_checkbox')}</ui-checkbox>
        <ui-checkbox indeterminate>${this.trans('indeterminate_checkbox')}</ui-checkbox>
        <ui-checkbox disabled>${this.trans('disabled_checkbox')}</ui-checkbox>
        <ui-checkbox checked disabled>${this.trans('checked_disabled')}</ui-checkbox>
        <ui-checkbox indeterminate disabled>${this.trans('indeterminate_disabled')}</ui-checkbox>
      </div>
    `;
  }

  private renderInteractive(): TemplateResult {
    const isChecked1 = this.checkboxStates['interactive-1'] || false;
    const isChecked2 = this.checkboxStates['interactive-2'] || false;
    const isChecked3 = this.checkboxStates['interactive-3'] || false;

    return html`
      <div class="space-y-6">
        <div class="space-y-4">
          <ui-checkbox
            @change=${(e: CustomEvent) => this.handleCheckboxChange('interactive-1', e)}
            .checked=${isChecked1}
          >
            ${this.trans('option_1')}
          </ui-checkbox>
          <ui-checkbox
            @change=${(e: CustomEvent) => this.handleCheckboxChange('interactive-2', e)}
            .checked=${isChecked2}
          >
            ${this.trans('option_2')}
          </ui-checkbox>
          <ui-checkbox
            @change=${(e: CustomEvent) => this.handleCheckboxChange('interactive-3', e)}
            .checked=${isChecked3}
          >
            ${this.trans('option_3')}
          </ui-checkbox>
        </div>

        <div
          class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50 dark:outline dark:-outline-offset-1 dark:outline-white/10"
        >
          <div class="text-sm text-gray-900 dark:text-white">
            <p class="font-semibold">${this.trans('selected_options')}</p>
            <ul class="mt-2 list-inside list-disc space-y-1 text-gray-600 dark:text-gray-400">
              ${isChecked1 ? html`<li>${this.trans('option_1')}</li>` : ''}
              ${isChecked2 ? html`<li>${this.trans('option_2')}</li>` : ''}
              ${isChecked3 ? html`<li>${this.trans('option_3')}</li>` : ''}
              ${!isChecked1 && !isChecked2 && !isChecked3 ? html`<li>${this.trans('none_selected')}</li>` : ''}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private renderUsageExamples(): TemplateResult {
    return html`
      <div class="space-y-6">
        ${pageCard(html`
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">${this.trans('terms_title')}</h3>
          <ui-checkbox>${this.trans('terms_agree')}</ui-checkbox>
        `)}
        ${pageCard(html`
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            ${this.trans('notifications_title')}
          </h3>
          <div class="space-y-3">
            <ui-checkbox checked>${this.trans('email_notifications')}</ui-checkbox>
            <ui-checkbox>${this.trans('push_notifications')}</ui-checkbox>
            <ui-checkbox checked>${this.trans('sms_notifications')}</ui-checkbox>
            <ui-checkbox>${this.trans('weekly_digest')}</ui-checkbox>
          </div>
        `)}
        ${pageCard(html`
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">${this.trans('features_title')}</h3>
          <div class="space-y-3">
            <ui-checkbox size="lg" checked>${this.trans('feature_advanced')}</ui-checkbox>
            <ui-checkbox size="lg">${this.trans('feature_beta')}</ui-checkbox>
            <ui-checkbox size="lg">${this.trans('feature_experimental')}</ui-checkbox>
          </div>
        `)}
        ${pageCard(html`
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            ${this.trans('small_checkboxes_title')}
          </h3>
          <div class="space-y-2">
            <ui-checkbox size="sm">${this.trans('remember_me')}</ui-checkbox>
            <ui-checkbox size="sm">${this.trans('keep_logged_in')}</ui-checkbox>
            <ui-checkbox size="sm">${this.trans('save_preferences')}</ui-checkbox>
          </div>
        `)}
      </div>
    `;
  }

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: this.trans('hero_title'),
        description: this.trans('hero_desc'),
        accent: 'success',
      })}
      ${pageSection({ title: this.trans('sizes_title'), description: this.trans('sizes_desc') }, this.renderSizes())}
      ${pageSection({ title: this.trans('states_title'), description: this.trans('states_desc') }, this.renderStates())}
      ${pageSection(
        { title: this.trans('interactive_title'), description: this.trans('interactive_desc') },
        this.renderInteractive()
      )}
      ${pageSection(
        { title: this.trans('usage_title'), description: this.trans('usage_desc') },
        this.renderUsageExamples()
      )}
    `);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-checkboxes': DefaultCheckboxes;
  }
}
