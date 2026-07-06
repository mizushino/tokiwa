import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { track, loading } from 'lit-async';

import { cardHeading, PageElement, pageCard, pageContainer, pageHero, pageResultBox } from '@app/page';
import { spinnerIcon } from '@components/ui/spinner';

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

  private reloadPromise = (): void => {
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
  };

  private reloadSlowPromise = (): void => {
    this.slowPromise = (async () => {
      await this.delay(2000);
      return 'Successfully loaded resource from simulated network!';
    })();
  };

  private async *createCounterGenerator(): AsyncGenerator<number, void, unknown> {
    let count = 0;
    while (this.isGeneratorRunning) {
      yield count++;
      await this.delay(1000);
    }
  }

  private startGenerator = (): void => {
    if (this.isGeneratorRunning) return;
    this.isGeneratorRunning = true;
    this.counterGenerator = this.createCounterGenerator();
    this.requestUpdate();
  };

  private stopGenerator = (): void => {
    this.isGeneratorRunning = false;
    this.counterGenerator = null;
    this.requestUpdate();
  };

  private asyncDemoCard(
    { heading, body, footer }: { heading: TemplateResult; body: TemplateResult; footer: TemplateResult },
    extraClass = ''
  ): TemplateResult {
    return pageCard(
      html`
        <div class="flex h-full flex-col justify-between">
          <div>${heading} ${body}</div>
          <div class="mt-6 flex justify-end gap-2">${footer}</div>
        </div>
      `,
      extraClass
    );
  }

  private renderPromiseCard(): TemplateResult {
    return this.asyncDemoCard({
      heading: cardHeading({
        title: 'track(Promise)',
        description: this.trans('promise_desc'),
        accent: 'info',
        icon: html`
          <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        `,
      }),
      body: pageResultBox(
        html`${track(loading(this.promise, html`<span class="text-gray-400">${this.trans('loading_promise')}</span>`))}`,
        'text-center font-medium italic'
      ),
      footer: html`
        <ui-button id="btn-reload-quote" variant="info" @click=${this.reloadPromise}
          >${this.trans('fetch_quote')}</ui-button
        >
      `,
    });
  }

  private renderGeneratorCard(): TemplateResult {
    return this.asyncDemoCard({
      heading: cardHeading({
        title: 'track(AsyncGenerator)',
        description: this.trans('generator_desc'),
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
      }),
      body: pageResultBox(
        html`
          ${this.counterGenerator
            ? html`
                <span id="generator-counter" class="text-3xl font-extrabold text-success-600 dark:text-success-400">
                  ${track(this.counterGenerator)}
                </span>
                <span class="mt-1 text-xs text-gray-400">${this.trans('seconds_elapsed')}</span>
              `
            : html`<span id="generator-stopped" class="text-gray-400">${this.trans('generator_stopped')}</span>`}
        `,
        'flex-col'
      ),
      footer: html`
        ${this.isGeneratorRunning
          ? html`<ui-button id="btn-pause-generator" variant="danger" @click=${this.stopGenerator}
              >${this.trans('pause')}</ui-button
            >`
          : html`<ui-button id="btn-resume-generator" variant="success" @click=${this.startGenerator}>
              ${this.trans('resume')}
            </ui-button>`}
      `,
    });
  }

  private renderLoadingCard(): TemplateResult {
    return this.asyncDemoCard(
      {
        heading: cardHeading({
          title: 'loading() Helper',
          description: this.trans('loading_helper_desc'),
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
        }),
        body: pageResultBox(
          html`${track(
            loading(
              this.slowPromise,
              html`
                <div
                  id="slow-loading-placeholder"
                  class="flex items-center gap-2 text-primary-600 dark:text-primary-400"
                >
                  ${spinnerIcon('size-5')}
                  <span>${this.trans('simulating_slow')}</span>
                </div>
              `
            )
          )}`,
          'text-center font-medium'
        ),
        footer: html`
          <ui-button id="btn-trigger-slow" variant="primary" @click=${this.reloadSlowPromise}>
            ${this.trans('trigger_slow')}
          </ui-button>
        `,
      },
      'md:col-span-2'
    );
  }

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: this.trans('hero_title'),
        description: this.trans('hero_desc'),
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
