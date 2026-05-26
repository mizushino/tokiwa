import { LitElement, type CSSResultGroup, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { tailwindCSS } from '@app/styles';

/**
 * Checkbox size type
 */
export type CheckboxSize = 'sm' | 'md' | 'lg';

/**
 * Generic checkbox component with multiple sizes and states.
 *
 * Usage:
 * ```ts
 * html`<ui-checkbox checked>Accept terms</ui-checkbox>`
 * html`<ui-checkbox size="sm" disabled>Small disabled</ui-checkbox>`
 * html`<ui-checkbox size="lg" indeterminate>Select all</ui-checkbox>`
 * ```
 *
 * @slot - Checkbox label content.
 * @fires change - Fired when the checked state changes.
 */
@customElement('ui-checkbox')
export class UiCheckbox extends LitElement {
  static override styles: CSSResultGroup = [tailwindCSS];

  @property({ type: Boolean })
  checked = false;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  indeterminate = false;

  @property({ type: String })
  size: CheckboxSize = 'md';

  @property({ type: String })
  name = '';

  @property({ type: String })
  value = '';

  private handleChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.checked = target.checked;
    this.indeterminate = false;

    // Emit the updated checked state for parent components.
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { checked: this.checked, value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private getSizeClasses(): string {
    const sizes: Record<CheckboxSize, string> = {
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
    };
    return sizes[this.size];
  }

  private getCheckboxClasses(): string {
    const baseClasses =
      'rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-primary-600 dark:focus:ring-primary-500';
    const sizeClasses = this.getSizeClasses();
    const disabledClasses = this.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';

    return `${baseClasses} ${sizeClasses} ${disabledClasses}`;
  }

  protected override render(): TemplateResult {
    return html`
      <label
        class="${this.disabled ? 'cursor-not-allowed' : 'cursor-pointer'} inline-flex items-center gap-2 select-none"
      >
        <input
          type="checkbox"
          class="${this.getCheckboxClasses()}"
          .checked=${this.checked}
          .indeterminate=${this.indeterminate}
          ?disabled=${this.disabled}
          name="${this.name}"
          value="${this.value}"
          @change=${this.handleChange}
        />
        <span class="text-sm text-gray-900 dark:text-gray-100"><slot></slot></span>
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-checkbox': UiCheckbox;
  }
}
