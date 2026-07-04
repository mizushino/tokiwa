import { LitElement, type CSSResultGroup, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { tailwindCSS } from '@app/styles';
import { overlayBackdropTransition, overlayPanelTransition, transition } from '@app/transition';

import '../button/ui-button';

/**
 * Icon type for modal
 */
export type ModalIcon = 'warning' | 'danger' | 'success' | 'info' | 'question';

/**
 * Size variant for modal
 */
export type ModalSize = 'sm' | 'md' | 'lg';

/**
 * Button configuration for modal
 */
export interface ModalButton {
  label: string;
  value?: string;
  variant?: 'primary' | 'secondary' | 'danger';
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
 * @fires button-click - Fired when a custom button is pressed.
 * @fires confirm - Fired when the primary confirmation action is requested.
 * @fires cancel - Fired when cancellation is requested.
 * @fires input-change - Fired when the prompt input value changes.
 */
@customElement('ui-modal')
export class UiModal extends LitElement {
  static override styles: CSSResultGroup = [tailwindCSS];

  @property({ type: String })
  title = '';

  @property({ type: String })
  message = '';

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

  /** Show input field for prompt dialogs */
  @property({ type: Boolean })
  showInput = false;

  /** Current input value (two-way binding via input-change event) */
  @property({ type: String })
  inputValue = '';

  /** Error message to display below input */
  @property({ type: String })
  inputError = '';

  /** Use HTML rendering for message (for emphasis styling) */
  @property({ type: Boolean })
  useHtml = false;

  private readonly dialogRef = createRef<HTMLDialogElement>();
  private readonly inputRef = createRef<HTMLInputElement>();
  private mouseDownTarget: EventTarget | null = null;

  protected override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open') && this.dialogRef.value) {
      if (this.open) {
        this.dialogRef.value?.showModal();
        if (this.showInput) {
          requestAnimationFrame(() => {
            this.inputRef.value?.focus();
          });
        }
      } else {
        setTimeout(() => {
          this.dialogRef.value?.close();
        }, 200);
      }
    }
  }

  private handleInputChange(e: Event): void {
    this.inputValue = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent('input-change', {
        detail: { value: this.inputValue },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleInputKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.dispatchEvent(
        new CustomEvent('confirm', {
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private handleButtonClick(button: ModalButton): void {
    this.dispatchEvent(
      new CustomEvent('button-click', {
        detail: { value: button.value || button.label, label: button.label },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleConfirm(): void {
    this.dispatchEvent(
      new CustomEvent('confirm', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleCancel(): void {
    this.dispatchEvent(
      new CustomEvent('cancel', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleDialogClose(): void {
    this.open = false;
  }

  private handleDialogCancel(e: Event): void {
    e.preventDefault();
    this.handleCancel();
  }

  private handleMouseDown(e: MouseEvent): void {
    this.mouseDownTarget = e.target;
  }

  private handleBackdropClick(e: MouseEvent): void {
    if (e.target === this.dialogRef.value && this.mouseDownTarget === this.dialogRef.value) {
      this.handleCancel();
    }
    this.mouseDownTarget = null;
  }

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

    // The danger and warning icons intentionally share the same triangle-exclamation glyph.
    const alertPath =
      'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z';

    // Color classes are kept as complete literals so Tailwind's compiler can detect them.
    const icons: Record<ModalIcon, { bg: string; text: string; path: string }> = {
      danger: { bg: 'bg-danger-100 dark:bg-danger-500/20', text: 'text-danger-600 dark:text-danger-400', path: alertPath },
      warning: {
        bg: 'bg-warning-100 dark:bg-warning-500/20',
        text: 'text-warning-600 dark:text-warning-400',
        path: alertPath,
      },
      success: {
        bg: 'bg-success-100 dark:bg-success-500/20',
        text: 'text-success-600 dark:text-success-400',
        path: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      },
      info: {
        bg: 'bg-primary-100 dark:bg-primary-500/20',
        text: 'text-primary-600 dark:text-primary-400',
        path: 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
      },
      question: {
        bg: 'bg-primary-100 dark:bg-primary-500/20',
        text: 'text-primary-600 dark:text-primary-400',
        path: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z',
      },
    };

    const { bg, text, path } = icons[this.icon];

    return html`
      <div class="${wrapperClasses} ${bg}">
        <svg class="${text} size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="${path}" />
        </svg>
      </div>
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <dialog
        ${ref(this.dialogRef)}
        @close=${this.handleDialogClose}
        @cancel=${this.handleDialogCancel}
        @mousedown=${this.handleMouseDown}
        @click=${this.handleBackdropClick}
        class="fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto border-0 bg-transparent p-0"
      >
        <div
          ${transition(this.open ? 'enter' : 'leave', overlayBackdropTransition)}
          class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/50"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4 text-center focus:outline-none sm:p-0">
          <div
            ${transition(this.open ? 'enter' : 'leave', overlayPanelTransition)}
            class="${this.getSizeClasses()} relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl sm:my-8 sm:w-full sm:p-6 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10"
          >
            <div class="sm:flex sm:items-start">
              ${this.getIconElement()}
              <div class="mt-3 w-full text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">${this.title}</h3>
                <div class="mt-2">
                  <p
                    class="text-sm text-gray-500 dark:text-gray-400"
                    style="${this.useHtml ? '' : 'white-space: pre-wrap;'}"
                  >${this.useHtml ? unsafeHTML(this.message) : this.message}</p>
                </div>
                ${this.showInput
                  ? html`
                      <div class="mt-4">
                        <input
                          ${ref(this.inputRef)}
                          type="text"
                          .value=${this.inputValue}
                          @input=${this.handleInputChange}
                          @keydown=${this.handleInputKeyDown}
                          class="${this.inputError
                            ? 'ring-danger-500'
                            : 'ring-gray-300'} focus:ring-primary-600 dark:focus:ring-primary-500 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-xs ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10"
                        />
                        ${this.inputError
                          ? html`<p class="text-danger-600 dark:text-danger-400 mt-2 text-sm">
                              <i class="fa-solid fa-circle-exclamation mr-1"></i>${this.inputError}
                            </p>`
                          : ''}
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
