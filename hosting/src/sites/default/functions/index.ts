import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { cardHeading, PageElement, pageCard, pageContainer, pageHero } from '@app/page';
import { sample } from '@services/sample';

import pageMetadata from './page.json';

import '@components/ui/button/ui-button';

@customElement('default-functions')
export class DefaultFunctions extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private sampleId = 'sample';

  @state()
  private name = 'Name';

  @state()
  private isSubmitting = false;

  @state()
  private result = '';

  @state()
  private error = '';

  private readonly inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: 'Functions',
        description: 'A sample of calling Callable Functions.',
        accent: 'danger',
      })}
      ${pageCard(html`
        ${cardHeading({
          title: 'Callable Function',
          description: 'Calls a Firebase Cloud Functions Callable Function to update the Sample document.',
          accent: 'danger',
          icon: html`
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          `,
        })}
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">ID</label>
            <input
              class=${this.inputClass}
              .value=${this.sampleId}
              @input=${(event: Event) => {
                this.sampleId = (event.target as HTMLInputElement).value;
              }}
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              class=${this.inputClass}
              .value=${this.name}
              @input=${(event: Event) => {
                this.name = (event.target as HTMLInputElement).value;
              }}
            />
          </div>

          <ui-button variant="primary" ?loading=${this.isSubmitting} @click=${this.runSample}>
            ${this.isSubmitting ? 'Running...' : 'Run Sample Function'}
          </ui-button>

          <div
            class="flex min-h-20 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
          >
            ${this.result
              ? html`<span class="font-medium text-success-600 dark:text-success-400">${this.result}</span>`
              : this.error
                ? html`<span class="font-medium text-danger-600 dark:text-danger-400">Error: ${this.error}</span>`
                : html`<span class="text-sm text-gray-400">Result will appear here...</span>`}
          </div>
        </div>
      `)}
    `);
  }

  private async runSample(): Promise<void> {
    this.isSubmitting = true;
    this.result = '';
    this.error = '';

    const response = await sample.run({ id: this.sampleId, name: this.name });

    this.isSubmitting = false;

    if (!response) {
      this.error = 'Function call failed';
      return;
    }

    this.result = `${response.id} / ${response.name} / count=${response.count}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-functions': DefaultFunctions;
  }
}
