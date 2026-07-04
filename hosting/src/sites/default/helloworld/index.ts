import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { cardHeading, PageElement, pageCard, pageContainer, pageHero } from '@app/page';

import pageMetadata from './page.json';

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
          icon: html`
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          `,
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
