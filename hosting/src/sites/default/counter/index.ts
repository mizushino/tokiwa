import { List } from 'lucide';
import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { cardHeading, PageElement, pageCard, pageContainer, pageHero, pageResultBox } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/button/ui-button';
import '@components/ui/icon/ui-icon';

@customElement('default-counter')
export class DefaultCounter extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private count = 0;

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: this.trans('hero_title'),
        description: this.trans('hero_desc'),
        accent: 'primary',
      })}
      ${pageCard(html`
        ${cardHeading({
          title: this.trans('card_title'),
          description: this.trans('card_desc'),
          accent: 'primary',
          icon: html`<ui-icon class="size-5" .icon=${List}></ui-icon>`,
        })}
        ${pageResultBox(html`
          <span id="counter-value" class="text-5xl font-extrabold text-primary-600 dark:text-primary-400">
            ${this.count}
          </span>
        `)}

        <div class="mt-6 flex justify-center gap-3">
          <ui-button variant="danger" @click=${this.decrement}>${this.trans('decrement')}</ui-button>
          <ui-button variant="secondary" @click=${this.reset}>${this.trans('reset')}</ui-button>
          <ui-button variant="success" @click=${this.increment}>${this.trans('increment')}</ui-button>
        </div>
      `)}
    `);
  }

  protected increment = (): void => {
    this.count++;
  };

  protected decrement = (): void => {
    this.count--;
  };

  protected reset = (): void => {
    this.count = 0;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'default-counter': DefaultCounter;
  }
}
