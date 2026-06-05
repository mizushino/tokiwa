import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { PageElement } from '@app/page';

import pageMetadata from './page.json';

@customElement('default-counter')
export class DefaultCounter extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private count = 0;

  protected override render(): TemplateResult {
    return html`
      <div class="mx-auto max-w-4xl space-y-6 p-4">
        <div
          class="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 to-cyan-600 p-6 text-white shadow-xl"
        >
          <div class="absolute top-0 right-12 -translate-y-12 transform opacity-10">
            <svg width="300" height="300" viewBox="0 0 100 100" fill="currentColor">
              <rect x="20" y="20" width="60" height="60" rx="10" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold">Counter</h1>
          <p class="mt-2 text-sm opacity-90">A sample of a reactive counter component.</p>
        </div>

        <div
          class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div>
            <div class="mb-3 flex items-center space-x-2">
              <span class="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M3 6h18M3 14h18M3 18h18"
                  />
                </svg>
              </span>
              <h2 class="text-xl font-bold">Counter</h2>
            </div>
            <p class="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Uses Lit's @state() decorator to reactively render state changes.
            </p>

            <div
              class="flex min-h-20 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <span id="counter-value" class="text-5xl font-extrabold text-blue-600 dark:text-blue-400">
                ${this.count}
              </span>
            </div>

            <div class="mt-6 flex justify-center space-x-3">
              <button
                @click=${this.decrement}
                class="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-red-700"
              >
                Decrement [-]
              </button>
              <button
                @click=${this.reset}
                class="cursor-pointer rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-slate-700"
              >
                Reset
              </button>
              <button
                @click=${this.increment}
                class="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-green-700"
              >
                Increment [+]
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  protected increment(): void {
    this.count++;
  }

  protected decrement(): void {
    this.count--;
  }

  protected reset(): void {
    this.count = 0;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-counter': DefaultCounter;
  }
}
