import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { PageElement, pageContainer, pageHero, pageSection } from '@app/page';
import { Modal } from '@components/ui/modal';

import '@components/ui/modal/ui-modal';
import '@components/ui/button/ui-button';

import pageMetadata from './page.json';

@customElement('default-modal')
export class DefaultModal extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private lastAction = '';

  private renderSemanticAPI(): TemplateResult {
    return html`
      <div class="flex flex-wrap gap-3">
        <ui-button variant="success" @click=${() => this.testSuccess()}>Modal.success()</ui-button>
        <ui-button variant="info" @click=${() => this.testInfo()}>Modal.info()</ui-button>
        <ui-button variant="danger" @click=${() => this.testError()}>Modal.error()</ui-button>
        <ui-button variant="primary" @click=${() => this.testConfirm()}>Modal.confirm()</ui-button>
        <ui-button variant="danger" @click=${() => this.testConfirmDanger()}>Modal.confirm() with danger</ui-button>
        <ui-button variant="warning" @click=${() => this.testConfirmWarning()}>Modal.confirm() with warning</ui-button>
      </div>
    `;
  }

  private renderSingleArgAPI(): TemplateResult {
    return html`
      <div class="flex flex-wrap gap-3">
        <ui-button variant="secondary" @click=${() => this.testSingleArg()}>Single Argument (message only)</ui-button>
      </div>
    `;
  }

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: 'Modal API',
        description: 'Demonstrates the Modal API with semantic methods: success(), info(), error(), and confirm().',
        accent: 'warning',
      })}
      ${pageSection(
        {
          title: 'Semantic API (Recommended)',
          description: 'Use Modal.success(), Modal.info(), Modal.error(), or Modal.confirm() for common use cases',
        },
        this.renderSemanticAPI()
      )}
      ${pageSection(
        {
          title: 'Single Argument API',
          description: 'When only one argument is provided, it is treated as the message (title becomes empty)',
        },
        this.renderSingleArgAPI()
      )}
      ${this.lastAction
        ? html`<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-gray-900">
            <h3 class="font-semibold text-gray-900 dark:text-white">Last Action:</h3>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">${this.lastAction}</p>
          </div>`
        : ''}
    `);
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
    'default-modal': DefaultModal;
  }
}
