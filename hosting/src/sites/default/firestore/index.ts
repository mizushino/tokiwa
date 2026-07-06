import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { track } from 'lit-async';

import { cardHeading, PageElement, pageCard, pageContainer, pageHero } from '@app/page';
import { SampleDocument } from '@models/sample';

import pageMetadata from './page.json';

import '@components/ui/button/ui-button';
import '@components/ui/input/ui-input';

@customElement('default-firestore')
export class DefaultFirestore extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private loadResult = '';

  @state()
  private nameInput = '';

  protected readonly sampleDocument = new SampleDocument({ id: 'sample' });

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: this.trans('hero_title'),
        description: this.trans('hero_desc'),
        accent: 'warning',
      })}
      ${pageCard(html`
        ${cardHeading({
          title: this.trans('operations_title'),
          description: this.trans('operations_desc'),
          accent: 'warning',
          icon: html`
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
          `,
        })}
        <div class="space-y-4">
          <ui-input
            inputId="name-input"
            label=${this.trans('name')}
            placeholder=${this.trans('name_placeholder')}
            .value=${this.nameInput}
            @input=${(event: CustomEvent<{ value: string }>) => {
              this.nameInput = event.detail.value;
            }}
          ></ui-input>

          <div class="flex gap-2">
            <ui-button variant="primary" @click=${this.save}>${this.trans('save')}</ui-button>
            <ui-button variant="secondary" @click=${this.load}>${this.trans('load')}</ui-button>
          </div>

          ${this.loadResult
            ? html`
                <div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                  <span class="text-sm text-gray-600 dark:text-gray-300"
                    >${this.trans('load_result')}: ${this.loadResult}</span
                  >
                </div>
              `
            : ''}
        </div>
      `)}
      ${pageCard(html`
        ${cardHeading({
          title: this.trans('snapshot_title'),
          description: this.trans('snapshot_desc'),
          accent: 'success',
          icon: html`
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          `,
        })}
        <div
          class="flex min-h-20 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
        >
          <span class="font-medium text-success-600 dark:text-success-400">
            ${track(this.sampleDocument.snapshot, (sample) => (sample ? sample.data.name : this.trans('no_data')))}
          </span>
        </div>
      `)}
    `);
  }

  private async load(): Promise<void> {
    this.loadResult = this.trans('loading');
    await this.sampleDocument.get();
    this.loadResult = this.sampleDocument.data.name;
  }

  private async save(): Promise<void> {
    const updatedDocument = new SampleDocument(
      { id: 'sample' },
      {
        ...(this.sampleDocument.exists ? this.sampleDocument.data : SampleDocument.defaultData),
        name: this.nameInput,
      }
    );
    await updatedDocument.save();
    await this.sampleDocument.get();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-firestore': DefaultFirestore;
  }
}
