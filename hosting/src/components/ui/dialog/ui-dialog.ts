import { LitElement, type CSSResultGroup, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';

import { tailwindCSS } from '@app/styles';
import { transition } from '@app/transition';

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
 *     <div slot="content">
 *       <!-- Dialog content -->
 *     </div>
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
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';

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
        // Delay closing so the exit transition can finish first.
        setTimeout(() => {
          this.dialog?.close();
        }, 200);
      }
    }
  }

  private handleDialogClose(): void {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleMouseDown(e: MouseEvent): void {
    this.mouseDownTarget = e.target;
  }

  private handleBackdropClick(e: MouseEvent): void {
    // Only close when both pointer events occur on the backdrop.
    if (e.target === this.dialog && this.mouseDownTarget === this.dialog) {
      this.handleDialogClose();
    }
    this.mouseDownTarget = null;
  }

  private getSizeClasses(): string {
    const sizes: Record<typeof this.size, string> = {
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
        class="fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto border-0 bg-transparent p-0"
      >
        <!-- Backdrop with transition -->
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

        <div class="flex min-h-full items-end justify-center p-4 text-center focus:outline-none sm:items-center sm:p-0">
          <!-- Panel with transition -->
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
            <!-- Close button -->
            <div class="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
              <button
                type="button"
                @click=${this.handleDialogClose}
                class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:bg-gray-800 dark:hover:text-gray-300 dark:focus:outline-white"
              >
                <span class="sr-only">Close</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-6">
                  <path d="M6 18 18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>

            <!-- Header with title -->
            ${this.title
              ? html`
                  <div class="sm:flex sm:items-start">
                    <div class="mt-3 w-full text-center sm:mt-0 sm:text-left">
                      <h3 class="text-base font-semibold text-gray-900 dark:text-white">${this.title}</h3>
                    </div>
                  </div>
                `
              : ''}

            <!-- Content -->
            <div class="mt-3 sm:mt-4">
              <slot name="content"></slot>
            </div>

            <!-- Actions -->
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
