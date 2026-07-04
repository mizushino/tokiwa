import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { track, loading } from 'lit-async';

import { cardHeading, PageElement, pageCard, pageContainer, pageHero } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/button/ui-button';

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

  private renderPromiseCard(): TemplateResult {
    return pageCard(html`
      <div class="flex h-full flex-col justify-between">
        <div>
          ${cardHeading({
            title: 'track(Promise)',
            description:
              'Binds a Promise directly in the template. The template automatically updates when the Promise resolves.',
            accent: 'info',
            icon: html`
              <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            `,
          })}
          <div
            class="flex min-h-20 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-4 text-center font-medium italic dark:border-gray-800 dark:bg-gray-900/50"
          >
            ${track(loading(this.promise, html`<span class="text-gray-400">Loading promise...</span>`))}
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <ui-button id="btn-reload-quote" variant="info" @click=${this.reloadPromise}>Fetch Next Quote</ui-button>
        </div>
      </div>
    `);
  }

  private renderGeneratorCard(): TemplateResult {
    return pageCard(html`
      <div class="flex h-full flex-col justify-between">
        <div>
          ${cardHeading({
            title: 'track(AsyncGenerator)',
            description: 'Binds an async generator. Re-renders reactively whenever a new value is yielded.',
            accent: 'success',
            icon: html`
              <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18"
                />
              </svg>
            `,
          })}
          <div
            class="flex min-h-20 flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
          >
            ${this.counterGenerator
              ? html`
                  <span id="generator-counter" class="text-3xl font-extrabold text-success-600 dark:text-success-400">
                    ${track(this.counterGenerator)}
                  </span>
                  <span class="mt-1 text-xs text-gray-400">seconds elapsed</span>
                `
              : html`<span id="generator-stopped" class="text-gray-400">Generator Stopped</span>`}
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          ${this.isGeneratorRunning
            ? html`<ui-button id="btn-pause-generator" variant="danger" @click=${this.stopGenerator}>Pause</ui-button>`
            : html`<ui-button id="btn-resume-generator" variant="success" @click=${this.startGenerator}>
                Resume
              </ui-button>`}
        </div>
      </div>
    `);
  }

  private renderLoadingCard(): TemplateResult {
    return pageCard(
      html`
        <div class="flex h-full flex-col justify-between">
          <div>
            ${cardHeading({
              title: 'loading() Helper',
              description: 'The loading helper yields a placeholder value (like a spinner or text) until the promise resolves.',
              accent: 'primary',
              icon: html`
                <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              `,
            })}
            <div
              class="flex min-h-20 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-4 text-center font-medium dark:border-gray-800 dark:bg-gray-900/50"
            >
              ${track(
                loading(
                  this.slowPromise,
                  html`
                    <div
                      id="slow-loading-placeholder"
                      class="flex items-center gap-2 text-primary-600 dark:text-primary-400"
                    >
                      <svg class="size-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
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
            <ui-button id="btn-trigger-slow" variant="primary" @click=${this.reloadSlowPromise}>
              Trigger Slow Request
            </ui-button>
          </div>
        </div>
      `,
      'md:col-span-2'
    );
  }

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: 'lit-async Demo',
        description:
          'lit-async is a lightweight collection of directives and decorators for handling asynchronous operations directly in your Lit templates without boilerplate.',
        accent: 'info',
      })}
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        ${this.renderPromiseCard()} ${this.renderGeneratorCard()} ${this.renderLoadingCard()}
      </div>
    `);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-lit-async': DefaultLitAsync;
  }
}
