import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageElement } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/button/ui-button';

@customElement('admin-buttons')
export class AdminButtons extends PageElement {
  protected pageMetadata = pageMetadata;

  private renderSection(title: string, description: string, content: TemplateResult): TemplateResult {
    return html`
      <div class="mb-12">
        <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">${title}</h2>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">${description}</p>
        ${content}
      </div>
    `;
  }

  private renderVariants(): TemplateResult {
    return html`
      <div class="flex flex-wrap gap-4">
        <ui-button variant="primary">Primary</ui-button>
        <ui-button variant="secondary">Secondary</ui-button>
        <ui-button variant="success">Success</ui-button>
        <ui-button variant="danger">Danger</ui-button>
        <ui-button variant="warning">Warning</ui-button>
        <ui-button variant="info">Info</ui-button>
        <ui-button variant="soft">Soft</ui-button>
      </div>
    `;
  }

  private renderSizes(): TemplateResult {
    return html`
      <div class="space-y-6">
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <span class="w-20 text-sm text-gray-600 dark:text-gray-400">XS:</span>
            <ui-button variant="primary" size="xs">Button text</ui-button>
            <ui-button variant="danger" size="xs">Button text</ui-button>
            <ui-button variant="soft" size="xs">Button text</ui-button>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-20 text-sm text-gray-600 dark:text-gray-400">SM:</span>
            <ui-button variant="primary" size="sm">Button text</ui-button>
            <ui-button variant="danger" size="sm">Button text</ui-button>
            <ui-button variant="soft" size="sm">Button text</ui-button>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-20 text-sm text-gray-600 dark:text-gray-400">MD:</span>
            <ui-button variant="primary" size="md">Button text</ui-button>
            <ui-button variant="danger" size="md">Button text</ui-button>
            <ui-button variant="soft" size="md">Button text</ui-button>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-20 text-sm text-gray-600 dark:text-gray-400">LG:</span>
            <ui-button variant="primary" size="lg">Button text</ui-button>
            <ui-button variant="danger" size="lg">Button text</ui-button>
            <ui-button variant="soft" size="lg">Button text</ui-button>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-20 text-sm text-gray-600 dark:text-gray-400">XL:</span>
            <ui-button variant="primary" size="xl">Button text</ui-button>
            <ui-button variant="danger" size="xl">Button text</ui-button>
            <ui-button variant="soft" size="xl">Button text</ui-button>
          </div>
        </div>

        <div>
          <h3 class="mb-4 text-sm font-medium text-gray-900 dark:text-white">Full Width</h3>
          <div class="space-y-4">
            <ui-button variant="primary" size="md" fullWidth>Full Width Primary</ui-button>
            <ui-button variant="danger" size="md" fullWidth>Full Width Danger</ui-button>
            <ui-button variant="soft" size="md" fullWidth>Full Width Soft</ui-button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStates(): TemplateResult {
    return html`
      <div class="flex flex-wrap gap-4">
        <ui-button variant="primary">Normal</ui-button>
        <ui-button variant="primary" disabled>Disabled</ui-button>
        <ui-button variant="primary" loading>Loading</ui-button>
        <ui-button variant="danger">Normal</ui-button>
        <ui-button variant="danger" disabled>Disabled</ui-button>
        <ui-button variant="danger" loading>Loading</ui-button>
      </div>
    `;
  }

  private renderRounded(): TemplateResult {
    return html`
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-600 dark:text-gray-400">XS:</span>
          <ui-button variant="primary" size="xs" rounded>Button text</ui-button>
          <ui-button variant="danger" size="xs" rounded>Button text</ui-button>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-600 dark:text-gray-400">SM:</span>
          <ui-button variant="primary" size="sm" rounded>Button text</ui-button>
          <ui-button variant="danger" size="sm" rounded>Button text</ui-button>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-600 dark:text-gray-400">MD:</span>
          <ui-button variant="primary" size="md" rounded>Button text</ui-button>
          <ui-button variant="danger" size="md" rounded>Button text</ui-button>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-600 dark:text-gray-400">LG:</span>
          <ui-button variant="primary" size="lg" rounded>Button text</ui-button>
          <ui-button variant="danger" size="lg" rounded>Button text</ui-button>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-600 dark:text-gray-400">XL:</span>
          <ui-button variant="primary" size="xl" rounded>Button text</ui-button>
          <ui-button variant="danger" size="xl" rounded>Button text</ui-button>
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
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Form Actions</h3>
          <div class="flex justify-end gap-3">
            <ui-button variant="soft">Cancel</ui-button>
            <ui-button variant="primary">Save Changes</ui-button>
          </div>
        </div>

        <div
          class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/50 dark:outline dark:-outline-offset-1 dark:outline-white/10"
        >
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Confirmation Dialog</h3>
          <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this item? This action cannot be undone.
          </div>
          <div class="flex gap-3">
            <ui-button variant="soft" fullWidth>Cancel</ui-button>
            <ui-button variant="danger" fullWidth>Delete</ui-button>
          </div>
        </div>

        <div
          class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/50 dark:outline dark:-outline-offset-1 dark:outline-white/10"
        >
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Button Group</h3>
          <div class="flex gap-2">
            <ui-button variant="soft" size="sm">View</ui-button>
            <ui-button variant="info" size="sm">Edit</ui-button>
            <ui-button variant="danger" size="sm">Delete</ui-button>
          </div>
        </div>

        <div
          class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/50 dark:outline dark:-outline-offset-1 dark:outline-white/10"
        >
          <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Rounded Buttons</h3>
          <div class="flex gap-3">
            <ui-button variant="primary" size="md" rounded>Primary</ui-button>
            <ui-button variant="success" size="md" rounded>Success</ui-button>
            <ui-button variant="soft" size="md" rounded>Soft</ui-button>
          </div>
        </div>
      </div>
    `;
  }

  protected override renderContents(): TemplateResult {
    return html`
      <div class="px-4 py-8 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Button Components</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            A comprehensive showcase of button variants, sizes, and states.
          </p>
        </div>

        ${this.renderSection('Variants', 'All available button color variants', this.renderVariants())}
        ${this.renderSection('Sizes', 'Five button sizes from XS to XL with full-width option', this.renderSizes())}
        ${this.renderSection('Rounded', 'Full rounded buttons for all sizes', this.renderRounded())}
        ${this.renderSection('States', 'Button states including disabled and loading', this.renderStates())}
        ${this.renderSection('Usage Examples', 'Common button usage patterns', this.renderUsageExamples())}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-buttons': AdminButtons;
  }
}
