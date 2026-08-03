import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { cardHeading, PageElement, pageCard, pageContainer, pageHero, pageResultBox } from '@app/page';
import { sample } from '@services/sample';

import pageMetadata from './page.json';

import '@components/ui/button/ui-button';
import '@components/ui/input/ui-input';

@customElement('default-functions')
export class DefaultFunctions extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private sampleId = 'sample';

  @state()
  private name = 'Name';

  @state()
  private isSubmitting = false;

  @state()
  private result = '';

  @state()
  private error = '';

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: this.trans('hero_title'),
        description: this.trans('hero_desc'),
        accent: 'danger',
      })}
      ${pageCard(html`
        ${cardHeading({
          title: this.trans('card_title'),
          description: this.trans('card_desc'),
          accent: 'danger',
          icon: html`
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          `,
        })}
        <div class="space-y-4">
          <ui-input
            label=${this.trans('id')}
            .value=${this.sampleId}
            @input=${(event: CustomEvent<{ value: string }>) => {
              this.sampleId = event.detail.value;
            }}
          ></ui-input>

          <ui-input
            label=${this.trans('name')}
            .value=${this.name}
            @input=${(event: CustomEvent<{ value: string }>) => {
              this.name = event.detail.value;
            }}
          ></ui-input>

          <ui-button variant="primary" ?loading=${this.isSubmitting} @click=${this.runSample}>
            ${this.isSubmitting ? this.trans('running') : this.trans('run_sample')}
          </ui-button>

          ${pageResultBox(html`
            ${this.result
              ? html`<span class="font-medium text-success-600 dark:text-success-400">${this.result}</span>`
              : this.error
                ? html`<span class="font-medium text-danger-600 dark:text-danger-400"
                    >${this.trans('error')}: ${this.error}</span
                  >`
                : html`<span class="text-sm text-gray-400">${this.trans('result_placeholder')}</span>`}
          `)}
        </div>
      `)}
    `);
  }

  private runSample = async (): Promise<void> => {
    this.isSubmitting = true;
    this.result = '';
    this.error = '';

    const response = await sample.run({ id: this.sampleId, name: this.name });

    this.isSubmitting = false;

    if (!response.ok) {
      this.error = `${this.trans('function_call_failed')} (${response.error.code})`;
      return;
    }

    this.result = `${response.data.id} / ${response.data.name} / count=${response.data.count}`;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'default-functions': DefaultFunctions;
  }
}
