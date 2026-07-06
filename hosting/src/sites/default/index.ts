import { Routes } from '@lit-labs/router';
import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { navigate, PageElement } from '@app/page';

import pageMetadata from './page.json';

import './helloworld';
import './counter';
import './lit-async';
import './firestore';
import './functions';
import './buttons';
import './checkboxes';
import './dropdown';
import './modal';

import '@components/ui/button/ui-button';
import '@components/ui/language-switcher/ui-language-switcher';

interface NavItem {
  key: string;
  path: string;
}

@customElement('default-index')
export class DefaultIndex extends PageElement {
  protected pageMetadata = pageMetadata;

  private readonly navItems: NavItem[] = [
    { key: 'nav_home', path: '/' },
    { key: 'nav_helloworld', path: '/helloworld/' },
    { key: 'nav_counter', path: '/counter/' },
    { key: 'nav_lit_async', path: '/lit-async/' },
    { key: 'nav_firestore', path: '/firestore/' },
    { key: 'nav_functions', path: '/functions/' },
    { key: 'nav_buttons', path: '/buttons/' },
    { key: 'nav_checkboxes', path: '/checkboxes/' },
    { key: 'nav_dropdown', path: '/dropdown/' },
    { key: 'nav_modal', path: '/modal/' },
  ];

  protected routes = new Routes(
    this,
    [
      { path: '', render: () => html`<default-helloworld></default-helloworld>` },
      { path: 'helloworld/', render: () => html`<default-helloworld></default-helloworld>` },
      { path: 'counter/', render: () => html`<default-counter></default-counter>` },
      { path: 'lit-async/', render: () => html`<default-lit-async></default-lit-async>` },
      { path: 'firestore/', render: () => html`<default-firestore></default-firestore>` },
      { path: 'functions/', render: () => html`<default-functions></default-functions>` },
      { path: 'buttons/', render: () => html`<default-buttons></default-buttons>` },
      { path: 'checkboxes/', render: () => html`<default-checkboxes></default-checkboxes>` },
      { path: 'dropdown/', render: () => html`<default-dropdown></default-dropdown>` },
      { path: 'modal/', render: () => html`<default-modal></default-modal>` },
    ],
    { fallback: { render: () => html`` } }
  );

  protected override renderContents(): TemplateResult {
    return html`
      <div class="min-h-full w-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white dark:scheme-dark">
        <header class="border-b border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900">
          <div class="mx-auto max-w-4xl px-4 py-4">
            <div class="flex items-center justify-between gap-4">
              <h1 class="text-xl font-bold">${this.trans('site_title')}</h1>
              <ui-language-switcher variant="soft"></ui-language-switcher>
            </div>
            <nav class="mt-3 flex flex-wrap gap-2">
              ${this.navItems.map(
                (item) =>
                  html`<ui-button size="sm" variant="soft" ${navigate(item.path)}>${this.trans(item.key)}</ui-button>`
              )}
            </nav>
          </div>
        </header>
        <main>${this.routes.outlet()}</main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-index': DefaultIndex;
  }
}
