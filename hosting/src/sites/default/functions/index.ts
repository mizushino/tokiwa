import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { PageElement } from '@app/page';
import { sample } from '@services/sample';

import pageMetadata from './page.json';

@customElement('default-functions')
export class DefaultFunctions extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private sampleId = 'sample';

  @state()
  private name = 'GitHub Copilot';

  @state()
  private isSubmitting = false;

  @state()
  private result = '';

  @state()
  private error = '';

  protected override renderContents(): TemplateResult {
    return html`
      <div class="space-y-4 p-4">
        <h1 class="text-2xl font-semibold">Functions Sample</h1>
        <p>Callable Function を呼び出して Sample ドキュメントを更新します。</p>

        <label class="block">
          <span class="mb-1 block">ID</span>
          <input
            class="w-full rounded border border-gray-300 px-3 py-2 dark:text-gray-900"
            .value=${this.sampleId}
            @input=${(event: Event) => {
              this.sampleId = (event.target as HTMLInputElement).value;
            }}
          />
        </label>

        <label class="block">
          <span class="mb-1 block">Name</span>
          <input
            class="w-full rounded border border-gray-300 px-3 py-2 dark:text-gray-900"
            .value=${this.name}
            @input=${(event: Event) => {
              this.name = (event.target as HTMLInputElement).value;
            }}
          />
        </label>

        <button
          class="rounded border border-gray-900 px-4 py-2 disabled:opacity-50"
          ?disabled=${this.isSubmitting}
          @click=${this.runSample}
        >
          ${this.isSubmitting ? 'Running...' : '[Run Sample Function]'}
        </button>

        ${this.result ? html`<p>Result: ${this.result}</p>` : ''}
        ${this.error ? html`<p class="text-red-600">Error: ${this.error}</p>` : ''}
      </div>
    `;
  }

  private async runSample(): Promise<void> {
    this.isSubmitting = true;
    this.result = '';
    this.error = '';

    const response = await sample.run({ id: this.sampleId, name: this.name });

    this.isSubmitting = false;

    if (!response) {
      this.error = 'Function call failed';
      return;
    }

    this.result = `${response.id} / ${response.name} / count=${response.count}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-functions': DefaultFunctions;
  }
}
