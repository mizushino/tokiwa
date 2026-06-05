import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageElement } from '@app/page';

import pageMetadata from './page.json';

@customElement('default-helloworld')
export class DefaultHelloWorld extends PageElement {
  protected pageMetadata = pageMetadata;

  protected override render(): TemplateResult {
    return html`
      <div class="mx-auto max-w-4xl space-y-6 p-4">
        <div
          class="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-xl"
        >
          <div class="absolute top-0 right-12 -translate-y-12 transform opacity-10">
            <svg width="300" height="300" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="40" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold">Hello, World!</h1>
          <p class="mt-2 text-sm opacity-90">A simple Lit component sample.</p>
        </div>

        <div
          class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div>
            <div class="mb-3 flex items-center space-x-2">
              <span class="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <h2 class="text-xl font-bold">Welcome</h2>
            </div>
            <p class="text-slate-600 dark:text-slate-300">
              This is a simple "Hello, World!" sample page built with Lit. Components are composed using custom elements
              and Shadow DOM.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-helloworld': DefaultHelloWorld;
  }
}
