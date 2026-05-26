import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { tailwindCSS } from '@app/styles';

/**
 * Button variant type
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'soft';

/**
 * Button size type
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Generic button component with multiple variants and sizes.
 *
 * Usage:
 * ```ts
 * html`<ui-button variant="primary" size="md">Click me</ui-button>`
 * html`<ui-button variant="danger" size="sm" disabled>Delete</ui-button>`
 * html`<ui-button variant="soft" rounded loading>Loading...</ui-button>`
 * ```
 *
 * @slot - Button label content.
 */
@customElement('ui-button')
export class UiButton extends LitElement {
  static override styles: CSSResultGroup = [
    tailwindCSS,
    css`
      :host {
        display: inline-flex;
      }
      :host([fullwidth]) {
        display: block;
        width: 100%;
      }
    `,
  ];

  @property({ type: String })
  variant: ButtonVariant = 'primary';

  @property({ type: String })
  size: ButtonSize = 'md';

  @property({ type: String })
  type: 'button' | 'submit' | 'reset' = 'button';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean, reflect: true })
  fullWidth = false;

  @property({ type: Boolean })
  rounded = false;

  private getVariantClasses(): string {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-500 focus-visible:outline-primary-600 dark:bg-primary-500 dark:shadow-none dark:hover:bg-primary-400 dark:focus-visible:outline-primary-500',
      secondary:
        'bg-secondary-600 text-white hover:bg-secondary-500 focus-visible:outline-secondary-600 dark:bg-secondary-500 dark:shadow-none dark:hover:bg-secondary-400 dark:focus-visible:outline-secondary-500',
      success:
        'bg-success-600 text-white hover:bg-success-500 focus-visible:outline-success-600 dark:bg-success-500 dark:shadow-none dark:hover:bg-success-400 dark:focus-visible:outline-success-500',
      danger:
        'bg-danger-600 text-white hover:bg-danger-500 focus-visible:outline-danger-600 dark:bg-danger-500 dark:shadow-none dark:hover:bg-danger-400 dark:focus-visible:outline-danger-500',
      warning:
        'bg-warning-600 text-white hover:bg-warning-500 focus-visible:outline-warning-600 dark:bg-warning-500 dark:shadow-none dark:hover:bg-warning-400 dark:focus-visible:outline-warning-500',
      info: 'bg-info-600 text-white hover:bg-info-500 focus-visible:outline-info-600 dark:bg-info-500 dark:shadow-none dark:hover:bg-info-400 dark:focus-visible:outline-info-500',
      soft: 'bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-500/20 dark:text-primary-400 dark:shadow-none dark:hover:bg-primary-500/30',
    };

    return `${baseClasses} ${variants[this.variant]}`;
  }

  private getSizeClasses(): string {
    if (this.rounded) {
      const roundedSizes: Record<ButtonSize, string> = {
        xs: 'rounded-full px-2.5 py-1 text-xs',
        sm: 'rounded-full px-2.5 py-1 text-sm',
        md: 'rounded-full px-3 py-1.5 text-sm',
        lg: 'rounded-full px-3.5 py-2 text-sm',
        xl: 'rounded-full px-4 py-2.5 text-sm',
      };
      return roundedSizes[this.size];
    }

    const sizes: Record<ButtonSize, string> = {
      xs: 'rounded-sm px-2 py-1 text-xs',
      sm: 'rounded-sm px-2 py-1 text-sm',
      md: 'rounded-md px-2.5 py-1.5 text-sm',
      lg: 'rounded-md px-3 py-2 text-sm',
      xl: 'rounded-md px-3.5 py-2.5 text-sm',
    };

    return sizes[this.size];
  }

  private renderSpinner(): TemplateResult {
    return html`
      <svg
        class="mr-2 -ml-1 size-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    `;
  }

  protected override render(): TemplateResult {
    const classes = [
      this.getVariantClasses(),
      this.getSizeClasses(),
      this.fullWidth && 'w-full',
      (this.disabled || this.loading) && 'disabled:cursor-not-allowed disabled:opacity-50',
    ]
      .filter(Boolean)
      .join(' ');

    return html`
      <button type="${this.type}" ?disabled=${this.disabled || this.loading} class="${classes}">
        ${this.loading ? this.renderSpinner() : ''}<slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-button': UiButton;
  }
}
