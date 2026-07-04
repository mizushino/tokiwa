import { html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { PageElement, pageContainer, pageHero } from '@app/page';

import pageMetadata from './page.json';

@customElement('admin-helloworld')
export class AdminHelloWorld extends PageElement {
  protected pageMetadata = pageMetadata;

  @property() name = 'World';

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: `Hello, ${this.name}!`,
        description: 'Admin panel sample page.',
        accent: 'primary',
      })}
    `);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-helloworld': AdminHelloWorld;
  }
}
