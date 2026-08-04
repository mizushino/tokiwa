import { Globe } from 'lucide';
import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { cardHeading, PageElement, pageCard, pageContainer, pageHero } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/icon/ui-icon';

@customElement('default-helloworld')
export class DefaultHelloWorld extends PageElement {
  protected pageMetadata = pageMetadata;

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: this.trans('hero_title'),
        description: this.trans('hero_desc'),
        accent: 'success',
      })}
      ${pageCard(html`
        ${cardHeading({
          title: this.trans('welcome'),
          accent: 'success',
          icon: html`<ui-icon class="size-5" .icon=${Globe}></ui-icon>`,
        })}
        <p class="text-gray-600 dark:text-gray-300">${this.trans('welcome_body')}</p>
      `)}
    `);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-helloworld': DefaultHelloWorld;
  }
}
