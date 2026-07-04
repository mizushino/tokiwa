import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { track } from 'lit-async';

import { cardHeading, PageElement, pageCard, pageContainer, pageHero } from '@app/page';
import { SampleDocument } from '@models/sample';

import pageMetadata from './page.json';

import '@components/ui/button/ui-button';

@customElement('default-firestore')
export class DefaultFirestore extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private loadResult = '';

  protected readonly inputRef = createRef<HTMLInputElement>();
  protected readonly sampleDocument = new SampleDocument({ id: 'sample' });

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: 'Firestore',
        description: 'A sample of real-time data synchronization and direct access.',
        accent: 'warning',
      })}
      ${pageCard(html`
        ${cardHeading({
          title: 'Firestore Operations',
          description: 'Access Firestore directly from the client to save and load data.',
          accent: 'warning',
          icon: html`
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
          `,
        })}
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              ${ref(this.inputRef)}
              id="name-input"
              placeholder="Enter a name..."
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div class="flex gap-2">
            <ui-button variant="primary" @click=${this.save}>Save</ui-button>
            <ui-button variant="secondary" @click=${this.load}>Load</ui-button>
          </div>

          ${this.loadResult
            ? html`
                <div
                  class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
                >
                  <span class="text-sm text-gray-600 dark:text-gray-300">Load result: ${this.loadResult}</span>
                </div>
              `
            : ''}
        </div>
      `)}
      ${pageCard(html`
        ${cardHeading({
          title: 'Realtime Snapshot',
          description: "Using lit-async's track() to reactively monitor Firestore snapshots.",
          accent: 'success',
          icon: html`
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          `,
        })}
        <div
          class="flex min-h-20 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
        >
          <span class="font-medium text-success-600 dark:text-success-400">
            ${track(this.sampleDocument.snapshot, (sample) => (sample ? sample.data.name : 'No data'))}
          </span>
        </div>
      `)}
    `);
  }

  private async load(): Promise<void> {
    this.loadResult = 'loading...';
    await this.sampleDocument.get();
    this.loadResult = this.sampleDocument.data.name;
  }

  private async save(): Promise<void> {
    const inputElement = this.inputRef.value;
    if (inputElement !== undefined) {
      const updatedDocument = new SampleDocument(
        { id: 'sample' },
        {
          ...(this.sampleDocument.exists ? this.sampleDocument.data : SampleDocument.defaultData),
          name: inputElement.value,
        }
      );
      await updatedDocument.save();
      await this.sampleDocument.get();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-firestore': DefaultFirestore;
  }
}
