import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { cardHeading, PageElement, pageCard, pageContainer, pageHero } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/button/ui-button';

@customElement('default-counter')
export class DefaultCounter extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private count = 0;

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: 'Counter',
        description: 'A sample of a reactive counter component.',
        accent: 'primary',
      })}
      ${pageCard(html`
        ${cardHeading({
          title: 'Counter',
          description: "Uses Lit's @state() decorator to reactively render state changes.",
          accent: 'primary',
          icon: html`
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
            </svg>
          `,
        })}
        <div
          class="flex min-h-20 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
        >
          <span id="counter-value" class="text-5xl font-extrabold text-primary-600 dark:text-primary-400">
            ${this.count}
          </span>
        </div>

        <div class="mt-6 flex justify-center gap-3">
          <ui-button variant="danger" @click=${this.decrement}>Decrement [-]</ui-button>
          <ui-button variant="secondary" @click=${this.reset}>Reset</ui-button>
          <ui-button variant="success" @click=${this.increment}>Increment [+]</ui-button>
        </div>
      `)}
    `);
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
