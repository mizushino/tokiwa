import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageElement, pageContainer, pageHero, pageSection } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/dropdown/ui-dropdown';
import '@components/ui/button/ui-button';

@customElement('default-dropdown')
export class DefaultDropdown extends PageElement {
  protected pageMetadata = pageMetadata;

  private menuItem(
    href: string,
    label: string,
    { size = 'md', danger = false }: { size?: 'sm' | 'md'; danger?: boolean } = {}
  ): TemplateResult {
    const padding = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
    const color = danger ? 'text-danger-600 dark:text-danger-400' : 'text-gray-900 dark:text-white';
    return html`<a href=${href} class="block ${padding} ${color} hover:bg-gray-50 dark:hover:bg-white/5">${label}</a>`;
  }

  private renderBasic(): TemplateResult {
    return html`
      <div class="flex flex-wrap gap-4">
        <ui-dropdown size="md">
          <ui-button slot="trigger" variant="primary">${this.trans('options')} ▾</ui-button>
          <div slot="menu">
            ${this.menuItem('#edit', this.trans('edit'))} ${this.menuItem('#duplicate', this.trans('duplicate'))}
            ${this.menuItem('#archive', this.trans('archive'))}
            <hr class="my-1 border-gray-200 dark:border-white/10" />
            ${this.menuItem('#delete', this.trans('delete'), { danger: true })}
          </div>
        </ui-dropdown>
      </div>
    `;
  }

  private renderSizes(): TemplateResult {
    return html`
      <div class="flex flex-wrap items-start gap-4">
        <ui-dropdown size="sm">
          <ui-button slot="trigger" variant="secondary" size="sm">Small ▾</ui-button>
          <div slot="menu">
            ${this.menuItem('#item1', 'Item 1', { size: 'sm' })} ${this.menuItem('#item2', 'Item 2', { size: 'sm' })}
            ${this.menuItem('#item3', 'Item 3', { size: 'sm' })}
          </div>
        </ui-dropdown>

        <ui-dropdown size="md">
          <ui-button slot="trigger" variant="secondary" size="md">Medium ▾</ui-button>
          <div slot="menu">
            ${this.menuItem('#item1', 'Item 1')} ${this.menuItem('#item2', 'Item 2')}
            ${this.menuItem('#item3', 'Item 3')}
          </div>
        </ui-dropdown>

        <ui-dropdown size="lg">
          <ui-button slot="trigger" variant="secondary" size="lg">Large ▾</ui-button>
          <div slot="menu">
            ${this.menuItem('#item1', 'Item 1')} ${this.menuItem('#item2', 'Item 2')}
            ${this.menuItem('#item3', 'Item 3')}
          </div>
        </ui-dropdown>
      </div>
    `;
  }

  private renderPlacements(): TemplateResult {
    return html`
      <div class="flex flex-wrap items-start gap-4">
        <ui-dropdown placement="bottom-start">
          <ui-button slot="trigger" variant="info">Bottom Start ▾</ui-button>
          <div slot="menu">${this.menuItem('#item1', 'Item 1')} ${this.menuItem('#item2', 'Item 2')}</div>
        </ui-dropdown>

        <ui-dropdown placement="bottom-end">
          <ui-button slot="trigger" variant="info">Bottom End ▾</ui-button>
          <div slot="menu">${this.menuItem('#item1', 'Item 1')} ${this.menuItem('#item2', 'Item 2')}</div>
        </ui-dropdown>
      </div>
    `;
  }

  private renderVariants(): TemplateResult {
    return html`
      <div class="flex flex-wrap items-start gap-4">
        <ui-dropdown>
          <ui-button slot="trigger" variant="primary">Primary ▾</ui-button>
          <div slot="menu">
            ${this.menuItem('#save', this.trans('save'))} ${this.menuItem('#save-as', this.trans('save_as'))}
          </div>
        </ui-dropdown>

        <ui-dropdown>
          <ui-button slot="trigger" variant="success">Success ▾</ui-button>
          <div slot="menu">
            ${this.menuItem('#approve', this.trans('approve'))} ${this.menuItem('#publish', this.trans('publish'))}
          </div>
        </ui-dropdown>

        <ui-dropdown>
          <ui-button slot="trigger" variant="danger">Danger ▾</ui-button>
          <div slot="menu">
            ${this.menuItem('#delete', this.trans('delete'), { danger: true })}
            ${this.menuItem('#remove', this.trans('remove'), { danger: true })}
          </div>
        </ui-dropdown>

        <ui-dropdown>
          <ui-button slot="trigger" variant="soft">Soft ▾</ui-button>
          <div slot="menu">${this.menuItem('#option1', 'Option 1')} ${this.menuItem('#option2', 'Option 2')}</div>
        </ui-dropdown>
      </div>
    `;
  }

  private renderFeatures(): TemplateResult {
    const kbd = 'rounded bg-info-100 px-1.5 py-0.5 font-mono text-xs dark:bg-info-800';
    return html`
      <div class="rounded-lg bg-info-50 p-4 dark:bg-info-900/20">
        <h3 class="mb-2 text-lg font-medium text-info-900 dark:text-info-200">${this.trans('features')}</h3>
        <ul class="list-inside list-disc space-y-1 text-sm text-info-800 dark:text-info-300">
          <li>${this.trans('feature_click_outside')}</li>
          <li>${this.trans('feature_escape_prefix')} <kbd class="${kbd}">Escape</kbd> ${this.trans('feature_escape_suffix')}</li>
          <li>${this.trans('feature_arrows_prefix')} <kbd class="${kbd}">↑</kbd> ${this.trans('feature_and')} <kbd class="${kbd}">↓</kbd> ${this.trans('feature_arrows_suffix')}</li>
          <li>${this.trans('feature_homeend_prefix')} <kbd class="${kbd}">Home</kbd> ${this.trans('feature_and')} <kbd class="${kbd}">End</kbd> ${this.trans('feature_homeend_suffix')}</li>
          <li>${this.trans('feature_transitions')}</li>
          <li>${this.trans('feature_aria')}</li>
        </ul>
      </div>
    `;
  }

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: this.trans('hero_title'),
        description: this.trans('hero_desc'),
        accent: 'info',
      })}
      ${pageSection({ title: this.trans('basic_title'), description: this.trans('basic_desc') }, this.renderBasic())}
      ${pageSection(
        { title: this.trans('sizes_title'), description: this.trans('sizes_desc') },
        this.renderSizes()
      )}
      ${pageSection(
        { title: this.trans('placements_title'), description: this.trans('placements_desc') },
        this.renderPlacements()
      )}
      ${pageSection(
        { title: this.trans('variants_title'), description: this.trans('variants_desc') },
        this.renderVariants()
      )}
      ${pageSection(
        { title: this.trans('features_title'), description: this.trans('features_desc') },
        this.renderFeatures()
      )}
    `);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-dropdown': DefaultDropdown;
  }
}
