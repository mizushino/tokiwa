import { LitElement, type CSSResultGroup, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';

import { tailwindCSS } from '@app/styles';
import { transition } from '@app/transition';

/**
 * Dropdown size type
 */
export type DropdownSize = 'sm' | 'md' | 'lg';

/**
 * Dropdown menu component with trigger button and dropdown panel.
 *
 * Usage:
 * ```ts
 * html`
 *   <ui-dropdown size="md">
 *     <button slot="trigger">Options</button>
 *     <div slot="menu">
 *       <a href="#" class="block px-4 py-2 hover:bg-gray-100">Edit</a>
 *       <a href="#" class="block px-4 py-2 hover:bg-gray-100">Delete</a>
 *     </div>
 *   </ui-dropdown>
 * `
 * ```
 *
 * @slot trigger - Element used to toggle the menu.
 * @slot menu - Menu content rendered inside the dropdown panel.
 */
@customElement('ui-dropdown')
export class UiDropdown extends LitElement {
  static override styles: CSSResultGroup = [tailwindCSS];

  @property({ type: String })
  size: DropdownSize = 'md';

  @property({ type: String })
  placement: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' = 'bottom-start';

  @state()
  private isOpen = false;

  private readonly menuRef = createRef<HTMLElement>();
  private readonly triggerRef = createRef<HTMLElement>();
  private readonly triggerSlotRef = createRef<HTMLSlotElement>();

  private closeOnClickOutside = (event: MouseEvent): void => {
    if (!this.contains(event.target as Node)) {
      this.close();
    }
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.close();
      this.focusTrigger();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusNextItem();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusPreviousItem();
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.focusFirstItem();
    } else if (event.key === 'End') {
      event.preventDefault();
      this.focusLastItem();
    }
  };

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListeners();
  }

  private toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private open(): void {
    this.isOpen = true;
    this.addEventListeners();
    this.requestUpdate();
  }

  private close(): void {
    this.isOpen = false;
    this.removeEventListeners();
    this.requestUpdate();
  }

  private addEventListeners(): void {
    requestAnimationFrame(() => {
      document.addEventListener('click', this.closeOnClickOutside);
      document.addEventListener('keydown', this.handleKeyDown);
    });
  }

  private removeEventListeners(): void {
    document.removeEventListener('click', this.closeOnClickOutside);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private getFocusableItems(): HTMLElement[] {
    if (!this.menuRef.value) return [];

    const slot = this.menuRef.value.querySelector('slot[name="menu"]');
    if (!(slot instanceof HTMLSlotElement)) {
      return [];
    }

    const selector = 'a, button, [tabindex]:not([tabindex="-1"])';

    return slot.assignedElements({ flatten: true }).flatMap((element) => {
      const matches: HTMLElement[] = [];

      if (element instanceof HTMLElement && element.matches(selector)) {
        matches.push(element);
      }

      matches.push(...Array.from(element.querySelectorAll<HTMLElement>(selector)));
      return matches;
    });
  }

  private focusNextItem(): void {
    const items = this.getFocusableItems();
    if (items.length === 0) return;

    const currentIndex = items.findIndex((item) => item === document.activeElement);
    const nextIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    items[nextIndex]?.focus();
  }

  private focusPreviousItem(): void {
    const items = this.getFocusableItems();
    if (items.length === 0) return;

    const currentIndex = items.findIndex((item) => item === document.activeElement);
    const previousIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    items[previousIndex]?.focus();
  }

  private focusFirstItem(): void {
    const items = this.getFocusableItems();
    items[0]?.focus();
  }

  private focusLastItem(): void {
    const items = this.getFocusableItems();
    items[items.length - 1]?.focus();
  }

  private focusTrigger(): void {
    const assignedTrigger = this.triggerSlotRef.value?.assignedElements({ flatten: true })[0];
    if (assignedTrigger instanceof HTMLElement) {
      assignedTrigger.focus();
      return;
    }

    this.triggerRef.value?.focus();
  }

  private getMenuClasses(): string {
    const baseClasses =
      'absolute z-10 rounded-md bg-white shadow-sm ring-1 ring-gray-900/5 focus:outline-none dark:bg-gray-900 dark:ring-white/10';

    const sizeClasses: Record<DropdownSize, string> = {
      sm: 'min-w-[8rem]',
      md: 'min-w-[12rem]',
      lg: 'min-w-[16rem]',
    };

    const placementClasses: Record<typeof this.placement, string> = {
      'bottom-start': 'mt-2 left-0',
      'bottom-end': 'mt-2 right-0',
      'top-start': 'mb-2 bottom-full left-0',
      'top-end': 'mb-2 bottom-full right-0',
    };

    // Keep the menu mounted so transitions can manage visibility.
    const visibilityClass = !this.isOpen ? 'hidden' : '';

    return [baseClasses, sizeClasses[this.size], placementClasses[this.placement], visibilityClass]
      .filter((c) => c)
      .join(' ');
  }

  protected override render(): TemplateResult {
    return html`
      <div class="relative inline-block text-left">
        <div ${ref(this.triggerRef)} @click=${this.toggle} data-dropdown-trigger>
          <slot ${ref(this.triggerSlotRef)} name="trigger"></slot>
        </div>

        <div
          ${ref(this.menuRef)}
          ${transition(this.isOpen ? 'enter' : 'leave', {
            enter: 'transition ease-out duration-100',
            enterFrom: 'transform opacity-0 scale-95',
            enterTo: 'transform opacity-100 scale-100',
            leave: 'transition ease-in duration-75',
            leaveFrom: 'transform opacity-100 scale-100',
            leaveTo: 'transform opacity-0 scale-95',
          })}
          class="${this.getMenuClasses()}"
          data-dropdown-menu
          role="menu"
          aria-orientation="vertical"
          tabindex="-1"
        >
          <div class="py-1">
            <slot name="menu"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-dropdown': UiDropdown;
  }
}
