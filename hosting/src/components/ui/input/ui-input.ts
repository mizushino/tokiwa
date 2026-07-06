import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { tailwindCSS } from '@app/styles';

export type InputSize = 'sm' | 'md' | 'lg';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

/**
 * Generic text input component with an optional label, sizes, and error state.
 *
 * Usage:
 * ```ts
 * html`<ui-input label="Name" placeholder="Enter a name…" @input=${this.handleInput}></ui-input>`
 * html`<ui-input type="email" .value=${this.email} error="Invalid email"></ui-input>`
 * ```
 *
 * @fires input - Fired on each keystroke, detail: { value }.
 * @fires change - Fired when the value is committed, detail: { value }.
 */
@customElement('ui-input')
export class UiInput extends LitElement {
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override styles: CSSResultGroup = [
    tailwindCSS,
    css`
      :host {
        display: block;
      }
      :host([disabled]) {
        pointer-events: none;
      }
    `,
  ];

  @property({ type: String })
  value = '';

  @property({ type: String })
  type: InputType = 'text';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: String })
  name = '';

  @property({ type: String })
  error = '';

  @property({ type: String })
  autocomplete: AutoFill = '';

  @property({ type: String })
  inputId = '';

  @property({ type: String })
  size: InputSize = 'md';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean })
  required = false;

  private handleInput = (e: Event): void => {
    e.stopPropagation();
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  };

  private handleChange = (e: Event): void => {
    e.stopPropagation();
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  };

  private getSizeClasses(): string {
    const sizes: Record<InputSize, string> = {
      sm: 'px-2.5 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-3.5 py-2.5 text-base',
    };
    return sizes[this.size];
  }

  private getInputClasses(): string {
    const baseClasses =
      'block w-full rounded-lg border text-gray-900 transition-colors placeholder:text-gray-400 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500';
    const stateClasses = this.error
      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600';

    return `${baseClasses} ${stateClasses} ${this.getSizeClasses()}`;
  }

  protected override render(): TemplateResult {
    return html`
      ${this.label
        ? html`<label
            for="${ifDefined(this.inputId || undefined)}"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >${this.label}</label
          >`
        : ''}
      <input
        id="${ifDefined(this.inputId || undefined)}"
        class="${this.getInputClasses()}"
        type="${this.type}"
        .value=${this.value}
        placeholder="${this.placeholder}"
        name="${this.name}"
        .autocomplete=${this.autocomplete}
        ?disabled=${this.disabled}
        ?required=${this.required}
        @input=${this.handleInput}
        @change=${this.handleChange}
      />
      ${this.error ? html`<p class="mt-2 text-sm text-danger-600 dark:text-danger-400">${this.error}</p>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-input': UiInput;
  }
}
