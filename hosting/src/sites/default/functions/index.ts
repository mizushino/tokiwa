import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { PageElement } from '@app/page';
import { sample } from '@services/sample';

import pageMetadata from './page.json';

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

  protected override renderContents(): TemplateResult {
    return html`
      <div class="mx-auto max-w-4xl space-y-6 p-4">
        <div
          class="relative overflow-hidden rounded-2xl bg-linear-to-r from-pink-600 to-rose-600 p-6 text-white shadow-xl"
        >
          <div class="absolute top-0 right-12 -translate-y-12 transform opacity-10">
            <svg width="300" height="300" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,10 90,40 80,90 20,90 10,40" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold">Functions</h1>
          <p class="mt-2 text-sm opacity-90">A sample of calling Callable Functions.</p>
        </div>

        <div
          class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div>
            <div class="mb-3 flex items-center space-x-2">
              <span class="rounded-lg bg-pink-100 p-2 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <h2 class="text-xl font-bold">Callable Function</h2>
            </div>
            <p class="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Calls a Firebase Cloud Functions Callable Function to update the Sample document.
            </p>

            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">ID</label>
                <input
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 transition-colors focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  .value=${this.sampleId}
                  @input=${(event: Event) => {
                    this.sampleId = (event.target as HTMLInputElement).value;
                  }}
                />
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <input
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 transition-colors focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  .value=${this.name}
                  @input=${(event: Event) => {
                    this.name = (event.target as HTMLInputElement).value;
                  }}
                />
              </div>

              <button
                class="cursor-pointer rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-pink-700 disabled:opacity-50"
                ?disabled=${this.isSubmitting}
                @click=${this.runSample}
              >
                ${this.isSubmitting ? 'Running...' : 'Run Sample Function'}
              </button>

              <div
                class="flex min-h-20 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
              >
                ${this.result
                  ? html`<span class="font-medium text-green-600 dark:text-green-400">${this.result}</span>`
                  : this.error
                    ? html`<span class="font-medium text-red-600 dark:text-red-400">Error: ${this.error}</span>`
                    : html`<span class="text-sm text-slate-400">Result will appear here...</span>`}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
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
