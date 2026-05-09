import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageElement } from '@app/page';

import '@components/ui/dropdown/ui-dropdown';
import '@components/ui/button/ui-button';

import pageMetadata from './page.json';

@customElement('admin-dropdown')
export class AdminDropdown extends PageElement {
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

  private renderBasic(): TemplateResult {
    return html`
      <div class="flex flex-wrap gap-4">
        <ui-dropdown size="md">
          <ui-button slot="trigger" variant="primary">Options ▾</ui-button>
          <div slot="menu">
            <a
              href="#edit"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Edit</a
            >
            <a
              href="#duplicate"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Duplicate</a
            >
            <a
              href="#archive"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Archive</a
            >
            <hr class="my-1 border-gray-200 dark:border-white/10" />
            <a
              href="#delete"
              class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:text-red-400 dark:hover:bg-white/5"
              >Delete</a
            >
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
            <a
              href="#item1"
              class="block px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 1</a
            >
            <a
              href="#item2"
              class="block px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 2</a
            >
            <a
              href="#item3"
              class="block px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 3</a
            >
          </div>
        </ui-dropdown>

        <ui-dropdown size="md">
          <ui-button slot="trigger" variant="secondary" size="md">Medium ▾</ui-button>
          <div slot="menu">
            <a
              href="#item1"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 1</a
            >
            <a
              href="#item2"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 2</a
            >
            <a
              href="#item3"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 3</a
            >
          </div>
        </ui-dropdown>

        <ui-dropdown size="lg">
          <ui-button slot="trigger" variant="secondary" size="lg">Large ▾</ui-button>
          <div slot="menu">
            <a
              href="#item1"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 1</a
            >
            <a
              href="#item2"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 2</a
            >
            <a
              href="#item3"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 3</a
            >
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
          <div slot="menu">
            <a
              href="#item1"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 1</a
            >
            <a
              href="#item2"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 2</a
            >
          </div>
        </ui-dropdown>

        <ui-dropdown placement="bottom-end">
          <ui-button slot="trigger" variant="info">Bottom End ▾</ui-button>
          <div slot="menu">
            <a
              href="#item1"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 1</a
            >
            <a
              href="#item2"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Item 2</a
            >
          </div>
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
            <a
              href="#save"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Save</a
            >
            <a
              href="#save-as"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Save As...</a
            >
          </div>
        </ui-dropdown>

        <ui-dropdown>
          <ui-button slot="trigger" variant="success">Success ▾</ui-button>
          <div slot="menu">
            <a
              href="#approve"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Approve</a
            >
            <a
              href="#publish"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Publish</a
            >
          </div>
        </ui-dropdown>

        <ui-dropdown>
          <ui-button slot="trigger" variant="danger">Danger ▾</ui-button>
          <div slot="menu">
            <a
              href="#delete"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Delete</a
            >
            <a
              href="#remove"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Remove</a
            >
          </div>
        </ui-dropdown>

        <ui-dropdown>
          <ui-button slot="trigger" variant="soft">Soft ▾</ui-button>
          <div slot="menu">
            <a
              href="#option1"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Option 1</a
            >
            <a
              href="#option2"
              class="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
              >Option 2</a
            >
          </div>
        </ui-dropdown>
      </div>
    `;
  }

  private renderFeatures(): TemplateResult {
    return html`
      <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <h3 class="mb-2 text-lg font-medium text-blue-900 dark:text-blue-200">Features</h3>
        <ul class="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-300">
          <li>Click outside to close</li>
          <li>
            Press <kbd class="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs dark:bg-blue-800">Escape</kbd> to
            close
          </li>
          <li>
            Use <kbd class="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs dark:bg-blue-800">↑</kbd> and
            <kbd class="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs dark:bg-blue-800">↓</kbd> arrow keys to
            navigate menu items
          </li>
          <li>
            Use <kbd class="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs dark:bg-blue-800">Home</kbd> and
            <kbd class="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs dark:bg-blue-800">End</kbd> to jump to
            first/last item
          </li>
          <li>Smooth transition animations</li>
          <li>Accessible with ARIA attributes</li>
        </ul>
      </div>
    `;
  }

  protected override renderContents(): TemplateResult {
    return html`
      <div class="px-4 py-8 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dropdown Components</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            A comprehensive showcase of dropdown menu components with various configurations.
          </p>
        </div>

        ${this.renderSection('Basic', 'Standard dropdown menu with actions', this.renderBasic())}
        ${this.renderSection('Sizes', 'Three dropdown sizes: small, medium, and large', this.renderSizes())}
        ${this.renderSection('Placements', 'Control dropdown menu alignment', this.renderPlacements())}
        ${this.renderSection('Button Variants', 'Dropdowns with different button styles', this.renderVariants())}
        ${this.renderSection('Features', 'Keyboard navigation and accessibility', this.renderFeatures())}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-dropdown': AdminDropdown;
  }
}
