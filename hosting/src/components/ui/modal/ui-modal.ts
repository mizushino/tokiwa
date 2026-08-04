import { CircleAlert, CircleCheck, CircleQuestionMark, Info, type IconNode } from 'lucide';
import { LitElement, type CSSResultGroup, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';

import { tailwindCSS } from '@app/styles';
import {
  overlayBackdropClasses,
  overlayBackdropTransition,
  overlayDialogClasses,
  overlayLeaveDurationMs,
  overlayPanelClasses,
  overlayPanelTransition,
  overlayTitleClasses,
  transition,
} from '@app/transition';

import type { ButtonVariant } from '../button/ui-button';
import type { UiInput } from '../input/ui-input';

import '../button/ui-button';
import '../icon/ui-icon';
import '../input/ui-input';

export type ModalIcon = 'warning' | 'danger' | 'success' | 'info' | 'question';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalButton {
  label: string;
  value?: string;
  variant?: ButtonVariant;
}

/**
 * Modal component for simple Yes/No confirmations using native HTML dialog element.
 *
 * Usage:
 * ```ts
 * html`
 *   <ui-modal
 *     title="Delete User"
 *     message="Are you sure you want to delete this user? This action cannot be undone."
 *     icon="danger"
 *     confirmText="Delete"
 *     cancelText="Cancel"
 *     .open=${this.modalOpen}
 *     @confirm=${this.handleConfirm}
 *     @cancel=${this.handleCancel}
 *   ></ui-modal>
 * `
 *
 * html`
 *   <ui-modal
 *     title="Save Changes"
 *     message="Do you want to save your changes?"
 *     icon="question"
 *     .buttons=${[
 *       { label: 'Save', value: 'save', variant: 'primary' },
 *       { label: "Don't Save", value: 'dont-save', variant: 'secondary' },
 *       { label: 'Cancel', value: 'cancel', variant: 'secondary' }
 *     ]}
 *     .open=${this.modalOpen}
 *     @button-click=${this.handleButtonClick}
 *   ></ui-modal>
 * `
 * ```
 *
 * @slot content - Additional content rendered below the message.
 * @fires button-click - Fired when a custom button is pressed, detail: { value, label }.
 * @fires confirm - Fired when the primary confirmation action is requested.
 * @fires cancel - Fired when cancellation is requested.
 * @fires input - Fired on each keystroke of the prompt input (forwarded from the internal ui-input), detail: { value }.
 */
@customElement('ui-modal')
export class UiModal extends LitElement {
  static override styles: CSSResultGroup = [tailwindCSS];

  @property({ type: String })
  title = '';

  @property({ type: String })
  message: string | TemplateResult = '';

  @property({ type: String })
  icon: ModalIcon = 'question';

  @property({ type: String })
  confirmText = 'Confirm';

  @property({ type: String })
  cancelText = 'Cancel';

  @property({ type: Array })
  buttons?: ModalButton[];

  @property({ type: Boolean })
  open = false;

  @property({ type: String })
  size: ModalSize = 'sm';

  @property({ type: Boolean })
  showInput = false;

  @property({ type: String })
  inputValue = '';

  @property({ type: String })
  inputError = '';

  private readonly dialogRef = createRef<HTMLDialogElement>();
  private readonly inputRef = createRef<UiInput>();
  private mouseDownTarget: EventTarget | null = null;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private focusFrame?: number;

  protected override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open') && this.dialogRef.value) {
      if (this.open) {
        this.cancelPendingClose();
        if (!this.dialogRef.value.open) {
          this.dialogRef.value.showModal();
        }
        if (this.showInput) {
          this.cancelPendingFocus();
          this.focusFrame = requestAnimationFrame(() => {
            this.focusFrame = undefined;
            if (this.open && this.isConnected) {
              this.inputRef.value?.focus();
            }
          });
        }
      } else {
        this.cancelPendingFocus();
        this.cancelPendingClose();
        const dialog = this.dialogRef.value;
        this.closeTimer = setTimeout(() => {
          this.closeTimer = undefined;
          if (!this.open) {
            dialog.close();
          }
        }, overlayLeaveDurationMs);
      }
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cancelPendingClose();
    this.cancelPendingFocus();
  }

  private cancelPendingClose(): void {
    if (this.closeTimer !== undefined) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
  }

  private cancelPendingFocus(): void {
    if (this.focusFrame !== undefined) {
      cancelAnimationFrame(this.focusFrame);
      this.focusFrame = undefined;
    }
  }

  private handleInputChange = (e: Event): void => {
    // The ui-input `input` event bubbles out of this component as-is; just track the value.
    this.inputValue = (e as CustomEvent<{ value: string }>).detail.value;
  };

  private handleInputKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.isComposing) {
      this.dispatchEvent(
        new CustomEvent('confirm', {
          bubbles: true,
          composed: true,
        })
      );
    }
  };

  private handleButtonClick(button: ModalButton): void {
    this.dispatchEvent(
      new CustomEvent('button-click', {
        detail: { value: button.value || button.label, label: button.label },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleConfirm = (): void => {
    this.dispatchEvent(
      new CustomEvent('confirm', {
        bubbles: true,
        composed: true,
      })
    );
  };

  private handleCancel = (): void => {
    this.dispatchEvent(
      new CustomEvent('cancel', {
        bubbles: true,
        composed: true,
      })
    );
  };

  private handleDialogClose = (): void => {
    this.open = false;
  };

  private handleDialogCancel = (e: Event): void => {
    e.preventDefault();
    this.handleCancel();
  };

  private handleMouseDown = (e: MouseEvent): void => {
    this.mouseDownTarget = e.target;
  };

  private handleBackdropClick = (e: MouseEvent): void => {
    if (e.target === this.dialogRef.value && this.mouseDownTarget === this.dialogRef.value) {
      this.handleCancel();
    }
    this.mouseDownTarget = null;
  };

  private getSizeClasses(): string {
    const sizes: Record<ModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
    };
    return sizes[this.size];
  }

  private renderButtons(): TemplateResult {
    if (this.buttons && this.buttons.length > 0) {
      return html`
        <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-2">
          ${this.buttons.map(
            (button, index) => html`
              <ui-button
                type="button"
                variant=${button.variant || 'secondary'}
                @click=${() => this.handleButtonClick(button)}
                class="${index > 0 ? 'mt-3 sm:mt-0' : ''} w-full sm:w-auto"
              >
                ${button.label}
              </ui-button>
            `
          )}
        </div>
      `;
    }

    return html`
      <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-2">
        <ui-button type="button" variant="primary" @click=${this.handleConfirm} class="w-full sm:ml-2 sm:w-auto">
          ${this.confirmText}
        </ui-button>
        <ui-button type="button" variant="secondary" @click=${this.handleCancel} class="mt-3 w-full sm:mt-0 sm:w-auto">
          ${this.cancelText}
        </ui-button>
      </div>
    `;
  }

  private getIconElement(): TemplateResult {
    const wrapperClasses = 'mx-auto flex size-12 shrink-0 items-center justify-center rounded-full';

    const icons: Record<ModalIcon, { bg: string; text: string; icon: IconNode }> = {
      danger: {
        bg: 'bg-danger-100 dark:bg-danger-500/20',
        text: 'text-danger-600 dark:text-danger-400',
        icon: CircleAlert,
      },
      warning: {
        bg: 'bg-warning-100 dark:bg-warning-500/20',
        text: 'text-warning-600 dark:text-warning-400',
        icon: CircleAlert,
      },
      success: {
        bg: 'bg-success-100 dark:bg-success-500/20',
        text: 'text-success-600 dark:text-success-400',
        icon: CircleCheck,
      },
      info: {
        bg: 'bg-info-100 dark:bg-info-500/20',
        text: 'text-info-600 dark:text-info-400',
        icon: Info,
      },
      question: {
        bg: 'bg-primary-100 dark:bg-primary-500/20',
        text: 'text-primary-600 dark:text-primary-400',
        icon: CircleQuestionMark,
      },
    };

    const { bg, text, icon } = icons[this.icon];

    return html`
      <div class="${wrapperClasses} ${bg}">
        <ui-icon class="${text} size-6" .icon=${icon} .strokeWidth=${1.5}></ui-icon>
      </div>
    `;
  }

  protected override render(): TemplateResult {
    const messageClass = typeof this.message === 'string' ? 'whitespace-pre-wrap' : '';

    return html`
      <dialog
        ${ref(this.dialogRef)}
        @close=${this.handleDialogClose}
        @cancel=${this.handleDialogCancel}
        @mousedown=${this.handleMouseDown}
        @click=${this.handleBackdropClick}
        class="${overlayDialogClasses}"
      >
        <div
          ${transition(this.open ? 'enter' : 'leave', overlayBackdropTransition)}
          class="${overlayBackdropClasses}"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4 text-center focus:outline-none sm:p-0">
          <div
            ${transition(this.open ? 'enter' : 'leave', overlayPanelTransition)}
            class="${this.getSizeClasses()} ${overlayPanelClasses}"
          >
            <div class="sm:flex sm:items-start">
              ${this.getIconElement()}
              <div class="mt-3 w-full text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="${overlayTitleClasses}">${this.title}</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    <span class=${messageClass}>${this.message}</span>
                  </p>
                </div>
                ${this.showInput
                  ? html`
                      <div class="mt-4">
                        <ui-input
                          ${ref(this.inputRef)}
                          .value=${this.inputValue}
                          error=${this.inputError}
                          @input=${this.handleInputChange}
                          @keydown=${this.handleInputKeyDown}
                        ></ui-input>
                      </div>
                    `
                  : ''}
                <slot name="content"></slot>
              </div>
            </div>
            ${this.renderButtons()}
          </div>
        </div>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-modal': UiModal;
  }
}
