import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { cardSubheading, PageElement, pageCard, pageContainer, pageHero, pageSection } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/button/ui-button';

@customElement('default-buttons')
export class DefaultButtons extends PageElement {
  protected pageMetadata = pageMetadata;

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
          ${cardSubheading(this.trans('full_width'))}
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
        ${pageCard(html`
          ${cardSubheading(this.trans('form_actions'))}
          <div class="flex justify-end gap-3">
            <ui-button variant="soft">${this.trans('cancel')}</ui-button>
            <ui-button variant="primary">${this.trans('save_changes')}</ui-button>
          </div>
        `)}
        ${pageCard(html`
          ${cardSubheading(this.trans('confirmation_dialog'))}
          <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">${this.trans('confirmation_message')}</div>
          <div class="flex gap-3">
            <ui-button variant="soft" fullWidth>${this.trans('cancel')}</ui-button>
            <ui-button variant="danger" fullWidth>${this.trans('delete')}</ui-button>
          </div>
        `)}
        ${pageCard(html`
          ${cardSubheading(this.trans('button_group'))}
          <div class="flex gap-2">
            <ui-button variant="soft" size="sm">${this.trans('view')}</ui-button>
            <ui-button variant="info" size="sm">${this.trans('edit')}</ui-button>
            <ui-button variant="danger" size="sm">${this.trans('delete')}</ui-button>
          </div>
        `)}
        ${pageCard(html`
          ${cardSubheading(this.trans('rounded_buttons'))}
          <div class="flex gap-3">
            <ui-button variant="primary" size="md" rounded>Primary</ui-button>
            <ui-button variant="success" size="md" rounded>Success</ui-button>
            <ui-button variant="soft" size="md" rounded>Soft</ui-button>
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
        accent: 'primary',
      })}
      ${pageSection(
        { title: this.trans('variants_title'), description: this.trans('variants_desc') },
        this.renderVariants()
      )}
      ${pageSection({ title: this.trans('sizes_title'), description: this.trans('sizes_desc') }, this.renderSizes())}
      ${pageSection(
        { title: this.trans('rounded_title'), description: this.trans('rounded_desc') },
        this.renderRounded()
      )}
      ${pageSection({ title: this.trans('states_title'), description: this.trans('states_desc') }, this.renderStates())}
      ${pageSection(
        { title: this.trans('usage_title'), description: this.trans('usage_desc') },
        this.renderUsageExamples()
      )}
    `);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-buttons': DefaultButtons;
  }
}
