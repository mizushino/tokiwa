import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { track } from 'lit-async';

import { PageElement } from '@app/page';
import { SampleDocument } from '@models/sample';

import pageMetadata from './page.json';

@customElement('default-firestore')
export class DefaultFirestore extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private loadResult = '';

  protected readonly inputRef = createRef<HTMLInputElement>();
  protected readonly sampleDocument = new SampleDocument({ id: 'sample' });

  protected override render(): TemplateResult {
    return html`
      <div class="mx-auto max-w-4xl space-y-6 p-4">
        <div
          class="relative overflow-hidden rounded-2xl bg-linear-to-r from-orange-600 to-amber-600 p-6 text-white shadow-xl"
        >
          <div class="absolute top-0 right-12 -translate-y-12 transform opacity-10">
            <svg width="300" height="300" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,10 90,90 10,90" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold">Firestore</h1>
          <p class="mt-2 text-sm opacity-90">A sample of real-time data synchronization and direct access.</p>
        </div>

        <div
          class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div>
            <div class="mb-3 flex items-center space-x-2">
              <span class="rounded-lg bg-orange-100 p-2 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </span>
              <h2 class="text-xl font-bold">Firestore Operations</h2>
            </div>
            <p class="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Access Firestore directly from the client to save and load data.
            </p>

            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <input
                  ${ref(this.inputRef)}
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter a name..."
                />
              </div>

              <div class="flex space-x-2">
                <button
                  @click=${this.save}
                  class="cursor-pointer rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-orange-700"
                >
                  Save
                </button>
                <button
                  @click=${this.load}
                  class="cursor-pointer rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-slate-700"
                >
                  Load
                </button>
              </div>

              ${this.loadResult
                ? html`
                    <div
                      class="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <span class="text-sm text-slate-600 dark:text-slate-300">Load Result: ${this.loadResult}</span>
                    </div>
                  `
                : ''}
            </div>
          </div>
        </div>

        <div
          class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div>
            <div class="mb-3 flex items-center space-x-2">
              <span class="rounded-lg bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </span>
              <h2 class="text-xl font-bold">Realtime Snapshot</h2>
            </div>
            <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Using lit-async's track() to reactively monitor Firestore snapshots.
            </p>
            <div
              class="flex min-h-20 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <span class="font-medium text-green-600 dark:text-green-400">
                ${track(this.sampleDocument.snapshot, (sample) => (sample ? sample.data.name : 'No data'))}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
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
