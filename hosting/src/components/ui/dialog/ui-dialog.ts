import { X } from 'lucide';
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

import '../icon/ui-icon';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Dialog component using native HTML dialog element.
 *
 * Usage:
 * ```ts
 * html`
 *   <ui-dialog
 *     title="Edit User"
 *     .open=${this.dialogOpen}
 *     @close=${this.handleClose}
 *   >
 *     <div slot="content">User form fields</div>
 *     <div slot="actions">
 *       <ui-button @click=${this.handleSave}>Save</ui-button>
 *       <ui-button variant="secondary" @click=${this.handleCancel}>Cancel</ui-button>
 *     </div>
 *   </ui-dialog>
 * `
 * ```
 *
 * @slot content - Main dialog body content.
 * @slot actions - Action buttons rendered in the footer.
 * @fires close - Fired when the dialog requests to close.
 */
@customElement('ui-dialog')
export class UiDialog extends LitElement {
  static override styles: CSSResultGroup = [tailwindCSS];

  @property({ type: String })
  title = '';

  @property({ type: Boolean })
  open = false;

  @property({ type: String })
  size: DialogSize = 'md';

  private readonly dialogRef = createRef<HTMLDialogElement>();

  private mouseDownTarget: EventTarget | null = null;

  private get dialog(): HTMLDialogElement | undefined {
    return this.dialogRef.value ?? undefined;
  }

  protected override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open') && this.dialog) {
      if (this.open) {
        this.dialog.showModal();
      } else {
        setTimeout(() => {
          this.dialog?.close();
        }, overlayLeaveDurationMs);
      }
    }
  }

  private handleDialogClose = (): void => {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true,
      })
    );
  };

  private handleMouseDown = (e: MouseEvent): void => {
    this.mouseDownTarget = e.target;
  };

  private handleBackdropClick = (e: MouseEvent): void => {
    if (e.target === this.dialog && this.mouseDownTarget === this.dialog) {
      this.handleDialogClose();
    }
    this.mouseDownTarget = null;
  };

  private getSizeClasses(): string {
    const sizes: Record<DialogSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full',
    };
    return sizes[this.size];
  }

  protected override render(): TemplateResult {
    return html`
      <dialog
        ${ref(this.dialogRef)}
        @close=${this.handleDialogClose}
        @mousedown=${this.handleMouseDown}
        @click=${this.handleBackdropClick}
        class="${overlayDialogClasses}"
      >
        <div
          ${transition(this.open ? 'enter' : 'leave', overlayBackdropTransition)}
          class="${overlayBackdropClasses}"
        ></div>

        <div class="flex min-h-full items-end justify-center p-4 text-center focus:outline-none sm:items-center sm:p-0">
          <div
            ${transition(this.open ? 'enter' : 'leave', overlayPanelTransition)}
            class="${this.getSizeClasses()} ${overlayPanelClasses}"
          >
            <div class="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
              <button
                type="button"
                @click=${this.handleDialogClose}
                class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-primary-600 dark:bg-gray-800 dark:hover:text-gray-300 dark:focus:outline-white"
              >
                <span class="sr-only">Close</span>
                <ui-icon class="size-6" .icon=${X} .strokeWidth=${1.5}></ui-icon>
              </button>
            </div>

            ${this.title
              ? html`
                  <div class="sm:flex sm:items-start">
                    <div class="mt-3 w-full text-center sm:mt-0 sm:text-left">
                      <h3 class="${overlayTitleClasses}">${this.title}</h3>
                    </div>
                  </div>
                `
              : ''}

            <div class="mt-3 sm:mt-4">
              <slot name="content"></slot>
            </div>

            <div class="mt-5 gap-3 sm:mt-6 sm:flex sm:flex-row-reverse">
              <slot name="actions"></slot>
            </div>
          </div>
        </div>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-dialog': UiDialog;
  }
}
