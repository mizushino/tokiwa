import { Routes } from '@lit-labs/router';
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { track } from 'lit-async';

import { signOut, userSnapshot } from '@app/auth';
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

  /**
   * ユーザーが admin 権限を持っているかどうか
   * undefined: 判定中, true: admin, false: 非admin
   */
  @state()
  protected isAdmin: boolean | undefined = undefined;

  /**
   * 現在監視中のユーザーID
   */
  private subscribedUid: string | null = null;

  /**
   * ユーザードキュメントのリアルタイム監視を停止する関数
   */
  private unsubscribeUserDoc: Unsubscribe | null = null;

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopUserDocSubscription();
  }

  /**
   * ユーザードキュメントの監視を停止
   */
  private stopUserDocSubscription(): void {
    if (this.unsubscribeUserDoc) {
      this.unsubscribeUserDoc();
      this.unsubscribeUserDoc = null;
      this.subscribedUid = null;
    }
  }

  /**
   * ユーザードキュメントのリアルタイム監視を開始
   * admin フラグが変更されたら自動的に isAdmin を更新
   */
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
      fallback: { render: () => html`<div class="text-gray-900 dark:text-white">Not Found</div>` },
    }
  );

  protected get navItems(): SidebarNavItem[] {
    return [
      {
        label: 'Dashboard',
        href: '/dashboard/',
        icon: html`<i class="fa-solid fa-gauge-high py-0.5 text-xl"></i>`,
        badge: 5,
      },
      {
        label: 'Hello World',
        href: '/helloworld/',
        icon: html`<i class="fa-solid fa-globe py-0.5 text-xl"></i>`,
      },
    ];
  }

  private async handleUserClick(): Promise<void> {
    this.stopUserDocSubscription();
    await signOut();
    this.isAdmin = undefined;
    this.requestUpdate();
  }

  /**
   * 非管理者用のアクセス拒否画面
   */
  protected renderAccessDenied(): TemplateResult {
    return html`
      <div class="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">アクセス権限がありません</h1>
          <p class="mt-2 text-gray-500 dark:text-gray-400">このページは管理者のみアクセス可能です。</p>
          <ui-button class="mt-4" variant="primary" @click=${this.handleUserClick}>ログアウト</ui-button>
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
          <div class="text-gray-500 dark:text-gray-400">Loading...</div>
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
          <div class="text-gray-500 dark:text-gray-400">権限を確認中...</div>
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
