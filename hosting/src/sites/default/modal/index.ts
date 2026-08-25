import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { PageElement, pageContainer, pageHero, pageResultBox, pageSection } from '@app/page';
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
        <ui-button variant="secondary" @click=${() => this.testSingleArg()}
          >${this.trans('single_arg_button')}</ui-button
        >
      </div>
    `;
  }

  protected override renderContents(): TemplateResult {
    return pageContainer(html`
      ${pageHero({
        title: this.trans('hero_title'),
        description: this.trans('hero_desc'),
        accent: 'warning',
      })}
      ${pageSection(
        {
          title: this.trans('semantic_title'),
          description: this.trans('semantic_desc'),
        },
        this.renderSemanticAPI()
      )}
      ${pageSection(
        {
          title: this.trans('single_arg_title'),
          description: this.trans('single_arg_desc'),
        },
        this.renderSingleArgAPI()
      )}
      ${
        this.lastAction
          ? pageResultBox(
              html`
                <h3 class="font-semibold text-gray-900 dark:text-white">${this.trans('last_action')}</h3>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">${this.lastAction}</p>
              `,
              'flex-col items-start'
            )
          : ''
      }
    `);
  }

  private async testSuccess(): Promise<void> {
    await Modal.success(this.trans('success'), this.trans('success_message'));
    this.lastAction = 'Modal.success(): Acknowledged';
  }

  private async testInfo(): Promise<void> {
    await Modal.info(this.trans('information'), this.trans('info_message'));
    this.lastAction = 'Modal.info(): Acknowledged';
  }

  private async testError(): Promise<void> {
    await Modal.error(this.trans('error'), this.trans('error_message'));
    this.lastAction = 'Modal.error(): Acknowledged';
  }

  private async testConfirm(): Promise<void> {
    const confirmed = await Modal.confirm(this.trans('confirm_title'), this.trans('confirm_message'));
    this.lastAction = confirmed ? 'Modal.confirm(): Confirmed' : 'Modal.confirm(): Cancelled';
  }

  private async testConfirmDanger(): Promise<void> {
    const confirmed = await Modal.confirm(this.trans('delete_title'), this.trans('delete_message'), 'danger');
    this.lastAction = confirmed ? 'Modal.confirm(danger): Confirmed' : 'Modal.confirm(danger): Cancelled';
  }

  private async testConfirmWarning(): Promise<void> {
    const confirmed = await Modal.confirm(this.trans('unsaved_title'), this.trans('unsaved_message'), 'warning');
    this.lastAction = confirmed ? 'Modal.confirm(warning): Confirmed' : 'Modal.confirm(warning): Cancelled';
  }

  private async testSingleArg(): Promise<void> {
    await Modal.info(this.trans('single_arg_message'));
    this.lastAction = 'Single argument API: Acknowledged';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-modal': DefaultModal;
  }
}
