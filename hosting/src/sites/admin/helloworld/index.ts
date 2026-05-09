import { html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { PageElement } from '@app/page';

import pageMetadata from './page.json';

@customElement('admin-helloworld')
export class AdminHelloWorld extends PageElement {
  protected pageMetadata = pageMetadata;

  @property() name = 'World';

  protected override render(): TemplateResult {
    return html`<div class="px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Hello, ${this.name}!</h1>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-helloworld': AdminHelloWorld;
  }
}
