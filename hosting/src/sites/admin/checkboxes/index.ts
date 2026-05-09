import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { PageElement } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/checkbox/ui-checkbox';

@customElement('admin-checkboxes')
export class AdminCheckboxes extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private checkboxStates: Record<string, boolean> = {};

  private handleCheckboxChange(id: string, e: CustomEvent): void {
    this.checkboxStates = {
      ...this.checkboxStates,
      [id]: e.detail.checked,
    };
  }

  private renderSection(title: string, description: string, content: TemplateResult): TemplateResult {
    return html`
      <div class="mb-12">
        <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">${title}</h2>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">${description}</p>
        ${content}
      </div>
    `;
  }

  private renderSizes(): TemplateResult {
    return html`
      <div class="space-y-6">
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <span class="w-20 text-sm text-gray-600 dark:text-gray-400">SM:</span>
            <ui-checkbox size="sm">Small checkbox</ui-checkbox>
            <ui-checkbox size="sm" checked>Small checked</ui-checkbox>
            <ui-checkbox size="sm" disabled>Small disabled</ui-checkbox>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-20 text-sm text-gray-600 dark:text-gray-400">MD:</span>
            <ui-checkbox size="md">Medium checkbox</ui-checkbox>
            <ui-checkbox size="md" checked>Medium checked</ui-checkbox>
            <ui-checkbox size="md" disabled>Medium disabled</ui-checkbox>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-20 text-sm text-gray-600 dark:text-gray-400">LG:</span>
            <ui-checkbox size="lg">Large checkbox</ui-checkbox>
            <ui-checkbox size="lg" checked>Large checked</ui-checkbox>
            <ui-checkbox size="lg" disabled>Large disabled</ui-checkbox>
          </div>
        </div>
      </div>
    `;
  }

  private renderStates(): TemplateResult {
    return html`
      <div class="space-y-4">
        <ui-checkbox>Normal checkbox</ui-checkbox>
        <ui-checkbox checked>Checked checkbox</ui-checkbox>
        <ui-checkbox indeterminate>Indeterminate checkbox</ui-checkbox>
        <ui-checkbox disabled>Disabled checkbox</ui-checkbox>
        <ui-checkbox checked disabled>Checked & disabled</ui-checkbox>
        <ui-checkbox indeterminate disabled>Indeterminate & disabled</ui-checkbox>
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
            Option 1
          </ui-checkbox>
          <ui-checkbox
            @change=${(e: CustomEvent) => this.handleCheckboxChange('interactive-2', e)}
            .checked=${isChecked2}
          >
            Option 2
          </ui-checkbox>
          <ui-checkbox
            @change=${(e: CustomEvent) => this.handleCheckboxChange('interactive-3', e)}
            .checked=${isChecked3}
          >
            Option 3
          </ui-checkbox>
        </div>

        <div
          class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50 dark:outline dark:-outline-offset-1 dark:outline-white/10"
        >
          <div class="text-sm text-gray-900 dark:text-white">
            <p class="font-semibold">Selected Options:</p>
            <ul class="mt-2 list-inside list-disc space-y-1 text-gray-600 dark:text-gray-400">
              ${isChecked1 ? html`<li>Option 1</li>` : ''}
              ${isChecked2 ? html`<li>Option 2</li>` : ''}
              ${isChecked3 ? html`<li>Option 3</li>` : ''}
              ${!isChecked1 && !isChecked2 && !isChecked3 ? html`<li>None selected</li>` : ''}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private renderUsageExamples(): TemplateResult {
    return html`
      <div class="space-y-6">
        <div
          class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/50 dark:outline dark:-outline-offset-1 dark:outline-white/10"
        >
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Terms and Conditions</h3>
          <ui-checkbox>I agree to the terms and conditions</ui-checkbox>
        </div>

        <div
          class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/50 dark:outline dark:-outline-offset-1 dark:outline-white/10"
        >
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
          <div class="space-y-3">
            <ui-checkbox checked>Email notifications</ui-checkbox>
            <ui-checkbox>Push notifications</ui-checkbox>
            <ui-checkbox checked>SMS notifications</ui-checkbox>
            <ui-checkbox>Weekly digest</ui-checkbox>
          </div>
        </div>

        <div
          class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/50 dark:outline dark:-outline-offset-1 dark:outline-white/10"
        >
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Select Features</h3>
          <div class="space-y-3">
            <ui-checkbox size="lg" checked>Enable advanced features</ui-checkbox>
            <ui-checkbox size="lg">Enable beta features</ui-checkbox>
            <ui-checkbox size="lg">Enable experimental features</ui-checkbox>
          </div>
        </div>

        <div
          class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/50 dark:outline dark:-outline-offset-1 dark:outline-white/10"
        >
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Small Checkboxes</h3>
          <div class="space-y-2">
            <ui-checkbox size="sm">Remember me</ui-checkbox>
            <ui-checkbox size="sm">Keep me logged in</ui-checkbox>
            <ui-checkbox size="sm">Save my preferences</ui-checkbox>
          </div>
        </div>
      </div>
    `;
  }

  protected override renderContents(): TemplateResult {
    return html`
      <div class="px-4 py-8 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Checkbox Components</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            A comprehensive showcase of checkbox sizes, states, and interactive examples.
          </p>
        </div>

        ${this.renderSection('Sizes', 'Three checkbox sizes: small, medium, and large', this.renderSizes())}
        ${this.renderSection('States', 'All available checkbox states', this.renderStates())}
        ${this.renderSection('Interactive Example', 'Click checkboxes to see state updates', this.renderInteractive())}
        ${this.renderSection('Usage Examples', 'Common checkbox usage patterns', this.renderUsageExamples())}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-checkboxes': AdminCheckboxes;
  }
}
