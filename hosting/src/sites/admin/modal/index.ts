import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { PageElement } from '@app/page';
import { Modal } from '@components/ui/modal';

import '@components/ui/modal/ui-modal';

import pageMetadata from './page.json';

@customElement('admin-modal')
export class AdminModal extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private lastAction = '';

  private section(title: string, description: string, content: TemplateResult): TemplateResult {
    return html`
      <div class="mb-12">
        <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">${title}</h2>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">${description}</p>
        ${content}
      </div>
    `;
  }

  private renderSemanticAPI(): TemplateResult {
    return html`
      <div class="flex flex-wrap gap-3">
        <button
          @click=${() => this.testSuccess()}
          class="bg-success-600 hover:bg-success-500 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-xs"
        >
          Modal.success()
        </button>
        <button
          @click=${() => this.testInfo()}
          class="bg-primary-600 hover:bg-primary-500 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-xs"
        >
          Modal.info()
        </button>
        <button
          @click=${() => this.testError()}
          class="bg-danger-600 hover:bg-danger-500 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-xs"
        >
          Modal.error()
        </button>
        <button
          @click=${() => this.testConfirm()}
          class="bg-primary-600 hover:bg-primary-500 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-xs"
        >
          Modal.confirm()
        </button>
        <button
          @click=${() => this.testConfirmDanger()}
          class="bg-danger-600 hover:bg-danger-500 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-xs"
        >
          Modal.confirm() with danger
        </button>
        <button
          @click=${() => this.testConfirmWarning()}
          class="bg-warning-600 hover:bg-warning-500 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-xs"
        >
          Modal.confirm() with warning
        </button>
      </div>
    `;
  }

  private renderSingleArgAPI(): TemplateResult {
    return html`
      <div class="flex flex-wrap gap-3">
        <button
          @click=${() => this.testSingleArg()}
          class="bg-primary-600 hover:bg-primary-500 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-xs"
        >
          Single Argument (message only)
        </button>
      </div>
    `;
  }

  protected override renderContents(): TemplateResult {
    return html`
      <div class="px-4 py-8 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Modal API</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Demonstrates the simplified Modal API with semantic methods: success(), info(), error(), and confirm().
          </p>
        </div>

        ${this.section(
          'Semantic API (Recommended)',
          'Use Modal.success(), Modal.info(), Modal.error(), or Modal.confirm() for common use cases',
          this.renderSemanticAPI()
        )}
        ${this.section(
          'Single Argument API',
          'When only one argument is provided, it is treated as the message (title becomes empty)',
          this.renderSingleArgAPI()
        )}
        ${this.lastAction
          ? html`<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-gray-900">
              <h3 class="font-semibold text-gray-900 dark:text-white">Last Action:</h3>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">${this.lastAction}</p>
            </div>`
          : ''}
      </div>
    `;
  }

  private async testSuccess(): Promise<void> {
    await Modal.success('Success', 'Your operation completed successfully!');
    this.lastAction = 'Modal.success(): Acknowledged';
  }

  private async testInfo(): Promise<void> {
    await Modal.info('Information', 'This is some important information for you.');
    this.lastAction = 'Modal.info(): Acknowledged';
  }

  private async testError(): Promise<void> {
    await Modal.error('Error', 'Something went wrong. Please try again.');
    this.lastAction = 'Modal.error(): Acknowledged';
  }

  private async testConfirm(): Promise<void> {
    const confirmed = await Modal.confirm('Confirm Action', 'Are you sure you want to proceed?');
    this.lastAction = confirmed ? 'Modal.confirm(): Confirmed' : 'Modal.confirm(): Cancelled';
  }

  private async testConfirmDanger(): Promise<void> {
    const confirmed = await Modal.confirm(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      'danger'
    );
    this.lastAction = confirmed ? 'Modal.confirm(danger): Confirmed' : 'Modal.confirm(danger): Cancelled';
  }

  private async testConfirmWarning(): Promise<void> {
    const confirmed = await Modal.confirm(
      'Unsaved Changes',
      'You have unsaved changes. Do you want to discard them?',
      'warning'
    );
    this.lastAction = confirmed ? 'Modal.confirm(warning): Confirmed' : 'Modal.confirm(warning): Cancelled';
  }

  private async testSingleArg(): Promise<void> {
    await Modal.info('This message has no title');
    this.lastAction = 'Single argument API: Acknowledged';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-modal': AdminModal;
  }
}
