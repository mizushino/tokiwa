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
import './login';
import './helloworld';
import './buttons';
import './modal';
import './checkboxes';
import './dropdown';

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
    // 既に同じユーザーを監視中なら何もしない
    if (this.subscribedUid === uid && this.unsubscribeUserDoc) {
      return;
    }

    // 既存の監視を停止
    this.stopUserDocSubscription();

    this.subscribedUid = uid;
    this.unsubscribeUserDoc = subscribeToUserDocument(uid, (userData) => {
      const newIsAdmin = userData?.admin === true;

      // 権限が変更された場合のみ更新
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
      {
        path: 'buttons/',
        render: () => {
          return html`<admin-buttons></admin-buttons>`;
        },
      },
      {
        path: 'modal/',
        render: () => {
          return html`<admin-modal></admin-modal>`;
        },
      },
      {
        path: 'checkboxes/',
        render: () => {
          return html`<admin-checkboxes></admin-checkboxes>`;
        },
      },
      {
        path: 'dropdown/',
        render: () => {
          return html`<admin-dropdown></admin-dropdown>`;
        },
      },
    ],
    {
      fallback: { render: () => html`<div class="text-white">Not Found</div>` },
    }
  );

  protected get navItems(): SidebarNavItem[] {
    return [
      {
        label: 'Samples',
        divider: true,
      },
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
      {
        label: 'Buttons',
        href: '/buttons/',
        icon: html`<i class="fa-solid fa-cube py-0.5 text-xl"></i>`,
      },
      {
        label: 'Modal',
        href: '/modal/',
        icon: html`<i class="fa-regular fa-window-restore py-0.5 text-xl"></i>`,
      },
      {
        label: 'Checkboxes',
        href: '/checkboxes/',
        icon: html`<i class="fa-solid fa-check-square py-0.5 text-xl"></i>`,
      },
      {
        label: 'Dropdown',
        href: '/dropdown/',
        icon: html`<i class="fa-solid fa-chevron-down py-0.5 text-xl"></i>`,
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
      <div class="flex min-h-screen items-center justify-center bg-gray-900">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-white">アクセス権限がありません</h1>
          <p class="mt-2 text-gray-400">このページは管理者のみアクセス可能です。</p>
          <button
            @click=${this.handleUserClick}
            class="bg-indio-600 mt-4 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500"
          >
            g ログアウト
          </button>
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
          @userclick=${this.handleUserClick}
        ></ui-sidebar>
        <div class="h-full w-full overflow-y-auto">${this.routes.outlet()}</div>
      </div>
    `;
  }

  protected user = userSnapshot();

  protected override render(): TemplateResult {
    return html`${track(this.user, (user) => {
      if (user === undefined) {
        return html`<div class="flex min-h-screen items-center justify-center bg-gray-900">
          <div class="text-white">Loading...</div>
        </div>`;
      }

      this.currentUser = user as unknown as User;

      // ログインしていない場合
      if (!user) {
        this.stopUserDocSubscription();
        this.isAdmin = undefined;
        return html`<admin-login></admin-login>`;
      }

      // ユーザードキュメントのリアルタイム監視を開始
      // admin フラグが変更されたら自動的に isAdmin が更新される
      this.startUserDocSubscription(user.uid);

      // まだ初回データを取得していない場合はローディング表示
      if (this.isAdmin === undefined) {
        return html`<div class="flex min-h-screen items-center justify-center bg-gray-900">
          <div class="text-white">権限を確認中...</div>
        </div>`;
      }

      // admin 権限がない場合
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
