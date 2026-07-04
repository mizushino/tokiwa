import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageElement, pageContainer, pageHero, pageSection } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/dropdown/ui-dropdown';
import '@components/ui/button/ui-button';

@customElement('default-dropdown')
export class DefaultDropdown extends PageElement {
  protected pageMetadata = pageMetadata;

  /** Renders a single dropdown menu link with consistent styling. */
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
          <ui-button slot="trigger" variant="primary">Options ▾</ui-button>
          <div slot="menu">
            ${this.menuItem('#edit', 'Edit')} ${this.menuItem('#duplicate', 'Duplicate')}
            ${this.menuItem('#archive', 'Archive')}
            <hr class="my-1 border-gray-200 dark:border-white/10" />
            ${this.menuItem('#delete', 'Delete', { danger: true })}
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
          <div slot="menu">${this.menuItem('#save', 'Save')} ${this.menuItem('#save-as', 'Save As...')}</div>
        </ui-dropdown>

        <ui-dropdown>
          <ui-button slot="trigger" variant="success">Success ▾</ui-button>
          <div slot="menu">${this.menuItem('#approve', 'Approve')} ${this.menuItem('#publish', 'Publish')}</div>
        </ui-dropdown>

        <ui-dropdown>
          <ui-button slot="trigger" variant="danger">Danger ▾</ui-button>
          <div slot="menu">
            ${this.menuItem('#delete', 'Delete', { danger: true })}
            ${this.menuItem('#remove', 'Remove', { danger: true })}
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
        <h3 class="mb-2 text-lg font-medium text-info-900 dark:text-info-200">Features</h3>
        <ul class="list-inside list-disc space-y-1 text-sm text-info-800 dark:text-info-300">
          <li>Click outside to close</li>
          <li>Press <kbd class="${kbd}">Escape</kbd> to close</li>
          <li>Use <kbd class="${kbd}">↑</kbd> and <kbd class="${kbd}">↓</kbd> arrow keys to navigate menu items</li>
          <li>Use <kbd class="${kbd}">Home</kbd> and <kbd class="${kbd}">End</kbd> to jump to first/last item</li>
          <li>Smooth transition animations</li>
          <li>Accessible with ARIA attributes</li>
        </ul>
      </div>
    `;
  }

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: 'Dropdown',
        description: 'A showcase of dropdown menu components with various configurations.',
        accent: 'info',
      })}
      ${pageSection({ title: 'Basic', description: 'Standard dropdown menu with actions' }, this.renderBasic())}
      ${pageSection(
        { title: 'Sizes', description: 'Three dropdown sizes: small, medium, and large' },
        this.renderSizes()
      )}
      ${pageSection({ title: 'Placements', description: 'Control dropdown menu alignment' }, this.renderPlacements())}
      ${pageSection(
        { title: 'Button Variants', description: 'Dropdowns with different button styles' },
        this.renderVariants()
      )}
      ${pageSection({ title: 'Features', description: 'Keyboard navigation and accessibility' }, this.renderFeatures())}
    `);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-dropdown': DefaultDropdown;
  }
}
