import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { track } from 'lit-async';

import { PageElement } from '@app/page';
import { SampleDocument } from '@models/sample';

import pageMetadata from './page.json';

@customElement('default-firestore')
export class DefaultFirestore extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private loadResult = '';

  protected readonly inputRef = createRef<HTMLInputElement>();
  protected readonly sampleDocument = new SampleDocument({ id: 'sample' });

  protected override render(): TemplateResult {
    return html`
      <input class="border border-black dark:text-gray-900" ${ref(this.inputRef)} />
      <button @click=${this.save}>[save]</button>
      <br />

      <button @click=${this.load}>[load]</button> => ${this.loadResult}
      <br />

      snapshot(realtime) => ${track(this.sampleDocument.snapshot, (sample) => html`${sample ? sample.data.name : ''}`)}
    `;
  }

  private async load(): Promise<void> {
    this.loadResult = 'loading...';
    await this.sampleDocument.get();
    this.loadResult = this.sampleDocument.data.name;
  }

  private async save(): Promise<void> {
    const inputElement = this.inputRef.value;
    if (inputElement !== undefined) {
      const updatedDocument = new SampleDocument(
        { id: 'sample' },
        {
          ...(this.sampleDocument.exists ? this.sampleDocument.data : SampleDocument.defaultData),
          name: inputElement.value,
        }
      );
      await updatedDocument.save();
      await this.sampleDocument.get();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-firestore': DefaultFirestore;
  }
}
