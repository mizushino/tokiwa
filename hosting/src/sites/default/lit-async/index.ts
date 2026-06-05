import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { track, loading } from 'lit-async';

import { PageElement } from '@app/page';

import pageMetadata from './page.json';

@customElement('default-lit-async')
export class DefaultLitAsync extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private promise!: Promise<string>;

  private counterGenerator: AsyncGenerator<number, void, unknown> | null = null;

  @state()
  private isGeneratorRunning = false;

  @state()
  private slowPromise!: Promise<string>;

  public override connectedCallback(): void {
    super.connectedCallback();
    this.reloadPromise();
    this.reloadSlowPromise();
    this.startGenerator();
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopGenerator();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private reloadPromise(): void {
    this.promise = (async () => {
      await this.delay(1000);
      const randomQuotes = [
        'Simplify, then add lightness. — Colin Chapman',
        'Make it work, make it right, make it fast. — Kent Beck',
        'Talk is cheap. Show me the code. — Linus Torvalds',
        'Programs must be written for people to read, and only incidentally for machines to execute. — Abelson & Sussman',
        'Clean code always looks like it was written by someone who cares. — Michael Feathers',
      ];
      const randomIndex = Math.floor(Math.random() * randomQuotes.length);
      return randomQuotes[randomIndex];
    })();
  }

  private reloadSlowPromise(): void {
    this.slowPromise = (async () => {
      await this.delay(2000);
      return 'Successfully loaded resource from simulated network!';
    })();
  }

  private async *createCounterGenerator(): AsyncGenerator<number, void, unknown> {
    let count = 0;
    while (this.isGeneratorRunning) {
      yield count++;
      await this.delay(1000);
    }
  }

  private startGenerator(): void {
    if (this.isGeneratorRunning) return;
    this.isGeneratorRunning = true;
    this.counterGenerator = this.createCounterGenerator();
    this.requestUpdate();
  }

  private stopGenerator(): void {
    this.isGeneratorRunning = false;
    this.counterGenerator = null;
    this.requestUpdate();
  }

  protected override render(): TemplateResult {
    return html`
      <div class="mx-auto max-w-4xl space-y-6 p-4">
        <div
          class="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-xl"
        >
          <div class="absolute top-0 right-0 translate-x-12 -translate-y-12 transform opacity-10">
            <svg width="300" height="300" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,15 90,85 10,85" />
            </svg>
          </div>
          <h1 class="mb-2 text-3xl font-extrabold tracking-tight">lit-async Demo</h1>
          <p class="max-w-xl text-violet-100">
            lit-async is a lightweight collection of directives and decorators for handling asynchronous operations
            directly in your Lit templates without boilerplate.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </span>
                <h2 class="text-xl font-bold">track(Promise)</h2>
              </div>
              <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Binds a Promise directly in the template. The template automatically updates when the Promise resolves.
              </p>
              <div
                class="flex min-h-20 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center font-medium italic dark:border-slate-800 dark:bg-slate-900/50"
              >
                ${track(loading(this.promise, html`<span class="text-slate-400">Loading promise...</span>`))}
              </div>
            </div>
            <div class="mt-6 flex justify-end">
              <button
                id="btn-reload-quote"
                @click=${this.reloadPromise}
                class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-blue-700"
              >
                Fetch Next Quote
              </button>
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18"
                    />
                  </svg>
                </span>
                <h2 class="text-xl font-bold">track(AsyncGenerator)</h2>
              </div>
              <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Binds an async generator. Re-renders reactively whenever a new value is yielded.
              </p>
              <div
                class="flex min-h-20 flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
              >
                ${this.counterGenerator
                  ? html`
                      <span id="generator-counter" class="text-3xl font-extrabold text-green-600 dark:text-green-400">
                        ${track(this.counterGenerator)}
                      </span>
                      <span class="mt-1 text-xs text-slate-400">seconds elapsed</span>
                    `
                  : html`<span id="generator-stopped" class="text-slate-400">Generator Stopped</span>`}
              </div>
            </div>
            <div class="mt-6 flex justify-end space-x-2">
              ${this.isGeneratorRunning
                ? html`
                    <button
                      id="btn-pause-generator"
                      @click=${this.stopGenerator}
                      class="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-red-700"
                    >
                      Pause
                    </button>
                  `
                : html`
                    <button
                      id="btn-resume-generator"
                      @click=${this.startGenerator}
                      class="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-green-700"
                    >
                      Resume
                    </button>
                  `}
            </div>
          </div>

          <div
            class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:col-span-2 dark:border-slate-700 dark:bg-slate-800"
          >
            <div>
              <div class="mb-3 flex items-center space-x-2">
                <span class="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                <h2 class="text-xl font-bold">loading() Helper</h2>
              </div>
              <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">
                The loading helper yields a placeholder value (like a spinner or text) until the promise resolves.
              </p>
              <div
                class="flex min-h-20 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center font-medium dark:border-slate-800 dark:bg-slate-900/50"
              >
                ${track(
                  loading(
                    this.slowPromise,
                    html`
                      <div
                        id="slow-loading-placeholder"
                        class="flex items-center space-x-2 text-purple-600 dark:text-purple-400"
                      >
                        <svg
                          class="mr-3 -ml-1 h-5 w-5 animate-spin text-purple-600 dark:text-purple-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                          ></circle>
                          <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Simulating slow network request (2s)...</span>
                      </div>
                    `
                  )
                )}
              </div>
            </div>
            <div class="mt-6 flex justify-end">
              <button
                id="btn-trigger-slow"
                @click=${this.reloadSlowPromise}
                class="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-purple-700"
              >
                Trigger Slow Request
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-lit-async': DefaultLitAsync;
  }
}
