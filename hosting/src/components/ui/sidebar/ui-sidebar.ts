import type { User } from 'firebase/auth';
import { LitElement, type CSSResultGroup, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { Navigate } from '@app/page';
import { tailwindCSS } from '@app/styles';

/**
 * Navigation item definition for the sidebar.
 */
export interface SidebarNavItem {
  label: string;
  href?: string;
  icon?: TemplateResult;
  badge?: string | number;
  active?: boolean;
  divider?: boolean;
}

/**
 * Sidebar navigation component with branded header, navigation links, and user profile actions.
 *
 * Usage:
 * ```ts
 * html`
 *   <ui-sidebar
 *     .currentUser=${user}
 *     .navItems=${items}
 *     @userclick=${this.handleUserClick}
 *   >
 *     <img slot="logo" src="/logo.svg" alt="Tokiwa" class="h-8" />
 *   </ui-sidebar>
 * `
 * ```
 *
 * @slot logo - Branded content shown at the top of the sidebar.
 * @fires userclick - Fired when the current user profile section is pressed.
 */
@customElement('ui-sidebar')
export class UiSidebar extends LitElement {
  static override styles: CSSResultGroup = [tailwindCSS];

  @property({ type: Object })
  currentUser?: User | null;

  @property({ type: Array })
  navItems: SidebarNavItem[] = [];

  private handleUserClick(e: Event): void {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('userclick', { bubbles: true, composed: true }));
  }

  private async handleNavClick(e: Event, item: SidebarNavItem): Promise<void> {
    if (item.href && item.href !== '#') {
      e.preventDefault();
      await Navigate.to(item.href);
    }
  }

  private renderNavItem(item: SidebarNavItem): TemplateResult {
    // Render section headers as non-interactive dividers.
    if (item.divider) {
      return html`<li class="mx-2">
        <div class="-mx-2 mt-2 text-xs/6 font-semibold text-gray-400">${item.label}</div>
      </li>`;
    }

    // Derive the active state from the current location.
    const isActive = item.href === window.location.pathname;

    // Render standard navigation items as links.
    const classes = isActive
      ? 'group flex gap-x-3 rounded-md bg-white/5 p-2 text-sm/6 font-semibold text-white'
      : 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-white/5 hover:text-white';

    return html`
      <li>
        <a href="${ifDefined(item.href)}" class="${classes}" @click=${(e: Event) => this.handleNavClick(e, item)}>
          ${item.icon} ${item.label}
          ${item.badge
            ? html`<span
                aria-hidden="true"
                class="ml-auto w-9 min-w-max rounded-full bg-gray-900 px-2.5 py-0.5 text-center text-xs/5 font-medium whitespace-nowrap text-white outline-1 -outline-offset-1 outline-white/15"
                >${item.badge}</span
              >`
            : ''}
        </a>
      </li>
    `;
  }

  private renderProfile(): TemplateResult | string {
    if (!this.currentUser) {
      return '';
    }

    return html`
      <a
        href="#"
        class="flex items-center gap-x-4 px-3 py-3 text-sm/6 font-semibold text-white hover:bg-white/5"
        @click=${this.handleUserClick}
      >
        <img
          src="${this.currentUser?.photoURL || 'https://www.gravatar.com/avatar/?d=mp'}"
          alt=""
          class="size-8 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10"
        />
        <span class="sr-only">Your profile</span>
        <span aria-hidden="true">${this.currentUser?.displayName || this.currentUser?.email || 'User'}</span>
      </a>
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <div
        class="relative flex h-full flex-col gap-y-5 bg-gray-900 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:border-r dark:before:border-white/10 dark:before:bg-black/10"
      >
        <div class="relative flex h-16 shrink-0 items-center justify-center">
          <slot name="logo">
            <i class="fa-solid fa-cube text-primary-500 dark:text-primary-400 text-4xl"></i>
          </slot>
        </div>
        <nav class="relative flex flex-1 flex-col overflow-y-auto">
          <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" class="mx-2 space-y-1">
                ${this.navItems.map((item) => this.renderNavItem(item))}
              </ul>
            </li>
          </ul>
        </nav>
        <div class="shrink-0">${this.renderProfile()}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-sidebar': UiSidebar;
  }
}
