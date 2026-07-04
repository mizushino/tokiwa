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

interface NavItem {
  label: string;
  path: string;
}

@customElement('default-index')
export class DefaultIndex extends PageElement {
  protected pageMetadata = pageMetadata;

  private readonly navItems: NavItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Hello World', path: '/helloworld/' },
    { label: 'Counter', path: '/counter/' },
    { label: 'Lit-Async', path: '/lit-async/' },
    { label: 'Firestore', path: '/firestore/' },
    { label: 'Functions', path: '/functions/' },
    { label: 'Buttons', path: '/buttons/' },
    { label: 'Checkboxes', path: '/checkboxes/' },
    { label: 'Dropdown', path: '/dropdown/' },
    { label: 'Modal', path: '/modal/' },
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
            <h1 class="text-xl font-bold">Sample Site</h1>
            <nav class="mt-3 flex flex-wrap gap-2">
              ${this.navItems.map(
                (item) => html`<ui-button size="sm" variant="soft" ${navigate(item.path)}>${item.label}</ui-button>`
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
