import { LitElement, type CSSResultGroup, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { tailwindCSS } from '@app/styles';
import { transition } from '@app/transition';

/**
 * Icon type for modal
 */
export type ModalIcon = 'warning' | 'danger' | 'success' | 'info' | 'question';

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
  size: 'sm' | 'md' | 'lg' = 'sm';

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

  protected override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open') && this.dialogRef.value) {
      if (this.open) {
        this.dialogRef.value?.showModal();
        if (this.showInput) {
          requestAnimationFrame(() => {
            this.inputRef.value?.focus();
          });
        }
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

  private handleBackdropClick(e: MouseEvent): void {
    if (e.target === this.dialogRef.value) {
      this.handleCancel();
    }
  }

  private getSizeClasses(): string {
    const sizes: Record<typeof this.size, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
    };
    return sizes[this.size];
  }

  private getButtonVariantClasses(variant: 'primary' | 'secondary' | 'danger' = 'secondary'): string {
    const variants = {
      primary:
        'inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:w-auto dark:bg-primary-500 dark:hover:bg-primary-400 dark:focus-visible:outline-primary-500',
      secondary:
        'inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:w-auto dark:bg-white/10 dark:text-white dark:inset-ring-white/10 dark:hover:bg-white/20',
      danger:
        'inline-flex w-full justify-center rounded-md bg-danger-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-danger-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-600 sm:w-auto dark:bg-danger-500 dark:hover:bg-danger-400 dark:focus-visible:outline-danger-500',
    };
    return variants[variant];
  }

  private renderButtons(): TemplateResult {
    if (this.buttons && this.buttons.length > 0) {
      return html`
        <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-2">
          ${this.buttons.map(
            (button, index) => html`
              <button
                type="button"
                @click=${() => this.handleButtonClick(button)}
                class="${this.getButtonVariantClasses(button.variant)} ${index > 0 ? 'mt-3 sm:mt-0' : ''}"
              >
                ${button.label}
              </button>
            `
          )}
        </div>
      `;
    }

    return html`
      <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          @click=${this.handleConfirm}
          class="bg-primary-600 hover:bg-primary-500 focus-visible:outline-primary-600 dark:bg-primary-500 dark:hover:bg-primary-400 dark:focus-visible:outline-primary-500 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 sm:ml-2 sm:w-auto"
        >
          ${this.confirmText}
        </button>
        <button
          type="button"
          @click=${this.handleCancel}
          class="focus-visible:outline-primary-600 mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-0 sm:w-auto dark:bg-white/10 dark:text-white dark:inset-ring-white/10 dark:hover:bg-white/20"
        >
          ${this.cancelText}
        </button>
      </div>
    `;
  }

  private getIconElement(): TemplateResult {
    const iconClasses = 'mx-auto flex size-12 shrink-0 items-center justify-center rounded-full';

    const icons: Record<ModalIcon, TemplateResult> = {
      danger: html`
        <div class="${iconClasses} bg-danger-100 dark:bg-danger-500/20">
          <svg
            class="text-danger-600 dark:text-danger-400 size-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
      `,
      warning: html`
        <div class="${iconClasses} bg-warning-100 dark:bg-warning-500/20">
          <svg
            class="text-warning-600 dark:text-warning-400 size-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
      `,
      success: html`
        <div class="${iconClasses} bg-success-100 dark:bg-success-500/20">
          <svg
            class="text-success-600 dark:text-success-400 size-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
      `,
      info: html`
        <div class="${iconClasses} bg-primary-100 dark:bg-primary-500/20">
          <svg
            class="text-primary-600 dark:text-primary-400 size-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
        </div>
      `,
      question: html`
        <div class="${iconClasses} bg-primary-100 dark:bg-primary-500/20">
          <svg
            class="text-primary-600 dark:text-primary-400 size-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
      `,
    };

    return icons[this.icon];
  }

  protected override render(): TemplateResult {
    return html`
      <dialog
        ${ref(this.dialogRef)}
        @close=${this.handleDialogClose}
        @cancel=${this.handleDialogCancel}
        @click=${this.handleBackdropClick}
        class="fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto border-0 bg-transparent p-0"
      >
        <div
          ${transition(this.open ? 'enter' : 'leave', {
            enter: 'transition-opacity duration-300 ease-out',
            enterFrom: 'opacity-0',
            enterTo: 'opacity-100',
            leave: 'transition-opacity duration-200 ease-in',
            leaveFrom: 'opacity-100',
            leaveTo: 'opacity-0',
          })}
          class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/50"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4 text-center focus:outline-none sm:p-0">
          <div
            ${transition(this.open ? 'enter' : 'leave', {
              enter: 'transition-all duration-300 ease-out',
              enterFrom: 'translate-y-4 opacity-0 sm:scale-95',
              enterTo: 'translate-y-0 opacity-100 sm:scale-100',
              leave: 'transition-all duration-200 ease-in',
              leaveFrom: 'translate-y-0 opacity-100 sm:scale-100',
              leaveTo: 'translate-y-4 opacity-0 sm:scale-95',
            })}
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
                  >
                    ${this.useHtml ? unsafeHTML(this.message) : this.message}
                  </p>
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
                            ? 'ring-red-500'
                            : 'ring-gray-300'} block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-xs ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
                        />
                        ${this.inputError
                          ? html`<p class="mt-2 text-sm text-red-600 dark:text-red-400">
                              <i class="fa-solid fa-circle-exclamation mr-1"></i>${this.inputError}
                            </p>`
                          : ''}
                      </div>
                    `
                  : ''}}
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
