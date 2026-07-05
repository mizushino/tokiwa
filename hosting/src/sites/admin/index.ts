import { Routes } from '@lit-labs/router';
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { track } from 'lit-async';

import { signOut, userSnapshot } from '@app/auth';
import { getPreferredLanguage, setPreferredLanguage, type SupportedLanguage } from '@app/i18n';
import { PageElement } from '@app/page';
import type { SidebarNavItem } from '@components/ui/sidebar/ui-sidebar';
import { subscribeToUserDocument } from '@models/user';

import pageMetadata from './page.json';

import '@components/ui/sidebar/ui-sidebar';
import '@components/ui/button/ui-button';
import './login';
import './helloworld';

@customElement('admin-index')
export class AdminIndex extends PageElement {
  protected pageMetadata = pageMetadata;

  protected currentUser: User | null = null;

  @state()
  protected isAdmin: boolean | undefined = undefined;

  private subscribedUid: string | null = null;

  private unsubscribeUserDoc: Unsubscribe | null = null;

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopUserDocSubscription();
  }

  private stopUserDocSubscription(): void {
    if (this.unsubscribeUserDoc) {
      this.unsubscribeUserDoc();
      this.unsubscribeUserDoc = null;
      this.subscribedUid = null;
    }
  }

  private startUserDocSubscription(uid: string): void {
    if (this.subscribedUid === uid && this.unsubscribeUserDoc) {
      return;
    }

    this.stopUserDocSubscription();

    this.subscribedUid = uid;
    this.unsubscribeUserDoc = subscribeToUserDocument(uid, (userData) => {
      const newIsAdmin = userData?.admin === true;

      if (this.isAdmin !== newIsAdmin) {
        this.isAdmin = newIsAdmin;
      }
    });
  }

  protected routes = new Routes(
    this,
    [
      {
        path: '',
        render: () => {
          return html`<admin-helloworld name="Dashboard"></admin-helloworld>`;
        },
      },
      {
        path: 'dashboard/',
        render: () => {
          return html`<admin-helloworld name="Dashboard"></admin-helloworld>`;
        },
      },
      {
        path: 'helloworld/',
        render: () => {
          return html`<admin-helloworld name="World"></admin-helloworld>`;
        },
      },
    ],
    {
      fallback: { render: () => html`<div class="text-gray-900 dark:text-white">${this.trans('not_found')}</div>` },
    }
  );

  protected get navItems(): SidebarNavItem[] {
    return [
      {
        label: this.trans('nav_dashboard'),
        href: '/dashboard/',
        icon: html`<i class="fa-solid fa-gauge-high py-0.5 text-xl"></i>`,
        badge: 5,
      },
      {
        label: this.trans('nav_helloworld'),
        href: '/helloworld/',
        icon: html`<i class="fa-solid fa-globe py-0.5 text-xl"></i>`,
      },
    ];
  }

  private renderLanguageSwitcher(): TemplateResult {
    const target: SupportedLanguage = getPreferredLanguage() === 'en' ? 'ja' : 'en';
    const label = target === 'ja' ? '日本語' : 'English';
    return html`<ui-button size="sm" variant="secondary" fullWidth @click=${() => setPreferredLanguage(target)}
      >${label}</ui-button
    >`;
  }

  private async handleUserClick(): Promise<void> {
    this.stopUserDocSubscription();
    await signOut();
    this.isAdmin = undefined;
    this.requestUpdate();
  }

  protected renderAccessDenied(): TemplateResult {
    return html`
      <div class="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${this.trans('access_denied_title')}</h1>
          <p class="mt-2 text-gray-500 dark:text-gray-400">${this.trans('access_denied_message')}</p>
          <ui-button class="mt-4" variant="primary" @click=${this.handleUserClick}>${this.trans('logout')}</ui-button>
        </div>
      </div>
    `;
  }

  protected renderContents(): TemplateResult {
    return html`
      <div class="flex h-full min-h-180 bg-white dark:bg-gray-900 dark:scheme-dark">
        <ui-sidebar
          class="block h-full w-72"
          .currentUser=${this.currentUser}
          .navItems=${this.navItems}
          @user-click=${this.handleUserClick}
        >
          <div slot="actions" class="px-3 pb-3">${this.renderLanguageSwitcher()}</div>
          <svg
            slot="logo"
            class="size-8 text-primary-500 dark:text-primary-400"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-label="Admin Panel"
            role="img"
          >
            <path
              d="M12 2 3 6.5v11L12 22l9-4.5v-11L12 2Zm0 2.3 6.5 3.25v.02L12 10.8 5.5 7.57v-.02L12 4.3ZM5 9.3l6 3v7.4l-6-3V9.3Zm14 0v7.4l-6 3v-7.4l6-3Z"
            />
          </svg>
        </ui-sidebar>
        <div class="h-full w-full overflow-y-auto">${this.routes.outlet()}</div>
      </div>
    `;
  }

  protected user = userSnapshot();

  protected override render(): TemplateResult {
    return html`${track(this.user, (user) => {
      if (user === undefined) {
        return html`<div class="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
          <div class="text-gray-500 dark:text-gray-400">${this.trans('loading')}</div>
        </div>`;
      }

      this.currentUser = user as unknown as User;

      if (!user) {
        this.stopUserDocSubscription();
        this.isAdmin = undefined;
        return html`<admin-login></admin-login>`;
      }

      this.startUserDocSubscription(user.uid);

      if (this.isAdmin === undefined) {
        return html`<div class="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
          <div class="text-gray-500 dark:text-gray-400">${this.trans('checking_permission')}</div>
        </div>`;
      }

      if (!this.isAdmin) {
        return this.renderAccessDenied();
      }

      return this.renderContents();
    })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-index': AdminIndex;
  }
}
