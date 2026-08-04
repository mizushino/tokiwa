import { createElement, type IconNode } from 'lucide';
import { css, LitElement, nothing, type CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { tailwindCSS } from '@app/styles';

/**
 * Renders a tree-shakable Lucide icon inside Shadow DOM.
 *
 * @example
 * ```ts
 * html`<ui-icon class="size-5" .icon=${CircleCheck}></ui-icon>`
 * ```
 */
@customElement('ui-icon')
export class UiIcon extends LitElement {
  static override styles: CSSResultGroup = [
    tailwindCSS,
    css`
      :host {
        display: inline-flex;
        flex: none;
      }
    `,
  ];

  @property({ attribute: false })
  icon?: IconNode;

  @property({ type: Number, attribute: 'stroke-width' })
  strokeWidth = 2;

  protected override render(): SVGElement | typeof nothing {
    if (!this.icon) {
      return nothing;
    }

    return createElement(this.icon, {
      width: '100%',
      height: '100%',
      'stroke-width': String(this.strokeWidth),
      'aria-hidden': 'true',
      focusable: 'false',
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-icon': UiIcon;
  }
}
