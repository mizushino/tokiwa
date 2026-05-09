import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { PageElement } from '@app/page';

import pageMetadata from './page.json';

@customElement('default-counter')
export class DefaultCounter extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private count = 0;

  protected override render(): TemplateResult {
    return html`
      Count = ${this.count}<br />
      <button @click=${this.increment}>[+]</button>
      <button @click=${this.decrement}>[-]</button>
      <button @click=${this.reset}>[reset]</button>
    `;
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
